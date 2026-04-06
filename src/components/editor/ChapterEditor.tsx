'use client'
/**
 * ChapterEditor — TipTap-powered chapter document editor.
 * Single continuous editing surface; special blocks (chat, phone, etc.) are
 * embedded as atomic NodeView nodes within the prose document.
 */
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import { TextStyle } from '@tiptap/extension-text-style'
import TextAlign from '@tiptap/extension-text-align'
import Typography from '@tiptap/extension-typography'
import Placeholder from '@tiptap/extension-placeholder'
import CharacterCount from '@tiptap/extension-character-count'
import { useEffect, useRef, useState, useCallback } from 'react'
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Link as LinkIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Heading1,
  Heading2,
  Heading3,
  MessageSquare,
  Smartphone,
  BookOpen,
  SplitSquareVertical,
  Users,
  Image as ImageIcon,
  Plus,
} from 'lucide-react'

import {
  ChatBlockExtension,
  PhoneBlockExtension,
  NarrationBlockExtension,
  DialogueBlockExtension,
  ImageBlockExtension,
} from './extensions'
import { blocksToHtml, editorJsonToBlocks, detectChapters } from './convert'
import type { ContentBlock, BlockType, ChatBlock, PhoneBlock, NarrationBlock, DialogueBlock, ImageBlock } from '@/types/chapt'

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ChapterEditorProps {
  initialBlocks: ContentBlock[]
  /** When this changes the editor content is replaced (navigating chapters) */
  chapterKey: string
  onChange: (blocks: ContentBlock[]) => void
  onChapterizeDetected?: (rawText: string, chapters: string[]) => void
  placeholder?: string
}

// ---------------------------------------------------------------------------
// Empty block factories
// ---------------------------------------------------------------------------

function emptyBlock(type: BlockType): ContentBlock {
  const id = crypto.randomUUID()
  const base = { id, metadata: { created: new Date().toISOString(), modified: new Date().toISOString() } }
  switch (type) {
    case 'chat':
      return { ...base, type: 'chat', platform: 'generic', messages: [] } as ChatBlock
    case 'phone':
      return { ...base, type: 'phone', phoneType: 'ios', content: [] } as PhoneBlock
    case 'narration':
      return { ...base, type: 'narration', text: '', style: { variant: 'box', position: 'center' } } as NarrationBlock
    case 'dialogue':
      return { ...base, type: 'dialogue', lines: [] } as DialogueBlock
    case 'image':
      return { ...base, type: 'image', url: '', alt: '' } as ImageBlock
    default:
      return { ...base, type: 'prose', text: '' } as ContentBlock
  }
}

// ---------------------------------------------------------------------------
// Toolbar button component
// ---------------------------------------------------------------------------

function Btn({
  active,
  onClick,
  title,
  children,
}: {
  active?: boolean
  onClick: () => void
  title: string
  children: React.ReactNode
}) {
  return (
    <button
      onMouseDown={(e) => { e.preventDefault(); onClick() }}
      title={title}
      className={`p-1.5 rounded transition-colors text-sm ${
        active
          ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
      }`}
    >
      {children}
    </button>
  )
}

// ---------------------------------------------------------------------------
// Bubble menu — custom implementation (TipTap v3 removed React BubbleMenu)
// ---------------------------------------------------------------------------

