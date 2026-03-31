'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { Bold, Italic, Underline, Strikethrough, Superscript, Subscript, Link, Image, Smile } from 'lucide-react'
import EmojiPicker from './EmojiPicker'
import { measureTextRows } from '@/hooks/usePretext'

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
  className = ''
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const [isFocused, setIsFocused] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)

  const plainText = useMemo(() => {
    return value
      .replace(/<br\s*\/?>(\r\n|\r|\n)?/gi, '\n')
      .replace(/<\/p>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .trim()
  }, [value])

  const dynamicRows = useMemo(() => {
    return measureTextRows(plainText, '16px Inter', 620, 24, { whiteSpace: 'pre-wrap' }, 4, 30)
  }, [plainText])

  const minHeightPx = useMemo(() => {
    const parsed = Number.parseInt(minHeight.replace('px', ''), 10)
    const base = Number.isNaN(parsed) ? 80 : parsed
    return Math.max(base, dynamicRows * 24 + 16)
  }, [dynamicRows, minHeight])

  // Initialize editor with value
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value
    }
  }, [value])

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML)
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    
    // Get plain text from clipboard
    const text = e.clipboardData.getData('text/plain')
    
    // Insert as plain text, preserving line breaks
    const html = text.replace(/\n/g, '<br>')
    document.execCommand('insertHTML', false, html)
  }

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value)
    editorRef.current?.focus()
  }

  const insertImage = () => {
    const url = prompt('Enter image URL:')
    if (url) {
      document.execCommand('insertImage', false, url)
    }
  }

  const insertLink = () => {
    const url = prompt('Enter link URL:')
    if (url) {
      document.execCommand('createLink', false, url)
    }
  }

  return (
    <div className={`border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden ${className}`}>
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-300 dark:border-gray-600 flex-wrap">
        <button
          type="button"
          onClick={() => execCommand('bold')}
          className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-700 dark:text-gray-300"
          title="Bold (Ctrl+B)"
        >
          <Bold size={16} />
        </button>
        <button
          type="button"
          onClick={() => execCommand('italic')}
          className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-700 dark:text-gray-300"
          title="Italic (Ctrl+I)"
        >
          <Italic size={16} />
        </button>
        <button
          type="button"
          onClick={() => execCommand('underline')}
          className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-700 dark:text-gray-300"
          title="Underline (Ctrl+U)"
        >
          <Underline size={16} />
        </button>
        <button
          type="button"
          onClick={() => execCommand('strikeThrough')}
          className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-700 dark:text-gray-300"
          title="Strikethrough"
        >
          <Strikethrough size={16} />
        </button>
        <button
          type="button"
          onClick={() => execCommand('superscript')}
          className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-700 dark:text-gray-300"
          title="Superscript"
        >
          <Superscript size={16} />
        </button>
        <button
          type="button"
          onClick={() => execCommand('subscript')}
          className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-700 dark:text-gray-300"
          title="Subscript"
        >
          <Subscript size={16} />
        </button>
        
        <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />
        
        <button
          type="button"
          onClick={insertLink}
          className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-700 dark:text-gray-300"
          title="Insert Link"
        >
          <Link size={16} />
        </button>
        <button
          type="button"
          onClick={insertImage}
          className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-700 dark:text-gray-300"
          title="Insert Image/GIF URL"
        >
          <Image size={16} />
        </button>
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className={`p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-gray-700 dark:text-gray-300 ${showEmojiPicker ? 'bg-gray-300 dark:bg-gray-600' : ''}`}
            title="Insert Emoji"
          >
            <Smile size={16} />
          </button>
          {showEmojiPicker && (
            <EmojiPicker
              onSelect={(emoji) => {
                document.execCommand('insertText', false, emoji)
                editorRef.current?.focus()
                setShowEmojiPicker(false)
              }}
              onClose={() => setShowEmojiPicker(false)}
              position="bottom-left"
            />
          )}
        </div>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onPaste={handlePaste}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className="p-3 outline-none prose max-w-none bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
        style={{ minHeight: `${minHeightPx}px` }}
        data-placeholder={placeholder}
      />

      <style jsx>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
        }
        [contenteditable] img {
          max-width: 100%;
          height: auto;
          border-radius: 0.5rem;
          margin: 0.5rem 0;
        }
        [contenteditable] a {
          color: #3b82f6;
          text-decoration: underline;
        }
      `}</style>
    </div>
  )
}
