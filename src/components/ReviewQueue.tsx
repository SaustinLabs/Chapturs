'use client'

import { useState, useEffect } from 'react'
import { Inbox, MessageSquare, Edit3, Check, X, ChevronDown, ChevronUp, Filter } from 'lucide-react'
export interface Comment {
  id: string
  workId: string
  chapterId: string
  blockId: string
  userId: string
  userName: string
  text: string
  resolved: boolean
  createdAt: string
  updatedAt: string
  parentId?: string
  replies?: Comment[]
}

import { EditSuggestion, EditSuggestionCard } from './EditSuggestionModal'

interface ReviewQueueProps {
  workId: string
  chapterId?: string
  authorId: string
  onApproveEdit?: (suggestionId: string) => Promise<void>
  onRejectEdit?: (suggestionId: string) => Promise<void>
  onResolveComment?: (commentId: string) => Promise<void>
  onNavigateToBlock?: (blockId: string) => void
}

type FilterType = 'all' | 'comments' | 'suggestions'
type StatusFilter = 'pending' | 'all'

export default function ReviewQueue({
  workId,
  chapterId,
  authorId,
  onApproveEdit,
  onRejectEdit,
  onResolveComment,
  onNavigateToBlock
}: ReviewQueueProps) {
  
  const [comments, setComments] = useState<Comment[]>([])
  const [editSuggestions, setEditSuggestions] = useState<EditSuggestion[]>([])
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState<FilterType>('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('pending')
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())

  useEffect(() => {
    loadReviewItems()
  }, [workId, chapterId, statusFilter])

  const loadReviewItems = async () => {
    setLoading(true)
    try {
      // Load comments
      const commentsResponse = await fetch(
        `/api/comments?workId=${workId}${chapterId ? `&chapterId=${chapterId}` : ''}${statusFilter === 'pending' ? '&resolved=false' : ''}`
      )
      if (commentsResponse.ok) {
        const commentsData = await commentsResponse.json()
        setComments(commentsData.comments || [])
      }

      // Load edit suggestions
      const suggestionsResponse = await fetch(
        `/api/edit-suggestions?workId=${workId}${chapterId ? `&chapterId=${chapterId}` : ''}${statusFilter === 'pending' ? '&status=pending' : ''}`
      )
      if (suggestionsResponse.ok) {
        const suggestionsData = await suggestionsResponse.json()
        setEditSuggestions(suggestionsData.suggestions || [])
      }
    } catch (error) {
      console.error('Failed to load review items:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApproveEdit = async (suggestionId: string) => {
    if (onApproveEdit) {
      await onApproveEdit(suggestionId)
    } else {
      // Default API call
      await fetch(`/api/edit-suggestions/${suggestionId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
    }
    loadReviewItems()
  }

  const handleRejectEdit = async (suggestionId: string) => {
    if (onRejectEdit) {
      await onRejectEdit(suggestionId)
    } else {
      // Default API call
      await fetch(`/api/edit-suggestions/${suggestionId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
    }
    loadReviewItems()
  }

  const handleResolveComment = async (commentId: string) => {
    if (onResolveComment) {
      await onResolveComment(commentId)
    } else {
      // Default API call
      await fetch(`/api/comments/${commentId}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
    }
    loadReviewItems()
  }

  const toggleExpanded = (itemId: string) => {
    setExpandedItems(prev => {
      const next = new Set(prev)
      if (next.has(itemId)) {
        next.delete(itemId)
      } else {
        next.add(itemId)
      }
      return next
    })
  }

  const filteredComments = filterType === 'suggestions' ? [] : comments
  const filteredSuggestions = filterType === 'comments' ? [] : editSuggestions

  const pendingCommentsCount = comments.filter(c => !c.resolved).length
  const pendingSuggestionsCount = editSuggestions.filter(s => s.status === 'pending').length
  const totalPending = pendingCommentsCount + pendingSuggestionsCount

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Inbox size={24} className="text-blue-600" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Review Queue</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {totalPending} pending item{totalPending !== 1 ? 's' : ''} to review
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-3">
          {/* Type Filter */}
          <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded p-1">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 text-sm rounded transition-colors ${
                filterType === 'all'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-medium shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              All ({comments.length + editSuggestions.length})
            </button>
            <button
              onClick={() => setFilterType('comments')}
              className={`px-3 py-1.5 text-sm rounded transition-colors flex items-center gap-1 ${
                filterType === 'comments'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-medium shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <MessageSquare size={14} />
              Comments ({comments.length})
            </button>
            <button
              onClick={() => setFilterType('suggestions')}
              className={`px-3 py-1.5 text-sm rounded transition-colors flex items-center gap-1 ${
                filterType === 'suggestions'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-medium shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <Edit3 size={14} />
              Suggestions ({editSuggestions.length})
            </button>
          </div>

          {/* Status Filter */}
          <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded p-1">
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-3 py-1.5 text-sm rounded transition-colors ${
                statusFilter === 'pending'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-medium shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              Pending ({totalPending})
            </button>
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 text-sm rounded transition-colors ${
                statusFilter === 'all'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-medium shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              All
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">Loading review items...</p>
          </div>
        ) : filteredComments.length === 0 && filteredSuggestions.length === 0 ? (
          <div className="text-center py-12">
            <Inbox size={48} className="mx-auto text-gray-300 dark:text-gray-700 mb-3" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">All caught up!</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No {statusFilter === 'pending' ? 'pending ' : ''}
              {filterType === 'all' ? 'items' : filterType} to review.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Comments Section */}
            {filteredComments.length > 0 && (
              <div>
                {filterType === 'all' && (
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                    <MessageSquare size={16} />
                    Comments ({filteredComments.length})
                  </h3>
                )}
                <div className="space-y-3">
                  {filteredComments.map((comment) => {
                    const isExpanded = expandedItems.has(comment.id)
                    const replyCount = comment.replies?.length || 0

                    return (
                      <div
                        key={comment.id}
                        className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-900 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <MessageSquare size={16} className="text-blue-600" />
                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {comment.userName}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {new Date(comment.createdAt).toLocaleDateString()}
                            </span>
                            {comment.resolved && (
                              <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full">
                                Resolved
                              </span>
                            )}
                          </div>
                          {onNavigateToBlock && (
                            <button
                              onClick={() => onNavigateToBlock(comment.blockId)}
                              className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                            >
                              View in context
                            </button>
                          )}
                        </div>

                        <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                          {comment.text}
                        </p>

                        {replyCount > 0 && (
                          <button
                            onClick={() => toggleExpanded(comment.id)}
                            className="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 flex items-center gap-1 mb-2"
                          >
                            {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                            {replyCount} {replyCount === 1 ? 'reply' : 'replies'}
                          </button>
                        )}

                        {isExpanded && comment.replies && (
                          <div className="pl-6 border-l-2 border-gray-200 dark:border-gray-700 space-y-2 mb-3">
                            {comment.replies.map((reply) => (
                              <div key={reply.id} className="text-sm">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-medium text-gray-900 dark:text-gray-100">{reply.userName}</span>
                                  <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {new Date(reply.createdAt).toLocaleDateString()}
                                  </span>
                                </div>
                                <p className="text-gray-700 dark:text-gray-300">{reply.text}</p>
                              </div>
                            ))}
                          </div>
                        )}

                        {!comment.resolved && (
                          <button
                            onClick={() => handleResolveComment(comment.id)}
                            className="text-sm px-3 py-1.5 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded hover:bg-green-200 dark:hover:bg-green-900/50 flex items-center gap-1"
                          >
                            <Check size={14} />
                            Mark as Resolved
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Edit Suggestions Section */}
            {filteredSuggestions.length > 0 && (
              <div>
                {filterType === 'all' && (
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 mt-6 flex items-center gap-2">
                    <Edit3 size={16} />
                    Edit Suggestions ({filteredSuggestions.length})
                  </h3>
                )}
                <div className="space-y-3">
                  {filteredSuggestions.map((suggestion) => (
                    <div key={suggestion.id} className="hover:shadow-md transition-shadow">
                      <EditSuggestionCard
                        suggestion={suggestion}
                        onApprove={handleApproveEdit}
                        onReject={handleRejectEdit}
                        isAuthor={true}
                        showActions={true}
                      />
                      {onNavigateToBlock && (
                        <button
                          onClick={() => onNavigateToBlock(suggestion.blockId)}
                          className="text-xs text-blue-600 dark:text-blue-400 hover:underline mt-2 ml-4"
                        >
                          View in context →
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
