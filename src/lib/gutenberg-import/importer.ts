/**
 * Gutenberg import pipeline orchestrator.
 * Steps 0–9: fetch metadata → create work → fetch text → split chapters →
 * create sections → generate glossary → generate characters → QA → publish.
 */

import { prisma } from '@/lib/database/PrismaService'
import { fetchGutenbergText, stripGutenbergWrapper, splitIntoChapters, countWords } from './fetch-text'
import { generateGlossaryForWork } from './generate-glossary'
import { generateCharactersForWork } from './generate-characters'

// ── Genre mapping ────────────────────────────────────────────────────────────

const GENRE_MAP: Record<string, string> = {
  adventure: 'Adventure',
  horror: 'Horror',
  gothic: 'Gothic',
  romance: 'Romance',
  mystery: 'Mystery',
  'science fiction': 'Science Fiction',
  historical: 'Historical Fiction',
  fantasy: 'Fantasy',
}

function mapGenres(subjects: string[], bookshelves: string[]): string[] {
  const all = [...subjects, ...bookshelves].map((s) => s.toLowerCase())
  const matched = new Set<string>()

  for (const [key, label] of Object.entries(GENRE_MAP)) {
    if (all.some((s) => s.includes(key))) {
      matched.add(label)
    }
  }

  if (matched.size === 0) return ['Classic', 'Literature']
  return Array.from(matched).slice(0, 3)
}

// ── Bot author ───────────────────────────────────────────────────────────────

async function ensureBotAuthor() {
  const botUser = await prisma.user.upsert({
    where: { email: 'bot-imports@chapturs.com' },
    create: {
      email: 'bot-imports@chapturs.com',
      username: 'chapturs_classics',
      displayName: 'Chapturs Classics',
      bio: 'Public domain literary works imported from Project Gutenberg.',
      verified: true,
      role: 'user',
    },
    update: {},
  })

  const botAuthor = await prisma.author.upsert({
    where: { userId: botUser.id },
    create: { userId: botUser.id, verified: true },
    update: {},
  })

  return { botUser, botAuthor }
}

// ── Metadata fetching ────────────────────────────────────────────────────────

async function fetchMetadata(gutenbergId: number) {
  const res = await fetch(`https://gutendex.com/books/${gutenbergId}`)
  if (!res.ok) throw new Error(`Could not fetch metadata from Gutendex: ${res.status}`)
  const data = await res.json()

  return {
    title: data.title || `Gutenberg #${gutenbergId}`,
    authors: data.authors || [],
    subjects: data.subjects || [],
    bookshelves: data.bookshelves || [],
    coverUrl: data.formats?.['image/jpeg'] || null,
  }
}

function buildDescription(metadata: any, gutenbergId: number): string {
  const author = metadata.authors[0]?.name || 'Unknown'
  const genres = mapGenres(metadata.subjects, metadata.bookshelves).join(', ')
  return `A classic work of ${genres.toLowerCase()} literature by ${author}. Public domain — imported from Project Gutenberg (Book #${gutenbergId}).`
}

// ── Main import function ─────────────────────────────────────────────────────

interface ImportOptions {
  maxChapters?: number
  maturityRating?: string
  dryRun?: boolean
}

interface ImportResult {
  status: 'imported' | 'already_imported' | 'dry_run'
  workId?: string
  title?: string
  author?: string
  sectionsCreated?: number
  glossaryTermsCreated?: number
  charactersCreated?: number
  coverUploaded?: boolean
  qaQueued?: boolean
  gutenbergId?: number
  estimatedChapters?: number
  coverAvailable?: boolean
}

