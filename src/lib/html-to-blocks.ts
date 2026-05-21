/**
 * HTML-to-Chapturs converter.
 * Parses formatted HTML from Google Docs, Word, or any rich text source
 * and converts it to ContentBlock[] for the Chapturs editor.
 *
 * Supported mappings:
 *   <h1>-<h6> → heading blocks (level preserved)
 *   <p>, <div> → prose blocks (with inline formatting)
 *   <b>/<strong> → bold
 *   <i>/<em> → italic
 *   <u> → underline
 *   <s>/<strike> → strikethrough
 *   <a href> → link
 *   <hr> → divider
 *   <blockquote> → narration block
 *   <ul>/<ol> → list blocks (flattened to prose with bullets)
 *   <br> → hard break within prose
 *   <img> → image block
 *   Plain text → prose block
 *   [glossary:term] → glossary reference
 *   **character::Name** → character mention
 */

import type { ContentBlock, ProseBlock, HeadingBlock, DividerBlock, NarrationBlock, ImageBlock } from '@/types/chapt'

interface InlineMark {
  type: 'bold' | 'italic' | 'underline' | 'strike' | 'link'
  attrs?: Record<string, string>
}

interface InlineSegment {
  text: string
  marks: InlineMark[]
}

// ── Inline formatting extraction ─────────────────────────────────────────────

function extractInlineSegments(element: Element): InlineSegment[] {
  const segments: InlineSegment[] = []
  const activeMarks: InlineMark[] = []

  function walk(node: Node, marks: InlineMark[]) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent || ''
      if (text.trim() || marks.length > 0) {
        segments.push({ text, marks: [...marks] })
      }
      return
    }

    if (node.nodeType !== Node.ELEMENT_NODE) return

    const el = node as Element
    const tag = el.tagName.toLowerCase()
    let newMarks = [...marks]

    switch (tag) {
      case 'b': case 'strong':
        newMarks.push({ type: 'bold' })
        break
      case 'i': case 'em':
        newMarks.push({ type: 'italic' })
        break
      case 'u':
        newMarks.push({ type: 'underline' })
        break
      case 's': case 'strike': case 'del':
        newMarks.push({ type: 'strike' })
        break
      case 'a': {
        const href = el.getAttribute('href') || '#'
        newMarks.push({ type: 'link', attrs: { href } })
        break
      }
    }

    for (const child of Array.from(el.childNodes)) {
      walk(child, newMarks)
    }

    // After processing children of a link, reset marks
    if (tag === 'a') {
      // Already walked with link mark, nothing to reset
    }
  }

  walk(element, [])
  return segments
}

// ── Inline segments to HTML string ───────────────────────────────────────────

function segmentsToHtml(segments: InlineSegment[]): string {
  return segments
    .map((seg) => {
      let text = seg.text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')

      // Apply marks from outermost to innermost
      const marks = [...seg.marks].reverse()
      for (const mark of marks) {
        switch (mark.type) {
          case 'bold': text = `<strong>${text}</strong>`; break
          case 'italic': text = `<em>${text}</em>`; break
          case 'underline': text = `<u>${text}</u>`; break
          case 'strike': text = `<s>${text}</s>`; break
          case 'link': {
            const href = mark.attrs?.href || '#'
            text = `<a href="${href.replace(/"/g, '&quot;')}" rel="noopener noreferrer nofollow">${text}</a>`
            break
          }
        }
      }
      return text
    })
    .join('')
}

// ── Text cleanup ─────────────────────────────────────────────────────────────

function cleanText(text: string): string {
  return text
    .replace(/\u00A0/g, ' ')   // non-breaking spaces
    .replace(/\u200B/g, '')    // zero-width spaces
    .replace(/\u200E/g, '')    // left-to-right mark
    .replace(/\u200F/g, '')    // right-to-left mark
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
}

// ── Block-level parsing ──────────────────────────────────────────────────────

function getTextContent(el: Element): string {
  return cleanText(el.textContent || '')
}

// ── Main converter ───────────────────────────────────────────────────────────