function BubbleToolbar({ editor }: { editor: ReturnType<typeof useEditor> }) {
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)
  const [linkInput, setLinkInput] = useState('')
  const [showLink, setShowLink] = useState(false)

  useEffect(() => {
    if (!editor) return

    const update = () => {
      const { from, to, empty } = editor.state.selection
      if (empty || editor.isActive('chatBlock') || editor.isActive('phoneBlock')) {
        setPos(null)
        return
      }
      const start = editor.view.coordsAtPos(from)
      const end = editor.view.coordsAtPos(to)
      setPos({
        top: Math.min(start.top, end.top) - 48,
        left: (start.left + end.right) / 2,
      })
    }

    editor.on('selectionUpdate', update)
    editor.on('blur', () => setPos(null))
    return () => {
      editor.off('selectionUpdate', update)
      editor.off('blur', () => setPos(null))
    }
  }, [editor])

  if (!editor || !pos) return null

  const applyLink = () => {
    if (!linkInput) {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
    } else {
      const href = linkInput.startsWith('http') ? linkInput : `https://${linkInput}`
      editor.chain().focus().extendMarkRange('link').setLink({ href }).run()
    }
    setShowLink(false)
    setLinkInput('')
  }

  return (
    <div
      className="fixed z-50 flex items-center gap-0.5 bg-gray-900 dark:bg-gray-800 border border-gray-700 rounded-lg shadow-xl px-1 py-0.5 -translate-x-1/2"
      style={{ top: pos.top, left: pos.left }}
      onMouseDown={(e) => e.preventDefault()}
    >
      <Btn active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()} title="Bold"><Bold size={13} /></Btn>
      <Btn active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()} title="Italic"><Italic size={13} /></Btn>
      <Btn active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()} title="Underline"><UnderlineIcon size={13} /></Btn>
      <Btn active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()} title="Strike"><Strikethrough size={13} /></Btn>

      <div className="w-px h-4 bg-gray-600 mx-0.5" />

      <Btn active={editor.isActive('heading', { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} title="H1"><Heading1 size={13} /></Btn>
      <Btn active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} title="H2"><Heading2 size={13} /></Btn>
      <Btn active={editor.isActive('heading', { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} title="H3"><Heading3 size={13} /></Btn>

      <div className="w-px h-4 bg-gray-600 mx-0.5" />

      <Btn active={editor.isActive({ textAlign: 'left' })} onClick={() => editor.chain().focus().setTextAlign('left').run()} title="Left"><AlignLeft size={13} /></Btn>
      <Btn active={editor.isActive({ textAlign: 'center' })} onClick={() => editor.chain().focus().setTextAlign('center').run()} title="Center"><AlignCenter size={13} /></Btn>
      <Btn active={editor.isActive({ textAlign: 'right' })} onClick={() => editor.chain().focus().setTextAlign('right').run()} title="Right"><AlignRight size={13} /></Btn>

      <div className="w-px h-4 bg-gray-600 mx-0.5" />

      {showLink ? (
        <div className="flex items-center gap-1 px-1">
          <input
            type="url"
            value={linkInput}
            onChange={(e) => setLinkInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') applyLink(); if (e.key === 'Escape') setShowLink(false) }}
            placeholder="https://..."
            className="text-xs bg-gray-700 text-white border border-gray-600 rounded px-1.5 py-0.5 w-36 focus:outline-none"
            autoFocus
          />
          <button onMouseDown={(e) => { e.preventDefault(); applyLink() }} className="text-xs text-blue-400 hover:text-blue-300 font-medium">Apply</button>
        </div>
      ) : (
        <Btn active={editor.isActive('link')} onClick={() => { setLinkInput(editor.getAttributes('link').href || ''); setShowLink(true) }} title="Link"><LinkIcon size={13} /></Btn>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Floating block-insert row — shown when cursor is in an empty paragraph
// ---------------------------------------------------------------------------

function FloatingInsertMenu({
  editor,
  onInsert,
}: {
  editor: ReturnType<typeof useEditor>
  onInsert: (type: BlockType) => void
}) {
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)

  useEffect(() => {
    if (!editor) return

    const update = () => {
      const { $anchor, empty } = editor.state.selection
      const node = $anchor.node()
      if (empty && node.type.name === 'paragraph' && node.content.size === 0) {
        const coords = editor.view.coordsAtPos($anchor.pos)
        setPos({ top: coords.top, left: coords.left })
      } else {
        setPos(null)
      }
    }

    editor.on('selectionUpdate', update)
    editor.on('transaction', update)
    return () => {
      editor.off('selectionUpdate', update)
      editor.off('transaction', update)
    }
  }, [editor])

  if (!editor || !pos) return null

  return (
    <div
      className="fixed z-40 flex items-center gap-0.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-md px-1 py-0.5 -translate-y-1/2"
      style={{ top: pos.top, left: pos.left - 200 }}
      onMouseDown={(e) => e.preventDefault()}
    >
      <span className="text-xs text-gray-400 px-1 whitespace-nowrap">Insert:</span>
      <button onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleHeading({ level: 2 }).run() }} title="Section heading (H2)" className="p-1 rounded text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700"><Heading2 size={14} /></button>
      <button onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().setHorizontalRule().run() }} title="Scene break / divider line" className="p-1 rounded text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700"><SplitSquareVertical size={14} /></button>
      <button onMouseDown={(e) => { e.preventDefault(); onInsert('chat') }} title="Chat conversation (Discord, WhatsApp, SMS...)" className="p-1 rounded text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700"><MessageSquare size={14} /></button>
      <button onMouseDown={(e) => { e.preventDefault(); onInsert('phone') }} title="Phone screen UI (text message thread)" className="p-1 rounded text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700"><Smartphone size={14} /></button>
      <button onMouseDown={(e) => { e.preventDefault(); onInsert('narration') }} title="Narration box (author's note, aside, or styled emphasis)" className="p-1 rounded text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700"><BookOpen size={14} /></button>
      <button onMouseDown={(e) => { e.preventDefault(); onInsert('dialogue') }} title="Formatted dialogue exchange between characters" className="p-1 rounded text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700"><Users size={14} /></button>
      <button onMouseDown={(e) => { e.preventDefault(); onInsert('image') }} title="Insert an image or illustration" className="p-1 rounded text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700"><ImageIcon size={14} /></button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function ChapterEditor({
  initialBlocks,
  chapterKey,
  onChange,
  onChapterizeDetected,
  placeholder = 'Start writing your story...',
}: ChapterEditorProps) {
  const suppressSyncRef = useRef(false)
  const prevChapterKey = useRef(chapterKey)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Underline,
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: { rel: 'noopener noreferrer nofollow', class: 'text-blue-500 underline' },
      }),
      TextStyle,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Typography,
      Placeholder.configure({
        placeholder: ({ node }) => {
          if (node.type.name === 'heading') return 'Chapter title...'
          return placeholder
        },
        includeChildren: false,
      }),
      CharacterCount,
      ChatBlockExtension,
      PhoneBlockExtension,
      NarrationBlockExtension,
      DialogueBlockExtension,
      ImageBlockExtension,
    ],

    content: blocksToHtml(initialBlocks),
    immediatelyRender: false,

    onUpdate: ({ editor }) => {
      if (suppressSyncRef.current) return
      onChange(editorJsonToBlocks(editor.getJSON()))
    },

    editorProps: {
      attributes: {
        class: 'chapter-tiptap focus:outline-none min-h-[60vh] text-gray-900 dark:text-gray-100 text-base leading-relaxed',
      },
      handlePaste: (_view, event) => {
        if (!onChapterizeDetected) return false
        const text = event.clipboardData?.getData('text/plain') || ''
        if (text.length < 500) return false
        const chapters = detectChapters(text)
        if (chapters) {
          event.preventDefault()
          onChapterizeDetected(text, chapters)
          return true
        }
        return false
      },
    },
  })

  // Reload editor when navigating to a different chapter
  useEffect(() => {
    if (!editor || chapterKey === prevChapterKey.current) return
    prevChapterKey.current = chapterKey
    suppressSyncRef.current = true
    editor.commands.setContent(blocksToHtml(initialBlocks), { emitUpdate: false })
    suppressSyncRef.current = false
  }, [chapterKey]) // eslint-disable-line react-hooks/exhaustive-deps

  const insertSpecialBlock = useCallback(
    (type: BlockType) => {
      if (!editor) return
      const block = emptyBlock(type)
      const tiptapType = type + 'Block'
      editor.chain().focus().insertContent({ type: tiptapType, attrs: { blockId: block.id, blockData: block } }).run()
    },
    [editor]
  )

  if (!editor) return null

  return (
    <div className="relative w-full">
      {/* Custom bubble formatting toolbar */}
      <BubbleToolbar editor={editor} />

      {/* Custom floating block-insert menu */}
      <FloatingInsertMenu editor={editor} onInsert={insertSpecialBlock} />

      {/* The writing surface */}
      <EditorContent editor={editor} />

      {/* Bottom "add paragraph" button */}
      <button
        onMouseDown={(e) => {
          e.preventDefault()
          const { doc } = editor.state
          const lastChild = doc.lastChild
          const alreadyEmpty = lastChild?.type.name === 'paragraph' && lastChild.content.size === 0
          if (alreadyEmpty) {
            editor.commands.focus('end')
          } else {
            editor.chain().focus('end').insertContent({ type: 'paragraph' }).run()
          }
        }}
        className="mt-3 flex items-center gap-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-sm transition-colors"
      >
        <Plus size={16} />
        Add paragraph
      </button>
    </div>
  )
}
