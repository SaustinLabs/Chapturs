import { prisma } from '@/lib/database/PrismaService'
import { parseGutenbergId } from './parse-url'
import { fetchGutendexMetadata, mapGenres, buildDescription, getCoverUrl, type GutendexBook } from './fetch-metadata'
import { stripGutenbergWrapper, splitIntoChapters, countWords } from './parse-chapters'
import { ensureBotAuthor } from './bot-user'
import { uploadCoverToR2 } from './upload-cover'
import { generateGlossaryForWork } from './generate-glossary'
import { generateCharactersForWork } from './generate-characters'

export interface ImportOptions {
  maxChapters?: number
  maturityRating?: string
  dryRun?: boolean
}

export type ImportResult =
  | { status: 'already_imported'; workId: string; title: string }
  | { status: 'dry_run'; gutenbergId: number; title: string; author: string; estimatedChapters: number; coverAvailable: boolean }
  | { status: 'imported'; workId: string; title: string; author: string; sectionsCreated: number; glossaryTermsQueued: number; charactersCreated: number; coverUploaded: boolean; qaQueued: boolean }

/**
 * Main orchestrator for the Gutenberg import pipeline (Steps 0-9).
 */
export async function runGutenbergImport(
  gutenbergId: number,
  options: ImportOptions = {},
): Promise<ImportResult> {
  const dryRun = !!options.dryRun

  // Step 0 — Idempotency check
  const idempotencyTag = `gutenberg:${gutenbergId}`
  const existing = await prisma.work.findFirst({
    where: { tags: { contains: idempotencyTag } },
  })
  if (existing) {
    return { status: 'already_imported', workId: existing.id, title: existing.title }
  }

  // Step 1 — Fetch metadata from Gutendex
  const metadata = await fetchGutendexMetadata(gutenbergId)
  if (!metadata) {
    throw new Error('Could not fetch book metadata from Gutendex')
  }

  const mappedGenres = mapGenres(metadata)
  const description = buildDescription(metadata)
  const coverUrl = getCoverUrl(metadata)

  if (dryRun) {
    // Dry run: return preview without creating anything
    return {
      status: 'dry_run',
      gutenbergId,
      title: metadata.title,
      author: metadata.authors[0]?.name ?? 'Unknown',
      estimatedChapters: Math.ceil(countWords(stripGutenbergWrapper('')) / 3000), // rough estimate
      coverAvailable: !!coverUrl,
    }
  }

  // Step 1 (continued) — Fetch the actual text for chapter splitting
  const rawText = await fetchGutenbergText(gutenbergId)
  const cleanedText = stripGutenbergWrapper(rawText)
  const chapters = splitIntoChapters(cleanedText).slice(0, options.maxChapters ?? 150)

  // Step 2 — Create Work record (with bot author)
  const { botAuthor } = await ensureBotAuthor()

  const work = await prisma.work.create({
    data: {
      title:          metadata.title,
      description:    description,
      authorId:       botAuthor.id,
      formatType:     'novel',
      coverImage:     null, // filled in Step 4
      status:         'draft', // promoted to completed in Step 9
      maturityRating: options.maturityRating ?? 'PG',
      aiUseDisclosure: 'none', // public domain, no AI writing involved
      genres:         JSON.stringify(mappedGenres),
      tags:           JSON.stringify([
        'imported',
        'classic',
        'public domain',
        `author:${metadata.authors[0]?.name ?? 'Unknown'}`,
        idempotencyTag, // idempotency tag
      ]),
      statistics:     JSON.stringify({ views: 0, likes: 0, comments: 0 }),
      glossary:       null,
      viewCount:      0,
    },
  })

  console.log(`[GutenbergImport] Created work #${work.id}: ${metadata.title}`)

  // Step 4 — Upload cover image to R2 (non-fatal if it fails)
  let coverUploaded = false
  if (coverUrl) {
    const uploadedCover = await uploadCoverToR2(gutenbergId, coverUrl)
    if (uploadedCover) {
      await prisma.work.update({
        where: { id: work.id },
        data:  { coverImage: uploadedCover },
      })
      coverUploaded = true
      console.log(`[GutenbergImport] Cover uploaded for ${metadata.title}`)
    }
  }

  // Step 5 — Create Section records (chapters) sequentially
  let sectionsCreated = 0
  const sampleText: string[] = [] // For glossary/character generation (first ~3000 words)

  for (let i = 0; i < chapters.length && i < (options.maxChapters ?? 150); i++) {
    try {
      const chapter = chapters[i]
      await prisma.section.create({
        data: {
          workId:        work.id,
          title:         chapter.title,
          content:       JSON.stringify({
            blocks: [{ type: 'prose', text: chapter.content.trim() }]
          }),
          wordCount:     countWords(chapter.content),
          chapterNumber: i + 1,
          status:        'published',
          publishedAt:   new Date(),
        },
      })

      sectionsCreated++

      // Collect sample text for AI pipelines (first ~3000 words)
      if (sampleText.length < 3000) {
        const words = chapter.content.trim().split(/\s+/).slice(0, 3000 - sampleText.length)
        sampleText.push(...words)
      }

      console.log(`[GutenbergImport] Created section ${i + 1}/${chapters.length}: ${chapter.title}`)
    } catch (err) {
      // Non-fatal: log and skip this section, continue with others
      console.error(`[GutenbergImport] Failed to create section ${i + 1}:`, err)
    }
  }

  const sampleTextStr = sampleText.join(' ')

  // Step 6 — Trigger AI glossary generation (non-fatal if it fails)
  let glossaryTermsQueued = 0
  try {
    glossaryTermsQueued = await generateGlossaryForWork(work.id, metadata.title, sampleTextStr)
    console.log(`[GutenbergImport] Generated ${glossaryTermsQueued} glossary entries`)
  } catch (err) {
    console.error('[GutenbergImport] Glossary generation failed:', err)
  }

  // Step 7 — Trigger character profile generation (non-fatal if it fails)
  let charactersCreated = 0
  try {
    charactersCreated = await generateCharactersForWork(work.id, metadata.title, sampleTextStr)
    console.log(`[GutenbergImport] Generated ${charactersCreated} character profiles`)
  } catch (err) {
    console.error('[GutenbergImport] Character generation failed:', err)
  }

  // Step 8 — Queue first section for QA (non-fatal if it fails)
  let qaQueued = false
  try {
    const firstSection = await prisma.section.findFirst({ where: { workId: work.id }, orderBy: { chapterNumber: 'asc' } })
    if (firstSection) {
      // Queue for assessment via the existing QA service
      // This calls the internal queue — not an HTTP call
      const { queueForAssessment } = await import('@/lib/quality-assessment/assessment-service')
      await queueForAssessment({
        workId:    work.id,
        sectionId: firstSection.id,
        content:   firstSection.content,
        metadata: {
          title:         work.title,
          genres:        JSON.parse(work.genres),
          tags:          JSON.parse(work.tags),
          formatType:    work.formatType,
          maturityRating: work.maturityRating,
        },
        priority: 'normal',
      })
      qaQueued = true
      console.log(`[GutenbergImport] QA queued for first section`)
    }
  } catch (err) {
    console.error('[GutenbergImport] QA queue failed:', err)
  }

  // Step 9 — Publish the Work
  await prisma.work.update({
    where: { id: work.id },
    data: {
      status:    'completed', // public domain works are "completed"
      updatedAt: new Date(),
    },
  })

  return {
    status: 'imported',
    workId: work.id,
    title: metadata.title,
    author: metadata.authors[0]?.name ?? 'Unknown',
    sectionsCreated,
    glossaryTermsQueued,
    charactersCreated,
    coverUploaded,
    qaQueued,
  }
}

/**
 * Fetch plain text from Project Gutenberg (primary CDN + fallback).
 */
async function fetchGutenbergText(id: number): Promise<string> {
  // Try primary CDN first
  const primary = `https://www.gutenberg.org/cache/epub/${id}/pg${id}.txt`
  try {
    const res = await fetch(primary, { signal: AbortSignal.timeout(30_000) })
    if (res.ok) return await res.text()
  } catch {}

  // Fallback to alternate mirror
  const fallback = `https://www.gutenberg.org/files/${id}/${id}-0.txt`
  const res = await fetch(fallback, { signal: AbortSignal.timeout(30_000) })
  if (!res.ok) throw new Error(`Could not fetch Gutenberg text for book ${id}: ${res.status}`)
  return await res.text()
}
