'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import AppLayout from '@/components/AppLayout'
import { useUser } from '@/hooks/useUser'
import {
  ClockIcon,
  EyeIcon,
  PencilSquareIcon,
  PlusIcon,
  TrashIcon,
} from '@heroicons/react/24/outline'
import { useToast } from '@/components/ui/Toast'

interface Chapter {
  id: string
  title: string
  wordCount: number
  status: string
  publishedAt?: string
  scheduledPublishAt?: string | null
  createdAt: string
  updatedAt: string
}

const BOOKS_EMOJI = String.fromCodePoint(0x1f4da)

export default function ManageChaptersPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const workId = params?.id as string
  const { userId, isAuthenticated, isLoading: userLoading } = useUser()

  const [loading, setLoading] = useState(true)
  const [work, setWork] = useState<{ title: string } | null>(null)
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [openSchedulerId, setOpenSchedulerId] = useState<string | null>(null)
  const [scheduleValue, setScheduleValue] = useState('')
  const [schedulingId, setSchedulingId] = useState<string | null>(null)

  useEffect(() => {
    if (!isAuthenticated || !userId) return

    const fetchData = async () => {
      try {
        const [workResponse, chaptersResponse] = await Promise.all([
          fetch(`/api/works/${workId}`),
          fetch(`/api/works/${workId}/sections`),
        ])

        if (workResponse.ok) {
          const workData = await workResponse.json()
          setWork(workData)
        } else {
          toast.error('Failed to load work details.')
        }

        if (chaptersResponse.ok) {
          const chaptersData = await chaptersResponse.json()
          const sectionsArray = chaptersData.sections || chaptersData.data?.sections || chaptersData

          if (Array.isArray(sectionsArray)) {
            setChapters(sectionsArray)
          } else {
            console.log('Unexpected chapters response:', chaptersData)
            toast.error('Unexpected chapter response.')
          }
        } else {
          toast.error('Failed to load chapter data.')
        }
      } catch (error) {
        console.error('Failed to fetch data:', error)
        toast.error('Failed to load chapter data.')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [workId, isAuthenticated, toast, userId])

  const handleDeleteChapter = async (chapterId: string) => {
    if (!confirm('Are you sure you want to delete this chapter?')) return

    try {
      const response = await fetch(`/api/works/${workId}/sections/${chapterId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setChapters((current) => current.filter((chapter) => chapter.id !== chapterId))
        toast.success('Chapter deleted successfully.')
      } else {
        toast.error('Failed to delete chapter.')
      }
    } catch (error) {
      console.error('Error deleting chapter:', error)
      toast.error('Failed to delete chapter.')
    }
  }

  const handleScheduleChapter = async (chapterId: string) => {
    if (!scheduleValue) {
      toast.error('Choose a publish date first.')
      return
    }

    setSchedulingId(chapterId)

    try {
      const response = await fetch(`/api/works/${workId}/sections/${chapterId}/schedule`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          scheduledDate: new Date(scheduleValue).toISOString(),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (data && typeof data === 'object' && 'message' in data) {
          throw new Error(String(data.message))
        }

        console.log('Unexpected schedule response:', data)
        throw new Error('Failed to schedule chapter.')
      }

      const updatedSection = data?.data?.section || data?.section

      if (!updatedSection || typeof updatedSection !== 'object') {
        console.log('Unexpected schedule success payload:', data)
        throw new Error('Unexpected schedule response.')
      }

      setChapters((current) =>
        current.map((chapter) =>
          chapter.id === chapterId
            ? {
                ...chapter,
                scheduledPublishAt:
                  (updatedSection as { scheduledPublishAt?: string }).scheduledPublishAt ||
                  new Date(scheduleValue).toISOString(),
              }
            : chapter
        )
      )

      setOpenSchedulerId(null)
      setScheduleValue('')
      toast.success('Chapter scheduled successfully.')
    } catch (error) {
      console.error('Error scheduling chapter:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to schedule chapter.')
    } finally {
      setSchedulingId(null)
    }
  }

  if (userLoading || loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
        </div>
      </AppLayout>
    )
  }

  if (!work) {
    return (
      <AppLayout>
        <div className="max-w-6xl mx-auto p-6 text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Work Not Found</h1>
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
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Manage Chapters</h1>
          <p className="text-gray-400">{work.title}</p>
        </div>

        <div className="flex flex-wrap gap-4">
          <button
            onClick={() => router.push(`/creator/editor?workId=${workId}`)}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <PlusIcon className="w-5 h-5" />
            Add New Chapter
          </button>
          <button
            onClick={() => router.push(`/creator/work/${workId}/edit`)}
            className="px-6 py-3 bg-gray-800 border border-gray-700 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Edit Work Details
          </button>
          <button
            onClick={() => router.push('/creator/works')}
            className="px-6 py-3 bg-gray-800 border border-gray-700 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Back to Stories
          </button>
        </div>

        <div className="bg-gray-800 rounded-lg border border-gray-700">
          {chapters.length === 0 ? (
            <div className="py-16 text-center">
              <div className="text-4xl">{BOOKS_EMOJI}</div>
              <h3 className="mt-4 text-xl font-semibold text-white">No chapters yet</h3>
              <p className="mt-2 text-sm text-gray-400">
                Add your first chapter to start building this story.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-700">
              {chapters.map((chapter, index) => (
                <div key={chapter.id} className="p-6 hover:bg-gray-900/40 transition-colors">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-3 mb-2">
                        <span className="text-sm font-medium text-gray-400">
                          Chapter {index + 1}
                        </span>
                        <span className={chapterBadgeClass(chapter)}>
                          {chapterBadgeLabel(chapter)}
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold text-white mb-2">{chapter.title}</h3>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
                        <span>{chapter.wordCount || 0} words</span>
                        <span>
                          {chapter.publishedAt
                            ? `Published ${new Date(chapter.publishedAt).toLocaleDateString()}`
                            : `Created ${new Date(chapter.createdAt).toLocaleDateString()}`}
                        </span>
                      </div>

                      {openSchedulerId === chapter.id && chapter.status !== 'published' && (
                        <div className="mt-4 flex flex-col gap-3 rounded-xl border border-gray-700 bg-gray-900 p-4 md:flex-row md:items-center">
                          <input
                            type="datetime-local"
                            value={scheduleValue}
                            onChange={(event) => setScheduleValue(event.target.value)}
                            className="rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-white focus:border-blue-500 focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => handleScheduleChapter(chapter.id)}
                            disabled={schedulingId === chapter.id}
                            className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-gray-900 transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Confirm Schedule
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setOpenSchedulerId(null)
                              setScheduleValue('')
                            }}
                            className="rounded-lg border border-gray-700 px-4 py-2 text-sm font-semibold text-gray-300 transition hover:bg-gray-800 hover:text-white"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {chapter.status !== 'published' && (
                        <button
                          type="button"
                          onClick={() => {
                            setOpenSchedulerId((current) => (current === chapter.id ? null : chapter.id))
                            setScheduleValue(
                              chapter.scheduledPublishAt
                                ? toDatetimeLocalValue(chapter.scheduledPublishAt)
                                : ''
                            )
                          }}
                          className="inline-flex items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-sm font-medium text-amber-300 transition hover:bg-amber-500/20"
                        >
                          <ClockIcon className="h-5 w-5" />
                          Schedule
                        </button>
                      )}
                      {chapter.status === 'published' && (
                        <button
                          onClick={() => router.push(`/story/${workId}/chapter/${chapter.id}`)}
                          className="p-2 text-gray-300 hover:bg-gray-700 rounded-lg transition-colors"
                          title="View Chapter"
                        >
                          <EyeIcon className="w-5 h-5" />
                        </button>
                      )}
                      <button
                        onClick={() => router.push(`/creator/editor?workId=${workId}&chapterId=${chapter.id}`)}
                        className="p-2 text-blue-400 hover:bg-blue-900/30 rounded-lg transition-colors"
                        title="Edit Chapter"
                      >
                        <PencilSquareIcon className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteChapter(chapter.id)}
                        className="p-2 text-red-400 hover:bg-red-900/30 rounded-lg transition-colors"
                        title="Delete Chapter"
                      >
                        <TrashIcon className="w-5 h-5" />
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

function chapterBadgeLabel(chapter: Chapter) {
  if (chapter.status === 'published') {
    return 'Published'
  }

  if (chapter.scheduledPublishAt) {
    return `Scheduled: ${new Date(chapter.scheduledPublishAt).toLocaleString()}`
  }

  return 'Draft'
}

function chapterBadgeClass(chapter: Chapter) {
  if (chapter.status === 'published') {
    return 'px-2 py-1 text-xs font-medium rounded-full bg-green-500/10 text-green-300 border border-green-500/20'
  }

  if (chapter.scheduledPublishAt) {
    return 'px-2 py-1 text-xs font-medium rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20'
  }

  return 'px-2 py-1 text-xs font-medium rounded-full bg-gray-700 text-gray-300 border border-gray-600'
}

function toDatetimeLocalValue(value: string) {
  const date = new Date(value)
  const offset = date.getTimezoneOffset()
  const normalizedDate = new Date(date.getTime() - offset * 60_000)
  return normalizedDate.toISOString().slice(0, 16)
}
