export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database/PrismaService'

interface RouteParams {
  params: Promise<{ id: string; characterId: string }>
}

// Strip HTML tags and decode basic entities
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

// Extract plain text from a single content block
function extractBlockText(block: any): string {
  if (!block || !block.type) return ''

  switch (block.type) {
    case 'prose':
    case 'text':
      return stripHtml(block.text || block.content || '')

    case 'heading':
      return stripHtml(block.text || '')

    case 'narration':
      return stripHtml(block.text || '')

    case 'dialogue': {
      const lines: string[] = []
      if (Array.isArray(block.lines)) {
        for (const line of block.lines) {
          const speaker = line.speaker ? `${line.speaker}: ` : ''
          lines.push(speaker + stripHtml(line.text || ''))
        }
      }
      return lines.join(' ')
    }

    case 'chat': {
      const msgs: string[] = []
      if (Array.isArray(block.messages)) {
        for (const msg of block.messages) {
          const sender = msg.sender ? `${msg.sender}: ` : ''
          msgs.push(sender + stripHtml(msg.text || msg.content || ''))
        }
      }
      return msgs.join(' ')
    }

    case 'phone': {
      const lines: string[] = []
      if (Array.isArray(block.screens)) {
        for (const screen of block.screens) {
          if (Array.isArray(screen.messages)) {
            for (const msg of screen.messages) {
              lines.push(stripHtml(msg.text || msg.content || ''))
            }
          }
        }
      }
      return lines.join(' ')
    }

    default:
      return ''
  }
}

// Find the 1-2 sentences surrounding the first occurrence of `name`
function extractSnippet(fullText: string, name: string, aliases: string[]): string | null {
  const searchTerms = [name, ...aliases].filter(Boolean)
  let matchIndex = -1

  for (const term of searchTerms) {
    const idx = fullText.toLowerCase().indexOf(term.toLowerCase())
    if (idx !== -1 && (matchIndex === -1 || idx < matchIndex)) {
      matchIndex = idx
    }
  }

  if (matchIndex === -1) return null

  // Split into sentences (rough: split on ., !, ? followed by space or end)
  // Work with character positions
  const sentenceRegex = /[^.!?]*[.!?]+(\s|$)/g
  const sentences: Array<{ text: string; start: number; end: number }> = []
  let match: RegExpExecArray | null

  // eslint-disable-next-line no-cond-assign
  while ((match = sentenceRegex.exec(fullText)) !== null) {
    sentences.push({ text: match[0], start: match.index, end: match.index + match[0].length })
  }

  // If no sentence splits found, return a character-window around the match
  if (sentences.length === 0) {
    const start = Math.max(0, matchIndex - 100)
    const end = Math.min(fullText.length, matchIndex + 200)
    return (start > 0 ? '…' : '') + fullText.slice(start, end).trim() + (end < fullText.length ? '…' : '')
  }

  // Find which sentence the match falls in
  const sentenceIdx = sentences.findIndex((s) => s.start <= matchIndex && matchIndex < s.end)
  if (sentenceIdx === -1) {
    // Fall back to character window
    const start = Math.max(0, matchIndex - 100)
    const end = Math.min(fullText.length, matchIndex + 200)
    return (start > 0 ? '…' : '') + fullText.slice(start, end).trim() + (end < fullText.length ? '…' : '')
  }

  // Return this sentence plus optionally the next
  const parts = [sentences[sentenceIdx].text]
  if (sentenceIdx + 1 < sentences.length) {
    parts.push(sentences[sentenceIdx + 1].text)
  }

  const snippet = parts.join('').trim()
  const prefix = sentenceIdx > 0 ? '…' : ''
  return prefix + snippet
}

// GET /api/works/[id]/characters/[characterId]/snippet
// Returns a short excerpt from the chapter where this character first appears
export async function GET(_req: NextRequest, props: RouteParams) {
  const { id: workId, characterId } = await props.params

  const character = await prisma.$queryRaw<any[]>`
    SELECT id, name, aliases, "firstAppearance"
    FROM character_profiles
    WHERE id = ${characterId} AND "workId" = ${workId}
    LIMIT 1
  `

  if (!character.length) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const char = character[0]
  if (!char.firstAppearance) {
    return NextResponse.json({ snippet: null })
  }

  const aliases: string[] = char.aliases ? JSON.parse(char.aliases) : []

  // Find the section (chapter) for this work and chapter number
  const sections = await prisma.$queryRaw<any[]>`
    SELECT id, content, title
    FROM sections
    WHERE "workId" = ${workId}
      AND "chapterNumber" = ${char.firstAppearance}
    LIMIT 1
  `

  if (!sections.length) {
    return NextResponse.json({ snippet: null })
  }

  const section = sections[0]
  let blocks: any[]
  try {
    blocks = typeof section.content === 'string' ? JSON.parse(section.content) : section.content
    if (!Array.isArray(blocks)) blocks = []
  } catch {
    return NextResponse.json({ snippet: null })
  }

  // Concatenate all block text
  const fullText = blocks.map(extractBlockText).filter(Boolean).join(' ')
  const snippet = extractSnippet(fullText, char.name, aliases)

  return NextResponse.json({
    snippet,
    chapterTitle: section.title || null,
    chapterNumber: char.firstAppearance,
  })
}
