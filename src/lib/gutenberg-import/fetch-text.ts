/**
 * Gutenberg text fetcher, cleaner, and chapter splitter.
 */

const MAX_WORDS_PER_CHAPTER = 3000
const MAX_CHAPTERS = 150

// ── Fetch ────────────────────────────────────────────────────────────────────

export async function fetchGutenbergText(id: number): Promise<string> {
  const primary = `https://www.gutenberg.org/cache/epub/${id}/pg${id}.txt`
  try {
    const res = await fetch(primary, { signal: AbortSignal.timeout(30_000) })
    if (res.ok) return await res.text()
  } catch {
    // Fall through
  }

  const fallback = `https://www.gutenberg.org/files/${id}/${id}-0.txt`
  const res = await fetch(fallback, { signal: AbortSignal.timeout(30_000) })
  if (!res.ok) throw new Error(`Could not fetch Gutenberg text for book ${id}: ${res.status}`)
  return await res.text()
}

// ── Strip header/footer ──────────────────────────────────────────────────────

export function stripGutenbergWrapper(raw: string): string {
  const startMarker = /\*{3}\s*START OF (?:THE |THIS )?PROJECT GUTENBERG/i
  const endMarker   = /\*{3}\s*END OF (?:THE |THIS )?PROJECT GUTENBERG/i
  const startIdx = raw.search(startMarker)
  const endIdx   = raw.search(endMarker)
  if (startIdx === -1) return raw
  const afterStart = raw.indexOf('\n', startIdx) + 1
  let text = endIdx === -1 ? raw.slice(afterStart) : raw.slice(afterStart, endIdx).trim()

  // Strip Gutenberg formatting artifacts
  text = text.replace(/\[Illustration\]\s*/gi, '')             // [Illustration] tags
  text = text.replace(/\[_Copyright[^\]]*\]\s*/gi, '')         // [_Copyright 1894 ..._]
  text = text.replace(/\[_?Illustration:[^\]]*\]\s*/gi, '')    // [Illustration: caption]
  text = text.replace(/^Transcriber'?s?\s*Note:.*$/gim, '')    // Transcriber's Notes
  text = text.replace(/^\s*\[_?[A-Z][^\]]*_?\]\s*$/gm, '')    // Generic [_Markup_] blocks
  text = text.replace(/\n{3,}/g, '\n\n')                       // Collapse triple newlines

  return text.trim()
}

// ── Chapter splitting ────────────────────────────────────────────────────────

export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length
}

interface Chapter {
  title: string
  content: string
}

function findAllMatches(regex: RegExp, text: string): RegExpExecArray[] {
  const matches: RegExpExecArray[] = []
  let match: RegExpExecArray | null
  while ((match = regex.exec(text)) !== null) {
    matches.push(match)
  }
  return matches
}

export function splitIntoChapters(text: string): Chapter[] {
  // Primary: "CHAPTER X", "Chapter 1", "BOOK I", "PART 2"
  const primaryRegex = /^(?:CHAPTER|Chapter|BOOK|PART)\s+([IVXLCDM]+|\d+)[\s.:\-–—]*(.*)?$/gm
  const primaryMatches = findAllMatches(primaryRegex, text)
  if (primaryMatches.length >= 2) {
    return buildChaptersFromMatches(text, primaryMatches)
  }

  // Fallback 1: Roman numeral headings only
  const romanRegex = /^([IVXLCDM]{1,8})\.?\s*$/gm
  const romanMatches = findAllMatches(romanRegex, text)
  if (romanMatches.length >= 2) {
    return buildChaptersFromMatches(text, romanMatches)
  }

  // Fallback 2: Word-count chunking
  return wordCountFallback(text)
}

function buildChaptersFromMatches(
  text: string,
  matches: RegExpExecArray[]
): Chapter[] {
  const chapters: Chapter[] = []
  let lastEnd = 0

  for (let i = 0; i < matches.length && chapters.length < MAX_CHAPTERS; i++) {
    const match = matches[i]
    const headingStart = match.index

    if (i > 0) {
      const chapterText = text.slice(lastEnd, headingStart).trim()
      if (chapterText) {
        chapters[chapters.length - 1].content = chapterText
      }
    }

    const number = match[1] || ''
    const subtitle = match[2] || ''
    const title = subtitle.trim()
      ? `Chapter ${number}: ${subtitle.trim()}`
      : `Chapter ${number}`

    chapters.push({ title, content: '' })
    lastEnd = headingStart + match[0].length
  }

  const finalText = text.slice(lastEnd).trim()
  if (finalText && chapters.length > 0) {
    chapters[chapters.length - 1].content = finalText
  }

  return chapters.filter((c) => c.content.trim().length > 100)
}

function wordCountFallback(text: string): Chapter[] {
  const words = text.split(/\s+/)
  const chapters: Chapter[] = []

  for (let i = 0; i < words.length && chapters.length < MAX_CHAPTERS; i += MAX_WORDS_PER_CHAPTER) {
    const chunk = words.slice(i, i + MAX_WORDS_PER_CHAPTER).join(' ')
    chapters.push({
      title: `Part ${chapters.length + 1}`,
      content: chunk,
    })
  }

  return chapters.filter((c) => c.content.trim().length > 100)
}
