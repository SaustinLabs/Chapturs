'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import AppLayout from '@/components/AppLayout'
import { useUser } from '@/hooks/useUser'
import { Edit, Trash2, Plus, Eye } from 'lucide-react'
import { useToast } from '@/components/ui/Toast'

interface Chapter {
  id: string
  title: string
  wordCount: number
  status: string
  publishedAt?: string
  createdAt: string
  updatedAt: string
}

export default function ManageChaptersPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const workId = params?.id as string
  const { userId, isAuthenticated, isLoading: userLoading } = useUser()
  
  const [loading, setLoading] = useState(true)
  const [work, setWork] = useState<any>(null)
  const [chapters, setChapters] = useState<Chapter[]>([])

  useEffect(() => {
    if (!isAuthenticated || !userId) return
    
    const fetchData = async () => {
      try {
        // Fetch work details
        const workResponse = await fetch(`/api/works/${workId}`)
        if (workResponse.ok) {
          const workData = await workResponse.json()
          setWork(workData)
        }

        // Fetch chapters
        const chaptersResponse = await fetch(`/api/works/${workId}/sections`)
        if (chaptersResponse.ok) {
          const chaptersData = await chaptersResponse.json()
          const sectionsArray = chaptersData.sections || chaptersData || []
          setChapters(sectionsArray)
        }
      } catch (error) {
        console.error('Failed to fetch data:', error)
        toast.error('Failed to load chapter data.')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [workId, isAuthenticated, userId])

  const handleDeleteChapter = async (chapterId: string) => {
    if (!confirm('Are you sure you want to delete this chapter?')) return

    try {
      const response = await fetch(`/api/works/${workId}/sections/${chapterId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setChapters(chapters.filter(ch => ch.id !== chapterId))
        toast.success('Chapter deleted successfully.')
      } else {
        toast.error('Failed to delete chapter.')
      }
    } catch (error) {
      console.error('Error deleting chapter:', error)
      toast.error('Failed to delete chapter.')
    }
  }

  if (userLoading || loading) {
    return (
      <AppLayout>
        <div className="max-w-6xl mx-auto p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
            <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </AppLayout>
    )
  }

  if (!work) {
    return (
      <AppLayout>
        <div className="max-w-6xl mx-auto p-6 text-center">
          <h1 className="text-2xl font-bold mb-4">Work Not Found</h1>
          <button
            onClick={() => router.push('/creator/works')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Manage Stories
          </button>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Manage Chapters
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {work.title}
          </p>
        </div>

        {/* Action Bar */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => router.push(`/creator/editor?workId=${workId}`)}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add New Chapter
          </button>
          <button
            onClick={() => router.push(`/creator/work/${workId}/edit`)}
            className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            Edit Work Details
          </button>
          <button
            onClick={() => router.push('/creator/works')}
            className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            Back to Stories
          </button>
        </div>

        {/* Chapters List */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          {chapters.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                No chapters yet. Add your first chapter to get started!
              </p>
              <button
                onClick={() => router.push(`/creator/editor?workId=${workId}`)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="w-5 h-5" />
                Add First Chapter
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {chapters.map((chapter, index) => (
                <div key={chapter.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          Chapter {index + 1}
                        </span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          chapter.status === 'published' 
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                            : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                        }`}>
                          {chapter.status}
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        {chapter.title}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                        <span>{chapter.wordCount || 0} words</span>
                        <span>•</span>
                        <span>
                          {chapter.publishedAt 
                            ? `Published ${new Date(chapter.publishedAt).toLocaleDateString()}`
                            : `Created ${new Date(chapter.createdAt).toLocaleDateString()}`
                          }
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      {chapter.status === 'published' && (
                        <button
                          onClick={() => router.push(`/story/${workId}/chapter/${chapter.id}`)}
                          className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                          title="View Chapter"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                      )}
                      <button
                        onClick={() => router.push(`/creator/editor?workId=${workId}&chapterId=${chapter.id}`)}
                        className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                        title="Edit Chapter"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteChapter(chapter.id)}
                        className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                        title="Delete Chapter"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
