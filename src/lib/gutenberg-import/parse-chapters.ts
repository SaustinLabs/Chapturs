export const MAX_WORDS_PER_CHAPTER = 3000
export const MAX_CHAPTERS = 150

interface Chapter {
  title: string
  content: string
}

/**
 * Strip Gutenberg header/footer from raw text.
 * All .txt files have a preamble ending with *** START OF THE PROJECT GUTENBERG EBOOK
 * and a footer starting with *** END OF THE PROJECT GUTENBERG EBOOK.
 */
export function stripGutenbergWrapper(raw: string): string {
  const startMarker = /\*{3}\s*START OF (?:THE |THIS )?PROJECT GUTENBERG/i
  const endMarker   = /\*{3}\s*END OF (?:THE |THIS )?PROJECT GUTENBERG/i

  const startIdx = raw.search(startMarker)
  const endIdx   = raw.search(endMarker)

  if (startIdx === -1) return raw // No marker — return as-is

  const afterStart = raw.indexOf('\n', startIdx) + 1
  return endIdx === -1 ? raw.slice(afterStart) : raw.slice(afterStart, endIdx)
}

/**
 * Split text into chapters using heading detection.
 */
export function splitIntoChapters(text: string): Chapter[] {
  // Try primary pattern first (CHAPTER/Chapter/BOOK/PART + number)
  const PRIMARY = /^(?:CHAPTER|Chapter|BOOK|PART)\s+([IVXLCDM]+|\d+)[\s.:\-–—]*(.*)?$/m

  let parts: string[] = text.split(PRIMARY)

  if (parts.length > 3) {
    return buildChapterList(parts, ['number', 'subtitle'])
  }

  // Try roman numeral fallback
  const ROMAN = /^([IVXLCDM]{1,8})\.?\s*$/m
  parts = text.split(ROMAN)

  if (parts.length > 3) {
    return buildChapterList(parts, ['number'])
  }

  // Word-count fallback — last resort for books without chapter headings
  return wordCountFallback(text)
}

/**
 * Reassemble split array into { title, content } pairs.
 * The split() output includes the delimiter text in the array.
 */
function buildChapterList(parts: string[], captureGroups: string[]): Chapter[] {
  const chapters: Chapter[] = []
  let i = 0

  while (i < parts.length) {
    // Skip empty leading content
    if (parts[i] && parts[i].trim()) {
      // This is the preamble before first chapter — skip it
    }

    // Find next chapter heading
    const headingIdx = parts.findIndex((p, idx) => {
      if (idx === 0 || !p.trim()) return false
      // Check if this part looks like a chapter number
      return p.match(/^[IVXLCDM]+|\d+$/) !== null
    })

    if (headingIdx <= i + 1 && headingIdx > 0) {
      const num = parts[headingIdx].trim()
      let subtitle = ''
      // Check for subtitle in next part
      if (parts.length > headingIdx + 1 && parts[headingIdx + 1] && !parts[headingIdx + 1].match(/^[IVXLCDM]+|\d+$/)) {
        subtitle = parts[headingIdx + 1].trim()
      }

      // Find content until next chapter or end
      let contentStart = headingIdx + (subtitle ? 2 : 1)
      const nextChapter = parts.findIndex((p, idx) => idx > contentStart && p.match(/^[IVXLCDM]+|\d+$/) !== null)
      const contentEnd = nextChapter === -1 ? parts.length : nextChapter

      let content = parts.slice(contentStart, contentEnd).join('')
      if (subtitle) {
        content = subtitle + '\n\n' + content
      }

      chapters.push({
        title: `Chapter ${num}${subtitle ? ': ' + subtitle : ''}`,
        content: content.trim(),
      })

      i = nextChapter === -1 ? parts.length : nextChapter
    } else {
      break // No more chapters found
    }
  }

  return chapters.slice(0, MAX_CHAPTERS)
}

/**
 * Word-count fallback for books without chapter headings.
 */
function wordCountFallback(text: string): Chapter[] {
  const words = text.trim().split(/\s+/).filter(Boolean)
  const chapters: Chapter[] = []
  let current: string[] = []

  for (let i = 0; i < words.length && chapters.length < MAX_CHAPTERS; i++) {
    current.push(words[i])
    if (current.length >= MAX_WORDS_PER_CHAPTER) {
      chapters.push({
        title: `Part ${chapters.length + 1}`,
        content: current.join(' '),
      })
      current = []
    }
  }

  // Add remaining words as final chapter
  if (current.length > 0 && chapters.length < MAX_CHAPTERS) {
    chapters.push({
      title: `Part ${chapters.length + 1}`,
      content: current.join(' '),
    })
  }

  return chapters
}

export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length
}
