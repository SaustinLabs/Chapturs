'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { useToast } from '@/components/ui/Toast'

type Suggestion = {
  id: string
  sectionId: string
  originalText: string
  suggestedText: string
  username: string
  type: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
}

type Group = {
  sectionId: string
  sectionTitle: string
  chapterNumber: number | null
  count: number
  suggestions: Suggestion[]
}

type SuggestionTab = 'pending' | 'approved' | 'rejected'
const WRITING_HAND_EMOJI = String.fromCodePoint(0x270d)

export default function CreatorSuggestionQueue() {
  const params = useParams()
  const { toast } = useToast()
  const workId = params?.id as string

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<SuggestionTab>('pending')
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [groups, setGroups] = useState<Group[]>([])

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await fetch(`/api/creator/suggestions/queue?workId=${workId}&status=${activeTab}`)

        if (!response.ok) {
          throw new Error('Failed to fetch suggestion queue.')
        }

        const data = await response.json()
        if (!data || typeof data !== 'object' || !Array.isArray(data.groupedBySection)) {
          throw new Error('Unexpected queue response.')
        }

        setGroups(data.groupedBySection as Group[])
      } catch (err) {
        console.error(err)
        setError(err instanceof Error ? err.message : 'Failed to load suggestion queue.')
      } finally {
        setLoading(false)
      }
    }

    if (workId) {
      load()
    }
  }, [activeTab, workId])

  const handleAction = async (suggestionId: string, action: 'approve' | 'reject') => {
    setProcessingId(suggestionId)

    try {
      const response = await fetch(`/api/edit-suggestions/${suggestionId}/${action}`, {
        method: 'POST',
      })

      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.error || `Failed to ${action} suggestion.`)
      }

      setGroups((current) =>
        current
          .map((group) => ({
            ...group,
            suggestions: group.suggestions.filter((suggestion) => suggestion.id !== suggestionId),
            count: group.suggestions.filter((suggestion) => suggestion.id !== suggestionId).length,
          }))
          .filter((group) => group.count > 0)
      )
      toast.success(`Suggestion ${action}d successfully.`)
    } catch (err) {
      console.error(err)
      toast.error(err instanceof Error ? err.message : `Failed to ${action} suggestion.`)
    } finally {
      setProcessingId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-500" />
      </div>
    )
  }

  if (error) {
    return <div className="py-8 text-center text-red-400">{error}</div>
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Suggestion Queue</h1>
        <p className="mt-2 text-gray-400">
          Review reader-submitted edits grouped by chapter.
        </p>
      </div>

      <div className="flex items-center gap-2 border-b border-gray-700">
        {(['pending', 'approved', 'rejected'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`border-b-2 px-4 py-3 text-sm font-medium transition ${
              activeTab === tab
                ? 'border-blue-500 text-white'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {groups.length === 0 ? (
        <EmptyState
          emoji={WRITING_HAND_EMOJI}
          title={`No ${activeTab} suggestions`}
          description="Suggestions will appear here when readers submit edits for this work."
        />
      ) : (
        <div className="space-y-6">
          {groups.map((group) => (
            <section key={group.sectionId} className="rounded-2xl border border-gray-700 bg-gray-800 p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-white">
                    {group.chapterNumber ? `Chapter ${group.chapterNumber}` : 'Chapter'}: {group.sectionTitle}
                  </h2>
                  <p className="text-xs text-gray-400">{group.count} suggestion(s)</p>
                </div>
              </div>

              <div className="space-y-4">
                {group.suggestions.map((suggestion) => (
                  <div key={suggestion.id} className="rounded-xl border border-gray-700 bg-gray-900/40 p-4">
                    <div className="mb-3 flex flex-wrap items-center gap-3">
                      <span className="rounded-full border border-gray-700 bg-gray-900 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-gray-300">
                        {suggestion.type}
                      </span>
                      <span className="text-sm text-gray-400">{suggestion.username}</span>
                      <span className="text-sm text-gray-500">
                        {new Date(suggestion.createdAt).toLocaleString()}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                      <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4">
                        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-red-300">
                          Original Text
                        </div>
                        <p className="text-sm leading-6 text-red-100">{suggestion.originalText}</p>
                      </div>
                      <div className="rounded-xl border border-green-500/20 bg-green-500/10 p-4">
                        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-green-300">
                          Suggested Text
                        </div>
                        <p className="text-sm leading-6 text-green-100">{suggestion.suggestedText}</p>
                      </div>
                    </div>

                    {activeTab === 'pending' && (
                      <div className="mt-4 flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleAction(suggestion.id, 'approve')}
                          disabled={processingId === suggestion.id}
                          className="inline-flex items-center gap-2 rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-2.5 text-sm font-medium text-green-300 transition hover:bg-green-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <CheckIcon className="h-4 w-4" />
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAction(suggestion.id, 'reject')}
                          disabled={processingId === suggestion.id}
                          className="inline-flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm font-medium text-red-300 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <XMarkIcon className="h-4 w-4" />
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}

function EmptyState({
  emoji,
  title,
  description,
}: {
  emoji: string
  title: string
  description: string
}) {
  return (
    <div className="rounded-2xl border border-gray-700 bg-gray-800 py-16 text-center">
      <div className="text-4xl">{emoji}</div>
      <h3 className="mt-4 text-xl font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm text-gray-400">{description}</p>
    </div>
  )
}
