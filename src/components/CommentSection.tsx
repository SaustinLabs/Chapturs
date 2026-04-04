'use client'

import { useState, useEffect, useMemo } from 'react'
import { MessageSquare } from 'lucide-react'
import { signIn } from 'next-auth/react'
import CommentForm from './CommentForm'
import CommentItem from './CommentItem'
import type { Comment } from '@/types/comment'

interface CommentSectionProps {
  workId: string
  sectionId?: string
  canComment: boolean
  currentUserId?: string
  /** Whether the current viewer is the work's author. Enables Feature/Pin/Hide controls. */
  isCreator?: boolean
}

export default function CommentSection({
  workId,
  sectionId,
  canComment,
  currentUserId,
  isCreator = false,
}: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [sort, setSort] = useState<'newest' | 'oldest' | 'most-liked'>('newest')
  const [hasMore, setHasMore] = useState(false)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [loadingMore, setLoadingMore] = useState(false)
  // isCreator comes in from the parent (chapter/story page). Previously hardcoded false.

  const fetchComments = async (cursor?: string) => {
    try {
      const params = new URLSearchParams({
        sort: sort === 'most-liked' ? 'newest' : sort, // API doesn't support most-liked yet
        limit: '20'
      })

      if (sectionId) {
        params.append('sectionId', sectionId)
      }

      if (cursor) {
        params.append('cursor', cursor)
      }

      const response = await fetch(`/api/works/${workId}/comments?${params}`)
      const data = await response.json()

      if (response.ok) {
        if (cursor) {
          setComments(prev => [...prev, ...data.comments])
        } else {
          setComments(data.comments)
        }
        setHasMore(data.hasMore)
        setNextCursor(data.nextCursor)
      } else {
        console.error('Failed to fetch comments:', data.error)
      }
    } catch (error) {
      console.error('Error fetching comments:', error)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  useEffect(() => {
    setLoading(true)
    fetchComments()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workId, sectionId, sort])

  const handleCommentAdded = (newComment: Comment) => {
    setComments(prev => [newComment, ...prev])
  }

  const handleCommentUpdated = (updatedComment: Comment) => {
    setComments(prev =>
      prev.map(comment =>
        comment.id === updatedComment.id ? updatedComment : comment
      )
    )
  }

  const handleCommentDeleted = (commentId: string) => {
    setComments(prev => prev.filter(comment => comment.id !== commentId))
  }

  const handleReplyAdded = (parentId: string, reply: Comment) => {
    setComments(prev =>
      prev.map(comment => {
        if (comment.id === parentId) {
          return {
            ...comment,
            replies: [...(comment.replies || []), reply],
            replyCount: comment.replyCount + 1
          }
        }
        return comment
      })
    )
  }

  const loadMoreComments = () => {
    if (nextCursor && !loadingMore) {
      setLoadingMore(true)
      fetchComments(nextCursor)
    }
  }

  const sortedComments = useMemo(() => {
    const commentsCopy = [...comments]

    commentsCopy.sort((a, b) => {
      if (a.isPinned !== b.isPinned) {
        return a.isPinned ? -1 : 1
      }

      if (sort === 'most-liked') {
        const likeDiff = (b.likeCount || 0) - (a.likeCount || 0)
        if (likeDiff !== 0) return likeDiff
      }

      const aTime = new Date(a.createdAt).getTime()
      const bTime = new Date(b.createdAt).getTime()

      if (sort === 'oldest') {
        return aTime - bTime
      }

      return bTime - aTime
    })

    return commentsCopy
  }, [comments, sort])

  const totalComments = useMemo(() => {
    return sortedComments.reduce((count, c) => count + 1 + (c.replyCount || 0), 0)
  }, [sortedComments])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-gray-400" />
          <h2 className="text-xl font-semibold text-gray-900">
            Comments ({totalComments})
          </h2>
        </div>

        {/* Sort dropdown */}
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as any)}
          className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="most-liked">Most Liked</option>
        </select>
      </div>

      {/* Comment form */}
      {/* Comment form or sign-in prompt */}
      {canComment ? (
        <CommentForm
          workId={workId}
          sectionId={sectionId}
          onCommentAdded={handleCommentAdded}
        />
      ) : (
        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Sign in to join the conversation
          </p>
          <button
            onClick={() => signIn('google')}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Sign in
          </button>
        </div>
      )}

      {/* Comments list */}
      {sortedComments.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <MessageSquare className="w-12 h-12 mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 dark:text-gray-400 font-medium">No comments yet</p>
          {canComment ? (
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
              Be the first to comment!
            </p>
          ) : (
            <div className="mt-3">
              <p className="text-sm text-gray-400 dark:text-gray-500 mb-3">
                Sign in to join the conversation
              </p>
              <button
                onClick={() => signIn('google')}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Sign in with Google
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {sortedComments.map(comment => (
            <CommentItem
              key={comment.id}
              comment={comment}
              workId={workId}
              isCreator={isCreator}
              currentUserId={currentUserId}
              onCommentUpdated={handleCommentUpdated}
              onCommentDeleted={handleCommentDeleted}
              onReplyAdded={handleReplyAdded}
            />
          ))}
        </div>
      )}

      {/* Load more button */}
      {hasMore && (
        <div className="text-center">
          <button
            onClick={loadMoreComments}
            disabled={loadingMore}
            className="px-6 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 disabled:opacity-50"
          >
            {loadingMore ? 'Loading...' : 'Load More Comments'}
          </button>
        </div>
      )}
    </div>
  )
}
