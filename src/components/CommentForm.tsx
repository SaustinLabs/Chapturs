'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { Send, Smile } from 'lucide-react'
import EmojiPicker from './EmojiPicker'
import { measureTextRows } from '@/hooks/usePretext'

interface CommentFormProps {
  workId: string
  sectionId?: string
  parentId?: string
  onCommentAdded: (comment: any) => void
  onCancel?: () => void
  placeholder?: string
  autoFocus?: boolean
}

export default function CommentForm({
  workId,
  sectionId,
  parentId,
  onCommentAdded,
  onCancel,
  placeholder = 'Write a comment...',
  autoFocus = false
}: CommentFormProps) {
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [textareaWidth, setTextareaWidth] = useState(560)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const node = textareaRef.current
    if (!node) return

    const updateWidth = () => {
      setTextareaWidth(node.clientWidth || 560)
    }

    updateWidth()
    const observer = new ResizeObserver(updateWidth)
    observer.observe(node)

    return () => observer.disconnect()
  }, [])

  const commentRows = useMemo(() => {
    return measureTextRows(
      content,
      '14px Inter',
      Math.max(220, textareaWidth - 24),
      20,
      { whiteSpace: 'pre-wrap' },
      3,
      16
    )
  }, [content, textareaWidth])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!content.trim()) {
      setError('Comment cannot be empty')
      return
    }

    if (content.length > 5000) {
      setError('Comment is too long (max 5000 characters)')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch(`/api/works/${workId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content,
          sectionId: sectionId || null,
          parentId: parentId || null
        })
      })

      const data = await response.json()

      if (response.ok) {
        onCommentAdded(data.comment)
        setContent('')
        onCancel?.()
      } else {
        setError(data.error || 'Failed to post comment')
      }
    } catch (error) {
      console.error('Error posting comment:', error)
      setError('Failed to post comment. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          rows={commentRows}
          maxLength={5000}
          className="w-full px-4 py-3 pr-12 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
        />
        <div className="absolute bottom-2 right-2">
          <button
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className={`p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 ${showEmojiPicker ? 'bg-gray-200 dark:bg-gray-600' : ''}`}
            title="Add emoji"
          >
            <Smile className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
          {showEmojiPicker && (
            <EmojiPicker
              onSelect={(emoji) => {
                const textarea = textareaRef.current
                if (textarea) {
                  const start = textarea.selectionStart
                  const end = textarea.selectionEnd
                  const newContent = content.substring(0, start) + emoji + content.substring(end)
                  setContent(newContent)
                  
                  // Set cursor position after emoji
                  setTimeout(() => {
                    textarea.focus()
                    const newPos = start + emoji.length
                    textarea.setSelectionRange(newPos, newPos)
                  }, 0)
                }
                setShowEmojiPicker(false)
              }}
              onClose={() => setShowEmojiPicker(false)}
              position="top-right"
            />
          )}
        </div>
        <div className="flex items-center justify-between mt-1">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {content.length}/5000 characters
          </span>
          {error && (
            <span className="text-xs text-red-600">{error}</span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 justify-end">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={loading || !content.trim()}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className="w-4 h-4" />
          {loading ? 'Posting...' : parentId ? 'Reply' : 'Comment'}
        </button>
      </div>
    </form>
  )
}
