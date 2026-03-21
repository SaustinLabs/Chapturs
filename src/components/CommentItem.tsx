'use client'

import { useState, useEffect, useMemo } from 'react'
import { formatDistanceToNow } from 'date-fns'
import {
  ThumbsUp,
  Reply,
  MoreVertical,
  Edit3,
  Trash2,
  Flag,
  Pin,
  EyeOff,
  Eye,
  SmilePlus
} from 'lucide-react'
import CommentForm from './CommentForm'
import ReportModal from './ReportModal'
import EmojiPicker from './EmojiPicker'
import type { Comment, CommentUser } from '@/types/comment'

interface CommentItemProps {
  comment: Comment
  workId: string
  isCreator: boolean
  currentUserId?: string
  depth?: number
  onCommentUpdated: (comment: Comment) => void
  onCommentDeleted: (commentId: string) => void
  onReplyAdded: (parentId: string, reply: Comment) => void
}

export default function CommentItem({
  comment,
  workId,
  isCreator,
  currentUserId,
  depth = 0,
  onCommentUpdated,
  onCommentDeleted,
  onReplyAdded
}: CommentItemProps) {
  const [showReplyForm, setShowReplyForm] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(comment.content)
  const [showMenu, setShowMenu] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showReportModal, setShowReportModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [liked, setLiked] = useState(
    comment.likes?.some(like => like.userId === currentUserId) || false
  )
  const [likeCount, setLikeCount] = useState(comment.likeCount)
  const [reactions, setReactions] = useState<{ emoji: string, userIds: string[] }[]>([])
  const [spoilerIndices, setSpoilerIndices] = useState(new Set<number>())

  // Parse reactions on mount
  useEffect(() => {
    if (comment.reactions && Array.isArray(comment.reactions)) {
      setReactions(comment.reactions.map(r => ({ emoji: r.emoji, userIds: r.users.map(u => u.id) })))
    } else if (typeof comment.reactions === 'string') {
      try {
        setReactions(JSON.parse(comment.reactions))
      } catch (e) {
        setReactions([])
      }
    }
  }, [comment.reactions])

  const [isContentBlurred, setIsContentBlurred] = useState(true)

  const isOwner = currentUserId === comment.userId
  const canEdit = isOwner && !comment.isEdited && isWithinEditWindow()
  const canDelete = isOwner || isCreator
  const canModerate = isCreator

  function isWithinEditWindow() {
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000
    return new Date(comment.createdAt).getTime() > fiveMinutesAgo
  }

  const handleLike = async () => {
    if (!currentUserId || loading) return

    setLoading(true)
    try {
      const response = await fetch(`/api/comments/${comment.id}/like`, {
        method: 'POST'
      })

      const data = await response.json()

      if (response.ok) {
        setLiked(data.liked)
        setLikeCount(prev => prev + (data.liked ? 1 : -1))
      }
    } catch (error) {
      console.error('Error liking comment:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleReaction = async (emoji: string) => {
    if (!currentUserId || loading) return

    setLoading(true)
    try {
      const response = await fetch(`/api/comments/${comment.id}/react`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emoji })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.reactions) {
          setReactions(data.reactions)
        }
      } else {
        console.error('Failed to react:', await response.text())
      }
    } catch (error) {
      console.error('Error reacting to comment:', error)
    } finally {
      setLoading(false)
      setShowEmojiPicker(false)
    }
  }

  const handleEdit = async () => {
    if (!editContent.trim()) return

    setLoading(true)
    try {
      const response = await fetch(`/api/comments/${comment.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editContent })
      })

      const data = await response.json()

      if (response.ok) {
        onCommentUpdated(data.comment)
        setIsEditing(false)
      }
    } catch (error) {
      console.error('Error editing comment:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this comment?')) return

    setLoading(true)
    try {
      const response = await fetch(`/api/comments/${comment.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        onCommentDeleted(comment.id)
      }
    } catch (error) {
      console.error('Error deleting comment:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePin = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/comments/${comment.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPinned: !comment.isPinned })
      })

      const data = await response.json()

      if (response.ok) {
        onCommentUpdated(data.comment)
      }
    } catch (error) {
      console.error('Error pinning comment:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleHide = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/comments/${comment.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isHidden: !comment.isHidden })
      })

      const data = await response.json()

      if (response.ok) {
        onCommentUpdated(data.comment)
      }
    } catch (error) {
      console.error('Error hiding comment:', error)
    } finally {
      setLoading(false)
    }
  }

  const maxDepth = 3
  const canReply = depth < maxDepth && currentUserId

  return (
    <div className={`${depth > 0 ? 'ml-8 mt-4' : ''}`}>
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-medium">
              {comment.user.displayName?.[0] || comment.user.username[0].toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-900">
                  {comment.user.displayName || comment.user.username}
                </span>
                {comment.isPinned && (
                  <Pin className="w-4 h-4 text-blue-600" />
                )}
              </div>
              <span className="text-xs text-gray-500">
                {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                {comment.isEdited && ' (edited)'}
              </span>
            </div>
          </div>

          {/* Actions menu */}
          {currentUserId && (
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <MoreVertical className="w-5 h-5 text-gray-400" />
              </button>

              {showMenu && (
                <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                  {canEdit && (
                    <button
                      onClick={() => {
                        setIsEditing(true)
                        setShowMenu(false)
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <Edit3 className="w-4 h-4" />
                      Edit
                    </button>
                  )}
                  {canDelete && (
                    <button
                      onClick={() => {
                        handleDelete()
                        setShowMenu(false)
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-gray-50"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  )}
                  {canModerate && (
                    <>
                      <button
                        onClick={() => {
                          handlePin()
                          setShowMenu(false)
                        }}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <Pin className="w-4 h-4" />
                        {comment.isPinned ? 'Unpin' : 'Pin'}
                      </button>
                      <button
                        onClick={() => {
                          handleHide()
                          setShowMenu(false)
                        }}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        {comment.isHidden ? (
                          <>
                            <Eye className="w-4 h-4" />
                            Show
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-4 h-4" />
                            Hide
                          </>
                        )}
                      </button>
                    </>
                  )}
                  {!isOwner && (
                    <button
                      onClick={() => {
                        setShowReportModal(true)
                        setShowMenu(false)
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <Flag className="w-4 h-4" />
                      Report
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Content */}
        {isEditing ? (
          <div className="mb-3">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
            <div className="flex items-center gap-2 mt-2">
              <button
                onClick={handleEdit}
                disabled={loading}
                className="px-3 py-1 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setIsEditing(false)
                  setEditContent(comment.content)
                }}
                className="px-3 py-1 text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <p
              className="text-gray-800 mb-3 whitespace-pre-wrap"
              style={{
                filter: isContentBlurred ? 'blur(8px)' : 'none',
                transition: 'filter 0.2s ease'
              }}
            >
              {comment.content}
            </p>
            {isContentBlurred && (
              <button
                onClick={() => setIsContentBlurred(false)}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Show spoiler
              </button>
            )}
          </>
        )}

        {/* Reactions Display */}
        {reactions && reactions.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {reactions.map((reaction, idx) => {
              const hasReacted = currentUserId ? reaction.userIds.includes(currentUserId) : false
              return (
                <button
                  key={idx}
                  onClick={() => handleReaction(reaction.emoji)}
                  disabled={!currentUserId || loading}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-sm border transition-colors ${
                    hasReacted
                      ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-300'
                      : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700'
                  }`}
                  title={`${reaction.userIds.length} reaction${reaction.userIds.length !== 1 ? 's' : ''}`}
                >
                  <span className="text-base leading-none">{reaction.emoji}</span>
                  <span className="text-xs font-medium ml-1">{reaction.userIds.length}</span>
                </button>
              )
            })}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-4 relative">
          <button
            onClick={handleLike}
            disabled={!currentUserId || loading}
            className={`flex items-center gap-1 text-sm ${
              liked ? 'text-blue-600 font-medium' : 'text-gray-500 hover:text-blue-600'
            } disabled:opacity-50`}
          >
            <ThumbsUp className={`w-4 h-4 ${liked ? 'fill-current' : ''}`} />
            {likeCount > 0 && <span>{likeCount}</span>}
          </button>

          {canReply && (
            <button
              onClick={() => setShowReplyForm(!showReplyForm)}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-blue-600"
            >
              <Reply className="w-4 h-4" />
              Reply
            </button>
          )}

          {currentUserId && (
            <div className="relative">
              <button
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="flex items-center gap-1 text-sm text-gray-500 hover:text-blue-600"
                title="Add Reaction"
              >
                <SmilePlus className="w-4 h-4" />
                React
              </button>

              {showEmojiPicker && (
                <div className="absolute top-full mt-2 left-0 z-50">
                  <EmojiPicker
                    onSelect={(emoji) => handleReaction(emoji)}
                    onClose={() => setShowEmojiPicker(false)}
                  />
                </div>
              )}
            </div>
          )}

          {comment.replyCount > 0 && !comment.replies && (
            <span className="text-sm text-gray-500">
              {comment.replyCount} {comment.replyCount === 1 ? 'reply' : 'replies'}
            </span>
          )}
        </div>

        {/* Reply form */}
        {showReplyForm && (
          <div className="mt-4">
            <CommentForm
              workId={workId}
              sectionId={comment.sectionId || undefined}
              parentId={comment.id}
              onCommentAdded={(reply) => {
                onReplyAdded(comment.id, reply)
                setShowReplyForm(false)
              }}
              onCancel={() => setShowReplyForm(false)}
              placeholder="Write a reply..."
              autoFocus
            />
          </div>
        )}
      </div>

      {/* Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-2">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              workId={workId}
              isCreator={isCreator}
              currentUserId={currentUserId}
              depth={depth + 1}
              onCommentUpdated={onCommentUpdated}
              onCommentDeleted={onCommentDeleted}
              onReplyAdded={onReplyAdded}
            />
          ))}
        </div>
      )}

      {/* Report Modal */}
      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        targetId={comment.id}
        targetType="comment"
      />
    </div>
  )
}