export async function runGutenbergImport(
  gutenbergId: number,
  options: ImportOptions = {}
): Promise<ImportResult> {
  const { maxChapters = 150, maturityRating = 'PG', dryRun = false } = options

  // Step 0 — Idempotency check
  const idempotencyTag = `gutenberg:${gutenbergId}`
  const existing = await prisma.work.findFirst({
    where: { tags: { contains: idempotencyTag } },
  })
  if (existing) {
    return {
      status: 'already_imported',
      workId: existing.id,
      title: existing.title,
    }
  }

  // Step 1 — Fetch metadata
  const metadata = await fetchMetadata(gutenbergId)
  const authorName = metadata.authors[0]?.name || 'Unknown'
  const genres = mapGenres(metadata.subjects, metadata.bookshelves)

  // Dry run return
  if (dryRun) {
    return {
      status: 'dry_run',
      gutenbergId,
      title: metadata.title,
      author: authorName,
      estimatedChapters: 0, // Will know after fetching text
      coverAvailable: !!metadata.coverUrl,
    }
  }

  // Step 2 — Ensure bot author
  const { botAuthor } = await ensureBotAuthor()

  // Step 3 — Fetch and parse text
  const rawText = await fetchGutenbergText(gutenbergId)
  const cleanedText = stripGutenbergWrapper(rawText)
  const chapters = splitIntoChapters(cleanedText).slice(0, maxChapters)

  // Step 2 continued — Create work record
  const work = await prisma.work.create({
    data: {
      title: metadata.title,
      description: buildDescription(metadata, gutenbergId),
      authorId: botAuthor.id,
      formatType: 'novel',
      coverImage: null,
      status: 'draft',
      maturityRating,
      aiUseDisclosure: 'none',
      genres: JSON.stringify(genres),
      tags: JSON.stringify([
        'imported',
        'classic',
        'public domain',
        `author:${authorName}`,
        idempotencyTag,
      ]),
      statistics: JSON.stringify({ views: 0, likes: 0, comments: 0 }),
      glossary: null,
      viewCount: 0,
    },
  })

  // Post-create idempotency guard — if a concurrent import beat us to it,
  // clean up our duplicate and return the existing work.
  const raceWinner = await prisma.work.findFirst({
    where: {
      tags: { contains: idempotencyTag },
      id: { not: work.id },
    },
    orderBy: { createdAt: 'asc' },
  })
  if (raceWinner) {
    await prisma.work.delete({ where: { id: work.id } })
    return {
      status: 'already_imported',
      workId: raceWinner.id,
      title: raceWinner.title,
    }
  }

  // Step 5 — Create section records
  let sectionsCreated = 0
  const savedSections: any[] = []

  for (let i = 0; i < chapters.length; i++) {
    const chapter = chapters[i]
    // Wrap plain text in the Chapturs block format
    const content = JSON.stringify({
      blocks: [{ type: 'prose', text: chapter.content.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>') }],
    })

    const section = await prisma.section.create({
      data: {
        workId: work.id,
        title: chapter.title,
        content,
        wordCount: countWords(chapter.content),
        chapterNumber: i + 1,
        status: 'published',
        publishedAt: new Date(),
      },
    })
    savedSections.push(section)
    sectionsCreated++
  }

  // Step 6 — Generate AI glossary (asks LLM directly — no text parsing needed)
  let glossaryTermsCreated = 0
  try {
    glossaryTermsCreated = await generateGlossaryForWork(work.id, metadata.title, authorName)
  } catch (err) {
    console.error('Glossary generation failed:', err)
  }

  // Step 7 — Generate character profiles
  let charactersCreated = 0
  try {
    charactersCreated = await generateCharactersForWork(work.id, metadata.title, authorName)
  } catch (err) {
    console.error('Character generation failed:', err)
  }

  // Step 8 — Queue quality assessment
  let qaQueued = false
  try {
    const { queueForAssessment } = await import('@/lib/quality-assessment/assessment-service')
    if (savedSections.length > 0) {
      await queueForAssessment({
        workId: work.id,
        sectionId: savedSections[0].id,
        content: savedSections[0].content,
        metadata: {
          title: metadata.title,
          genres,
          tags: ['imported', 'classic', 'public domain'],
          formatType: 'novel',
          maturityRating,
        },
        priority: 'normal',
      } as any)
      qaQueued = true
    }
  } catch (err) {
    console.error('QA queuing failed:', err)
  }

  // Step 4 — Upload cover (after QA queue to avoid blocking)
  let coverUploaded = false
  if (metadata.coverUrl) {
    try {
      // For now, just use the Gutenberg cover URL directly
      await prisma.work.update({
        where: { id: work.id },
        data: { coverImage: metadata.coverUrl },
      })
      coverUploaded = true
    } catch (err) {
      console.error('Cover upload failed:', err)
    }
  }

  // Step 9 — Publish
  await prisma.work.update({
    where: { id: work.id },
    data: {
      status: 'completed',
      updatedAt: new Date(),
    },
  })

  return {
    status: 'imported',
    workId: work.id,
    title: metadata.title,
    author: authorName,
    sectionsCreated,
    glossaryTermsCreated,
    charactersCreated,
    coverUploaded,
    qaQueued,
  }
}
