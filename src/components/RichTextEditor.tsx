'use client'
/**
 * RichTextEditor — lightweight TipTap-based inline rich-text editor.
 * Used for chat block message text, dialogue lines, and other short-form
 * rich content fields. Same external interface as the old contenteditable version.
 */
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import { useEffect, useRef, useState } from 'react'
import { Bold, Italic, Underline as UnderlineIcon, Strikethrough } from 'lucide-react'

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  minHeight?: string
  className?: string
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = 'Write something...',
  minHeight = '80px',
  className = '',
}: RichTextEditorProps) {
  // Track whether the last HTML change originated from this editor (to avoid loops)
  const lastEmittedRef = useRef<string>(value)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: false, horizontalRule: false, codeBlock: false }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { rel: 'noopener noreferrer nofollow', class: 'text-blue-500 underline' },
      }),
    ],
    content: value,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      lastEmittedRef.current = html
      onChange(html)
    },
    editorProps: {
      attributes: {
        class: `prose max-w-none focus:outline-none p-2 text-gray-900 dark:text-gray-100 text-sm`,
        style: `min-height: ${minHeight}`,
        'data-placeholder': placeholder,
      },
    },
  })

  // Sync externally-changed value (e.g. programmatic reset)
  useEffect(() => {
    if (!editor || value === lastEmittedRef.current) return
    lastEmittedRef.current = value
    editor.commands.setContent(value, { emitUpdate: false })
  }, [value, editor])

  // Custom bubble toolbar — shown when text is selected
  const [miniMenu, setMiniMenu] = useState<{ top: number; left: number } | null>(null)
  useEffect(() => {
    if (!editor) return
    const update = () => {
      const { from, to, empty } = editor.state.selection
      if (empty) { setMiniMenu(null); return }
      const start = editor.view.coordsAtPos(from)
      const end = editor.view.coordsAtPos(to)
      setMiniMenu({ top: Math.min(start.top, end.top) - 40, left: (start.left + end.right) / 2 })
    }
    editor.on('selectionUpdate', update)
    editor.on('blur', () => setMiniMenu(null))
    return () => { editor.off('selectionUpdate', update); editor.off('blur', () => setMiniMenu(null)) }
  }, [editor])

  return (
    <div
      className={`border border-gray-300 dark:border-gray-600 rounded-md overflow-hidden bg-white dark:bg-gray-800 ${className}`}
    >
      {/* Inline mini-toolbar — appears when text is selected */}
      {editor && miniMenu && (
        <div
          className="fixed z-50 flex items-center gap-0.5 bg-gray-900 border border-gray-700 rounded-lg shadow-xl px-1 py-0.5 -translate-x-1/2"
          style={{ top: miniMenu.top, left: miniMenu.left }}
          onMouseDown={(e) => e.preventDefault()}
        >
          <button onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleBold().run() }} className={`p-1 rounded ${editor.isActive('bold') ? 'bg-white/20 text-white' : 'text-gray-300 hover:text-white'}`}><Bold size={12} /></button>
          <button onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleItalic().run() }} className={`p-1 rounded ${editor.isActive('italic') ? 'bg-white/20 text-white' : 'text-gray-300 hover:text-white'}`}><Italic size={12} /></button>
          <button onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleUnderline().run() }} className={`p-1 rounded ${editor.isActive('underline') ? 'bg-white/20 text-white' : 'text-gray-300 hover:text-white'}`}><UnderlineIcon size={12} /></button>
          <button onMouseDown={(e) => { e.preventDefault(); editor.chain().focus().toggleStrike().run() }} className={`p-1 rounded ${editor.isActive('strike') ? 'bg-white/20 text-white' : 'text-gray-300 hover:text-white'}`}><Strikethrough size={12} /></button>
        </div>
      )}
      <EditorContent editor={editor} />
    </div>
  )
}