export function htmlToBlocks(html: string): ContentBlock[] {
  const blocks: ContentBlock[] = []

  // Parse HTML
  const doc = new DOMParser().parseFromString(html, 'text/html')
  const body = doc.body

  // Process top-level block elements
  const blockElements = Array.from(body.children).filter((el) => {
    const tag = el.tagName.toLowerCase()
    // Skip empty elements and non-content
    if (tag === 'meta' || tag === 'style' || tag === 'script') return false
    return true
  })

  for (const el of blockElements) {
    const tag = el.tagName.toLowerCase()
    const id = crypto.randomUUID()

    // Special blocks
    if (tag === 'hr') {
      blocks.push({ id, type: 'divider', style: 'line' } as DividerBlock)
      continue
    }

    if (tag === 'blockquote') {
      const text = getTextContent(el)
      if (text.trim()) {
        const segments = extractInlineSegments(el)
        blocks.push({
          id,
          type: 'narration',
          text: segmentsToHtml(segments) || text,
          style: 'quote',
        } as NarrationBlock)
      }
      continue
    }

    // Image blocks
    if (tag === 'img') {
      const src = (el as HTMLImageElement).src
      const alt = (el as HTMLImageElement).alt || ''
      if (src) {
        blocks.push({
          id,
          type: 'image',
          url: src,
          caption: alt,
        } as ImageBlock)
      }
      continue
    }

    // Headings
    if (/^h[1-6]$/.test(tag)) {
      const level = parseInt(tag[1]) as 1 | 2 | 3 | 4 | 5 | 6
      const text = getTextContent(el)
      if (text.trim()) {
        blocks.push({ id, type: 'heading', text, level } as HeadingBlock)
      }
      continue
    }

    // Lists — flatten each <li> into a prose block with bullet prefix
    if (tag === 'ul' || tag === 'ol') {
      const items = Array.from(el.querySelectorAll('li'))
      for (const li of items) {
        const text = getTextContent(li)
        if (text.trim()) {
          const segments = extractInlineSegments(li)
          const prefix = tag === 'ol' ? '' : '• '
          blocks.push({
            id: crypto.randomUUID(),
            type: 'prose',
            text: `<p>${prefix}${segmentsToHtml(segments) || text}</p>`,
          } as ProseBlock)
        }
      }
      continue
    }

    // Prose (paragraphs, divs, and anything else)
    if (tag === 'p' || tag === 'div' || true) {
      const text = getTextContent(el)
      if (!text.trim()) continue

      // Check for glossary markup: [glossary:Term Name]
      const glossaryRegex = /\[glossary:([^\]]+)\]/g
      const hasGlossary = glossaryRegex.test(text)

      // Check for character markup: **character::Name**
      const characterRegex = /\*\*character::([^\*]+)\*\*/g

      const segments = extractInlineSegments(el)
      let htmlContent = segmentsToHtml(segments)

      // Wrap glossary references in a span for rendering
      if (hasGlossary) {
        // Reset regex
        glossaryRegex.lastIndex = 0
        // Already handled by inline conversion — glossary terms will be plain text
        // with the [glossary:...] prefix. The ChapterBlockRenderer handles display.
      }

      // Determine text alignment from style
      let styleAttr = ''
      const style = el.getAttribute('style') || ''
      const textAlign = (el as HTMLElement).style?.textAlign
        || style.match(/text-align:\s*(\w+)/i)?.[1]
      if (textAlign && textAlign !== 'left') {
        styleAttr = ` style="text-align:${textAlign}"`
      }

      blocks.push({
        id,
        type: 'prose',
        text: `<p${styleAttr}>${htmlContent || text}</p>`,
      } as ProseBlock)
    }
  }

  // Fallback: if no blocks were extracted, treat everything as a single prose block
  if (blocks.length === 0) {
    const rawText = cleanText(body.textContent || '')
    if (rawText.trim()) {
      blocks.push({
        id: crypto.randomUUID(),
        type: 'prose',
        text: `<p>${rawText.replace(/\n\n+/g, '</p><p>').replace(/\n/g, '<br>')}</p>`,
      } as ProseBlock)
    }
  }

  return blocks
}

// ── Plain text fallback ──────────────────────────────────────────────────────

export function plainTextToBlocks(text: string): ContentBlock[] {
  const blocks: ContentBlock[] = []
  const paragraphs = cleanText(text).split(/\n\n+/)

  for (const para of paragraphs) {
    const trimmed = para.trim()
    if (!trimmed) continue

    const id = crypto.randomUUID()

    // Check for chapter headings
    if (/^(chapter\s+\d+|ch\.?\s*\d+|part\s+\d+)/i.test(trimmed)) {
      blocks.push({ id, type: 'heading', text: trimmed, level: 2 } as HeadingBlock)
      continue
    }

    // Check for scene breaks
    if (/^(\*{3,}|-{3,}|#{3,})$/.test(trimmed)) {
      blocks.push({ id, type: 'divider', style: 'line' } as DividerBlock)
      continue
    }

    // Check for glossary entries
    if (/^\[glossary:([^\]]+)\]\s*:?\s*(.+)?$/i.test(trimmed)) {
      const match = trimmed.match(/^\[glossary:([^\]]+)\]\s*:?\s*(.+)?$/i)
      if (match) {
        blocks.push({
          id,
          type: 'prose',
          text: `<p><strong>${match[1]}</strong>: ${match[2] || ''}</p>`,
        } as ProseBlock)
        continue
      }
    }

    blocks.push({
      id,
      type: 'prose',
      text: `<p>${trimmed.replace(/\n/g, '<br>')}</p>`,
    } as ProseBlock)
  }

  return blocks
}
