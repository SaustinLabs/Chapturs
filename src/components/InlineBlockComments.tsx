'use client'

import { useState, useEffect } from 'react'
import { MessageSquare, X, Send, MoreVertical, Trash2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface BlockComment {
  id: string
  blockId: string
  userId: string
  username: string
  text: string
  createdAt: string
  likes: number
  reactions?: string
}

interface InlineBlockCommentsProps {
  workId: string
  sectionId: string
  blockId: string
  currentUserId?: string
  currentUsername?: string
  isOpen: boolean
  onClose: () => void
}

export default function InlineBlockComments({
  workId,
  sectionId,
  blockId,
  currentUserId,
  currentUsername,
  isOpen,
  onClose
}: InlineBlockCommentsProps) {
  const [comments, setComments] = useState<BlockComment[]>([])
  const [loading, setLoading] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (isOpen) {
      fetchComments()
    }
  }, [isOpen, blockId])

  const fetchComments = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/works/${workId}/blocks/${blockId}/comments?sectionId=${sectionId}`)
      if (res.ok) {
        const data = await res.json()
        setComments(data.comments || [])
      }
    } catch (error) {
      console.error('Failed to fetch block comments:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim() || !currentUserId) return

    setSubmitting(true)
    try {
      const res = await fetch(`/api/works/${workId}/blocks/${blockId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sectionId,
          text: newComment,
          username: currentUsername || 'Anonymous'
        })
      })

      if (res.ok) {
        const data = await res.json()
        setComments(prev => [...prev, data.comment])
        setNewComment('')
      }
    } catch (error) {
      console.error('Failed to post block comment:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (commentId: string) => {
    if (!confirm('Delete this comment?')) return
    
    try {
      const res = await fetch(`/api/works/${workId}/blocks/${blockId}/comments/${commentId}`, {
        method: 'DELETE'
      })
      if (res.ok) {
        setComments(prev => prev.filter(c => c.id !== commentId))
      }
    } catch (error) {
      console.error('Failed to delete block comment:', error)
    }
  }

  if (!isOpen) return null

  return (
    <div className="absolute right-0 top-0 w-80 bg-white dark:bg-gray-800 shadow-xl rounded-lg border border-gray-200 dark:border-gray-700 z-50 flex flex-col max-h-[500px] transform translate-x-[110%]">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <MessageSquare size={16} className="text-gray-500" />
          <h3 className="font-medium text-sm text-gray-900 dark:text-gray-100">
            Block Comments ({comments.length})
          </h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <X size={16} />
        </button>
      </div>

      {/* Comment List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {loading ? (
          <div className="flex justify-center py-4">
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
            No comments on this paragraph yet.
          </div>
        ) : (
          comments.map(comment => (
            <div key={comment.id} className="group flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm text-gray-900 dark:text-gray-100">
                  {comment.username}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">
                    {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                  </span>
                  {currentUserId === comment.userId && (
                    <button 
                      onClick={() => handleDelete(comment.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-opacity"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 p-2 rounded-md">
                {comment.text}
              </p>
            </div>
          ))
        )}
      </div>

      {/* Input Area */}
      {currentUserId ? (
        <form onSubmit={handleSubmit} className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80 rounded-b-lg">
          <div className="relative">
            <input
              type="text"
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="w-full pl-3 pr-10 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none dark:text-white"
              disabled={submitting}
            />
            <button
              type="submit"
              disabled={!newComment.trim() || submitting}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={14} />
            </button>
          </div>
        </form>
      ) : (
        <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80 text-center rounded-b-lg">
          <p className="text-xs text-gray-500 dark:text-gray-400">Sign in to comment.</p>
        </div>
      )}
    </div>
  )
}
