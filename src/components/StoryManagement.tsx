'use client'

import { useState, useEffect } from 'react'
import {
  BookOpen, Eye, Edit, Settings, Trash2, Plus,
  FileText, Users, Star
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { resolveCoverSrc } from '@/lib/images'

interface Work {
  id: string
  title: string
  genre: string
  coverImage?: string
  description?: string
  status: 'draft' | 'published' | 'completed'
  createdAt: string
  _count: {
    sections: number
    likes: number
  }
  sections: Array<{
    id: string
    title: string
    createdAt: string
  }>
}

interface StoryManagementProps {
  userId: string | null
  isAuthenticated: boolean
}

const STATUS_VARIANT: Record<string, 'neutral' | 'success' | 'genre'> = {
  draft: 'neutral',
  published: 'success',
  completed: 'genre',
}

export default function StoryManagement({ userId, isAuthenticated }: StoryManagementProps) {
  const router = useRouter()
  const [works, setWorks] = useState<Work[]>([])
  const [loadingWorks, setLoadingWorks] = useState(true)
  const [filter, setFilter] = useState<'all' | 'published' | 'draft' | 'completed'>('all')

  // Fetch user's works
  useEffect(() => {
    if (!isAuthenticated || !userId) {
      setLoadingWorks(false)
      return
    }

    const fetchWorks = async () => {
      try {
        setLoadingWorks(true)
        const response = await fetch(`/api/works?authorId=${userId}`)
        if (response.ok) {
          const responseData = await response.json()
          // Handle wrapped response format: { success: true, data: { works: [...] } }
          const data = responseData.data || responseData
          const worksArray = data.works || data || []
          setWorks(worksArray)
        }
      } catch {
        // silently fail — user sees empty state
      } finally {
        setLoadingWorks(false)
      }
    }

    fetchWorks()
  }, [userId, isAuthenticated])

  const filteredWorks = works.filter(work => {
    if (filter === 'all') return true
    return work.status === filter
  })

  // ---- Unauthenticated ----
  if (!isAuthenticated) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <EmptyState
          icon={<BookOpen className="w-16 h-16" />}
          title="Story Management"
          description="Please sign in to manage your stories."
          action={{ label: 'Sign In', onClick: () => router.push('/auth/signin') }}
        />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Your Stories
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your works, view quality assessments, and track performance
          </p>
        </div>
        <Link
          href="/creator/upload"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          New Story
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 dark:border-gray-700">
        {(['all', 'published', 'draft', 'completed'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-4 py-2 font-medium transition-colors border-b-2 ${
              filter === tab
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Loading State */}
      {loadingWorks && (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} variant="rectangular" height={72} />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loadingWorks && filteredWorks.length === 0 && (
        <EmptyState
          icon={<BookOpen className="w-16 h-16" />}
          title="No stories yet"
          description={
            filter === 'all'
              ? "Start your writing journey by creating your first story!"
              : `You don't have any ${filter} stories yet.`
          }
          action={{ label: 'Create Your First Story', onClick: () => router.push('/creator/upload') }}
        />
      )}

      {/* Works Table */}
      {!loadingWorks && filteredWorks.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredWorks.map((work) => (
              <div
                key={work.id}
                className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
              >
                {/* Cover Thumbnail */}
                <div className="flex-shrink-0 w-12 h-16 rounded overflow-hidden bg-gray-100 dark:bg-gray-700">
                  {work.coverImage ? (
                    <img
                      src={resolveCoverSrc(work.id, work.coverImage)}
                      alt={work.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <BookOpen className="w-5 h-5 text-gray-400" />
                    </div>
                  )}
                </div>

                {/* Title + Genre */}
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/story/${work.id}`}
                    className="font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 truncate block"
                  >
                    {work.title}
                  </Link>
                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{work.genre}</p>
                </div>

                {/* Status Badge */}
                <Badge variant={STATUS_VARIANT[work.status] || 'neutral'}>
                  {work.status.charAt(0).toUpperCase() + work.status.slice(1)}
                </Badge>

                {/* Chapter Count */}
                <div className="hidden sm:flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 w-20 justify-end">
                  <FileText className="w-4 h-4" />
                  <span>{work._count.sections}</span>
                </div>

                {/* Likes */}
                <div className="hidden md:flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 w-16 justify-end">
                  <Star className="w-4 h-4" />
                  <span>{work._count.likes}</span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Link
                    href={`/story/${work.id}`}
                    className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    title="View"
                  >
                    <Eye className="w-4 h-4" />
                  </Link>
                  <Link
                    href={`/creator/work/${work.id}/chapters`}
                    className="p-2 text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    title="Chapters"
                  >
                    <FileText className="w-4 h-4" />
                  </Link>
                  <Link
                    href={`/creator/work/${work.id}/edit`}
                    className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    title="Edit"
                  >
                    <Edit className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
