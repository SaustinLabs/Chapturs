/**
 * Conversion utilities: ContentBlock[] ↔ TipTap (HTML for loading, JSON for saving)
 * The DB canonical format is ContentBlock[]. TipTap is the in-memory editor format.
 */
import type { JSONContent } from '@tiptap/react'
import type {
  ContentBlock,
  ProseBlock,
  HeadingBlock,
  DividerBlock,
  ChatBlock,
  PhoneBlock,
  NarrationBlock,
  DialogueBlock,
  ImageBlock,
} from '@/types/chapt'

// ---------------------------------------------------------------------------
// HTML escaping helpers
// ---------------------------------------------------------------------------

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

// Serialize a JSON attribute value so it's safe inside a double-quoted HTML attribute
function jsonAttr(obj: unknown): string {
  return JSON.stringify(obj).replace(/"/g, '&quot;')
}

// ---------------------------------------------------------------------------
// Inline node serializer: TipTap JSONContent[] → HTML string
// ---------------------------------------------------------------------------

export function inlineNodesToHtml(nodes: JSONContent[] | undefined): string {
  if (!nodes) return ''
  return nodes
    .map((node) => {
      if (node.type === 'hardBreak') return '<br>'
      if (node.type !== 'text') return ''

      let text = esc(node.text || '')
      const marks = [...(node.marks || [])]

      for (const mark of marks) {
        switch (mark.type) {
          case 'bold':
            text = `<strong>${text}</strong>`
            break
          case 'italic':
            text = `<em>${text}</em>`
            break
          case 'underline':
            text = `<u>${text}</u>`
            break
          case 'strike':
            text = `<s>${text}</s>`
            break
          case 'code':
            text = `<code>${text}</code>`
            break
          case 'link': {
            const href = esc(mark.attrs?.href || '#')
            const target = mark.attrs?.target ? ` target="${mark.attrs.target}"` : ''
            text = `<a href="${href}" rel="noopener noreferrer nofollow"${target}>${text}</a>`
            break
          }
          case 'textStyle': {
            const styles: string[] = []
            if (mark.attrs?.color) styles.push(`color:${mark.attrs.color}`)
            if (mark.attrs?.fontFamily) styles.push(`font-family:${mark.attrs.fontFamily}`)
            if (styles.length) text = `<span style="${styles.join(';')}">${text}</span>`
            break
          }
        }
      }
      return text
    })
    .join('')
}

// ---------------------------------------------------------------------------
// Save: TipTap JSONContent → ContentBlock[]
// ---------------------------------------------------------------------------

export function editorJsonToBlocks(json: JSONContent): ContentBlock[] {
  const blocks: ContentBlock[] = []

  for (const node of json.content || []) {
    const id = crypto.randomUUID()

    switch (node.type) {
      case 'paragraph': {
        const align = node.attrs?.textAlign as string | undefined
        const inner = inlineNodesToHtml(node.content)
        const styleAttr = align ? ` style="text-align:${align}"` : ''
        blocks.push({ id, type: 'prose', text: `<p${styleAttr}>${inner}</p>` } as ProseBlock)
        break
      }

      case 'heading': {
        const level = (node.attrs?.level as 1 | 2 | 3 | 4) || 2
        const text = (node.content || []).map((n) => n.text || '').join('')
        blocks.push({ id, type: 'heading', text, level } as HeadingBlock)
        break
      }

      case 'horizontalRule':
        blocks.push({ id, type: 'divider', style: 'line' } as DividerBlock)
        break

      case 'chatBlock':
      case 'phoneBlock':
      case 'narrationBlock':
      case 'dialogueBlock':
      case 'imageBlock': {
        const data = node.attrs?.blockData
        if (data) {
          blocks.push({ ...(data as ContentBlock), id: node.attrs?.blockId || id })
        }
        break
      }
    }
  }

  return blocks
}

// ---------------------------------------------------------------------------
// Load: ContentBlock[] → HTML string for TipTap setContent()
// ---------------------------------------------------------------------------

export function blocksToHtml(blocks: ContentBlock[]): string {
  if (!blocks.length) return '<p></p>'

  return blocks
    .map((block) => {
      switch (block.type) {
        case 'prose':
          return (block as ProseBlock).text || '<p></p>'

        case 'heading': {
          const b = block as HeadingBlock
          return `<h${b.level}>${esc(b.text || '')}</h${b.level}>`
        }

        case 'divider':
          return '<hr>'

        case 'chat': {
          const data = jsonAttr(block)
          return `<div data-type="chat-block" data-block-id="${(block as ChatBlock).id}" data-block-data="${data}"></div>`
        }

        case 'phone': {
          const data = jsonAttr(block)
          return `<div data-type="phone-block" data-block-id="${(block as PhoneBlock).id}" data-block-data="${data}"></div>`
        }

        case 'narration': {
          const data = jsonAttr(block)
          return `<div data-type="narration-block" data-block-id="${(block as NarrationBlock).id}" data-block-data="${data}"></div>`
        }

        case 'dialogue': {
          const data = jsonAttr(block)
          return `<div data-type="dialogue-block" data-block-id="${(block as DialogueBlock).id}" data-block-data="${data}"></div>`
        }

        case 'image': {
          const data = jsonAttr(block)
          return `<div data-type="image-block" data-block-id="${(block as ImageBlock).id}" data-block-data="${data}"></div>`
        }

        default:
          return ''
      }
    })
    .join('')
}

// ---------------------------------------------------------------------------
// Chapter detection: split pasted text at chapter heading boundaries
// ---------------------------------------------------------------------------

const CHAPTER_REGEX = /(^|\n)\s*(chapter\s+\d+|ch\s*\d+|\d+\.\s|\*\*\*)/gi

export function detectChapters(text: string): string[] | null {
  const matches = [...text.matchAll(CHAPTER_REGEX)]
  if (matches.length < 2) return null

  const chapters: string[] = []
  let lastIndex = 0

  for (const match of matches) {
    const idx = match.index ?? 0
    if (idx > lastIndex) {
      const chunk = text.slice(lastIndex, idx).trim()
      if (chunk) chapters.push(chunk)
    }
    lastIndex = idx
  }
  // Remainder after last heading
  const tail = text.slice(lastIndex).trim()
  if (tail) chapters.push(tail)

  return chapters.length >= 2 ? chapters : null
}
