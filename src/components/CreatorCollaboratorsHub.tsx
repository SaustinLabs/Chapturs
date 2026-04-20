'use client'

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import {
  ChevronDownIcon,
  TrashIcon,
  UserPlusIcon,
} from '@heroicons/react/24/outline'
import { useToast } from '@/components/ui/Toast'
import EditSuggestionsPanel from './EditSuggestionsPanel'

interface ActivityEvent {
  id: string
  actor: {
    id: string
    username: string
    displayName?: string | null
    avatar?: string | null
  }
  action: string
  createdAt: string
  summary?: string | null
}

interface Collaborator {
  id: string
  userId: string
  role: string
  status: string
  revenueShare?: number
  user: {
    id: string
    username: string
    displayName?: string | null
    avatar?: string | null
  }
}

interface SectionSummary {
  id: string
  title: string
  chapterNumber?: number
  status: string
}

type CollaboratorResponse = {
  collaborators?: Collaborator[]
  data?: {
    collaborators?: Collaborator[]
    collaborator?: Collaborator
    isAuthor?: boolean
  }
  isAuthor?: boolean
}

const roles = ['editor', 'contributor'] as const
const HANDSHAKE_EMOJI = String.fromCodePoint(0x1f91d)

export default function CreatorCollaboratorsHub() {
  const [activeTab, setActiveTab] = useState<'activity' | 'suggestions'>('activity')
  const [pendingSuggestions, setPendingSuggestions] = useState(0)
  const params = useParams()
  const { toast } = useToast()
  const workId = params?.id as string

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [activity, setActivity] = useState<ActivityEvent[]>([])
  const [activityLoading, setActivityLoading] = useState(true)
  const [activityError, setActivityError] = useState<string | null>(null)
  const [collaborators, setCollaborators] = useState<Collaborator[]>([])
  const [isAuthor, setIsAuthor] = useState(false)
  const [editing, setEditing] = useState<{ [userId: string]: boolean }>({})
  const [editValues, setEditValues] = useState<{ [userId: string]: { role: string; revenueShare: string } }>({})
  const [rowLoading, setRowLoading] = useState<{ [userId: string]: boolean }>({})
  const [username, setUsername] = useState('')
  const [role, setRole] = useState<(typeof roles)[number]>('editor')
  const [sections, setSections] = useState<SectionSummary[]>([])
  const [sectionsLoading, setSectionsLoading] = useState(true)
  const [sectionsError, setSectionsError] = useState<string | null>(null)
  const [selectedSectionId, setSelectedSectionId] = useState('')
  const [selectedSectionContent, setSelectedSectionContent] = useState('')

  const selectedSectionIndex = sections.findIndex((section) => section.id === selectedSectionId)
  const selectedSection = selectedSectionIndex >= 0 ? sections[selectedSectionIndex] : null

  const selectedSectionTitle = useMemo(() => {
    if (!selectedSection) return undefined
    return `${formatSectionLabel(selectedSection, selectedSectionIndex)} • ${formatRole(selectedSection.status)}`
  }, [selectedSection, selectedSectionIndex])

  useEffect(() => {
    if (!workId) return

    const load = async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await fetch(`/api/works/${workId}/collaborators`)

        if (!response.ok) {
          throw new Error('Failed to fetch collaborators.')
        }

        const data: CollaboratorResponse = await response.json()
        const nextCollaborators = data.data?.collaborators ?? data.collaborators
        const nextIsAuthor = data.data?.isAuthor ?? data.isAuthor ?? false

        if (!Array.isArray(nextCollaborators)) {
          throw new Error('Unexpected collaborators response.')
        }

        setCollaborators(nextCollaborators)
        setIsAuthor(nextIsAuthor)
      } catch (err) {
        console.error(err)
        setError(err instanceof Error ? err.message : 'Failed to load collaborators.')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [workId])

  useEffect(() => {
    if (!workId) return

    const loadSections = async () => {
      setSectionsLoading(true)
      setSectionsError(null)

      try {
        const response = await fetch(`/api/works/${workId}/sections`)
        if (!response.ok) {
          throw new Error('Failed to load chapters.')
        }

        const data = await response.json()
        const nextSections = Array.isArray(data.sections)
          ? data.sections
          : Array.isArray(data.data?.sections)
            ? data.data.sections
            : []

        setSections(nextSections)
        setSelectedSectionId((current) => {
          if (current && nextSections.some((section: SectionSummary) => section.id === current)) {
            return current
          }
          return nextSections[0]?.id || ''
        })
      } catch (err) {
        console.error(err)
        setSectionsError(err instanceof Error ? err.message : 'Failed to load chapters.')
      } finally {
        setSectionsLoading(false)
      }
    }

    loadSections()
  }, [workId])

  useEffect(() => {
    if (!workId) return

    setActivityLoading(true)
    setActivityError(null)

    fetch(`/api/works/${workId}/collaborators/activity`)
      .then(async (res) => {
        if (!res.ok) throw new Error('Failed to fetch activity log.')
        const data = await res.json()
        if (!Array.isArray(data.activity)) throw new Error('Unexpected activity response.')
        setActivity(data.activity)
      })
      .catch((err) => {
        console.error(err)
        setActivityError(err instanceof Error ? err.message : 'Failed to load activity log.')
      })
      .finally(() => setActivityLoading(false))
  }, [workId])

  const refreshPendingSuggestions = useCallback(async () => {
    try {
      const totals = await Promise.all(
        sections.map(async (section) => {
          const response = await fetch(
            `/api/works/${workId}/sections/${section.id}/suggestions?status=pending&page=1&pageSize=1`
          )
          if (!response.ok) return 0

          const data = await response.json()
          return typeof data.total === 'number'
            ? data.total
            : Array.isArray(data.suggestions)
              ? data.suggestions.length
              : 0
        })
      )

      setPendingSuggestions(totals.reduce((sum, total) => sum + total, 0))
    } catch {
      setPendingSuggestions(0)
    }
  }, [sections, workId])

  const refreshSelectedSectionContent = useCallback(async (sectionId: string) => {
    try {
      const response = await fetch(`/api/works/${workId}/sections/${sectionId}`)
      if (!response.ok) {
        throw new Error('Failed to load chapter content.')
      }

      const data = await response.json()
      const content = data?.section?.content
      setSelectedSectionContent(
        typeof content === 'string'
          ? content
          : JSON.stringify(content ?? {}, null, 2)
      )
    } catch (err) {
      console.error(err)
      setSelectedSectionContent('')
    }
  }, [workId])

  useEffect(() => {
    if (!workId || sections.length === 0) {
      setPendingSuggestions(0)
      return
    }

    refreshPendingSuggestions()
  }, [refreshPendingSuggestions, sections.length, workId])

  useEffect(() => {
    if (!workId || !selectedSectionId) {
      setSelectedSectionContent('')
      return
    }

    refreshSelectedSectionContent(selectedSectionId)
  }, [refreshSelectedSectionContent, selectedSectionId, workId])

  const handleAddCollaborator = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitting(true)

    try {
      const response = await fetch(`/api/works/${workId}/collaborators`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          identity: username,
          role,
        }),
      })

      const data: CollaboratorResponse & { error?: string } = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add collaborator.')
      }

      const createdCollaborator = data.data?.collaborator
      if (!createdCollaborator) {
        throw new Error('Unexpected collaborator creation response.')
      }

      setCollaborators((current) => [createdCollaborator, ...current])
      setUsername('')
      setRole('editor')
      toast.success('Collaborator added successfully.')
    } catch (err) {
      console.error(err)
      toast.error(err instanceof Error ? err.message : 'Failed to add collaborator.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteCollaborator = async (userId: string) => {
    setRemovingId(userId)

    try {
      const response = await fetch(`/api/works/${workId}/collaborators`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => null)
        if (data && typeof data === 'object' && 'error' in data) {
          throw new Error(String(data.error))
        }

        throw new Error('Failed to remove collaborator.')
      }

      setCollaborators((current) => current.filter((collaborator) => collaborator.userId !== userId))
      toast.success('Collaborator removed successfully.')
    } catch (err) {
      console.error(err)
      toast.error(err instanceof Error ? err.message : 'Failed to remove collaborator.')
    } finally {
      setRemovingId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    )
  }

  if (error) {
    return <div className="text-red-400 text-center py-8">{error}</div>
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex gap-4 mb-6">
        <button
          className={`px-4 py-2 rounded-t-lg font-semibold ${activeTab === 'activity' ? 'bg-gray-800 text-white border-b-2 border-blue-500' : 'bg-gray-700 text-gray-300'}`}
          onClick={() => setActiveTab('activity')}
        >
          Activity
        </button>
        <button
          className={`px-4 py-2 rounded-t-lg font-semibold relative ${activeTab === 'suggestions' ? 'bg-gray-800 text-white border-b-2 border-yellow-500' : 'bg-gray-700 text-gray-300'}`}
          onClick={() => setActiveTab('suggestions')}
        >
          Suggestions
          {pendingSuggestions > 0 && (
            <span className="absolute -top-2 -right-3 bg-yellow-500 text-white text-xs rounded-full px-2 py-0.5">{pendingSuggestions}</span>
          )}
        </button>
      </div>

      {activeTab === 'activity' ? (
        <>
          <div>
            <h1 className="text-3xl font-bold text-white">Collaborators</h1>
            <p className="mt-2 text-gray-400">
              Invite collaborators by username and assign an editor or contributor role.
            </p>
          </div>

          <div className="rounded-2xl border border-gray-700 bg-gray-800 p-6">
            <h2 className="text-lg font-semibold text-white">Add Collaborator</h2>
            <form className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-[1fr,200px,auto]" onSubmit={handleAddCollaborator}>
              <input
                type="text"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="Enter username (e.g. stonecoldsam)"
                className="rounded-xl border border-gray-700 bg-gray-900 px-4 py-3 text-white placeholder:text-gray-500 focus:border-blue-500 focus:outline-none"
                required
              />
              <select
                value={role}
                onChange={(event) => setRole(event.target.value as (typeof roles)[number])}
                className="rounded-xl border border-gray-700 bg-gray-900 px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
              >
                {roles.map((roleOption) => (
                  <option key={roleOption} value={roleOption}>
                    {formatRole(roleOption)}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <UserPlusIcon className="h-5 w-5" />
                Add
              </button>
            </form>
          </div>

          <div className="rounded-2xl border border-gray-700 bg-gray-800">
            <div className="border-b border-gray-700 px-6 py-5">
              <h2 className="text-lg font-semibold text-white">Current Collaborators</h2>
            </div>
            {collaborators.length === 0 ? (
              <EmptyState
                emoji={HANDSHAKE_EMOJI}
                title="No collaborators yet"
                description="Invite someone to start sharing editing and review work."
              />
            ) : (
              <div className="divide-y divide-gray-700">
                {collaborators.map((collaborator) => {
                  const isEditing = editing[collaborator.userId]
                  const isRowLoading = rowLoading[collaborator.userId]
                  const editValue = editValues[collaborator.userId] || {
                    role: collaborator.role,
                    revenueShare: collaborator.revenueShare != null ? collaborator.revenueShare.toFixed(2) : '',
                  }

                  return (
                    <div
                      key={collaborator.id}
                      className="flex flex-col gap-4 px-6 py-5 md:flex-row md:items-center md:justify-between"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-900 text-sm font-semibold text-white">
                          {getInitials(collaborator.user.displayName || collaborator.user.username)}
                        </div>
                        <div>
                          <div className="text-base font-semibold text-white">
                            {collaborator.user.displayName || collaborator.user.username}
                          </div>
                          <div className="text-sm text-gray-400">@{collaborator.user.username}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {isEditing ? (
                          <>
                            <select
                              value={editValue.role}
                              onChange={e => setEditValues(v => ({ ...v, [collaborator.userId]: { ...editValue, role: e.target.value } }))}
                              className="rounded-xl border border-gray-700 bg-gray-900 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                              disabled={isRowLoading}
                            >
                              {roles.map((roleOption) => (
                                <option key={roleOption} value={roleOption}>{formatRole(roleOption)}</option>
                              ))}
                            </select>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="0.01"
                              value={editValue.revenueShare}
                              onChange={e => setEditValues(v => ({ ...v, [collaborator.userId]: { ...editValue, revenueShare: e.target.value } }))}
                              className="w-20 rounded-xl border border-gray-700 bg-gray-900 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                              disabled={isRowLoading}
                            />
                            <span className="text-gray-400">%</span>
                            <button
                              type="button"
                              className="rounded-xl bg-blue-600 px-3 py-2 text-white font-semibold hover:bg-blue-500 disabled:opacity-50"
                              disabled={isRowLoading}
                              onClick={async () => {
                                setRowLoading(v => ({ ...v, [collaborator.userId]: true }))
                                try {
                                  const patchBody = {
                                    userId: collaborator.userId,
                                    role: editValue.role,
                                    revenueShare: parseFloat(editValue.revenueShare),
                                  }
                                  const response = await fetch(`/api/works/${workId}/collaborators`, {
                                    method: 'PATCH',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify(patchBody),
                                  })
                                  if (!response.ok) {
                                    const data = await response.json().catch(() => null)
                                    throw new Error(data?.error || 'Failed to update collaborator.')
                                  }
                                  setCollaborators(current =>
                                    current.map(c => (c.userId === collaborator.userId
                                      ? { ...c, role: patchBody.role, revenueShare: patchBody.revenueShare }
                                      : c))
                                  )
                                  setEditing(v => ({ ...v, [collaborator.userId]: false }))
                                  toast.success('Collaborator updated.')
                                } catch (err) {
                                  console.error(err)
                                  toast.error(err instanceof Error ? err.message : 'Failed to update collaborator.')
                                } finally {
                                  setRowLoading(v => ({ ...v, [collaborator.userId]: false }))
                                }
                              }}
                            >Save</button>
                            <button
                              type="button"
                              className="rounded-xl border border-gray-700 px-3 py-2 text-gray-300 hover:bg-gray-700 disabled:opacity-50"
                              disabled={isRowLoading}
                              onClick={() => setEditing(v => ({ ...v, [collaborator.userId]: false }))}
                            >Cancel</button>
                          </>
                        ) : (
                          <>
                            <span className={roleBadgeClass(collaborator.role)}>{formatRole(collaborator.role)}</span>
                            <span className="ml-2 text-sm text-gray-300 font-mono">
                              {collaborator.revenueShare != null ? `${collaborator.revenueShare.toFixed(2)}%` : '--'}
                            </span>
                            {isAuthor && (
                              <button
                                type="button"
                                className="ml-2 rounded-xl border border-blue-500/30 bg-blue-500/10 px-3 py-2 text-blue-300 hover:bg-blue-500/20 disabled:opacity-50"
                                onClick={() => {
                                  setEditing(v => ({ ...v, [collaborator.userId]: true }))
                                  setEditValues(v => ({
                                    ...v,
                                    [collaborator.userId]: {
                                      role: collaborator.role,
                                      revenueShare: collaborator.revenueShare != null ? collaborator.revenueShare.toFixed(2) : '',
                                    }
                                  }))
                                }}
                                disabled={isRowLoading}
                              >
                                Edit
                              </button>
                            )}
                          </>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeleteCollaborator(collaborator.userId)}
                          disabled={removingId === collaborator.userId || isRowLoading}
                          className="inline-flex items-center justify-center rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-red-300 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                          aria-label={`Remove ${collaborator.user.username}`}
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-gray-700 bg-gray-800">
            <div className="border-b border-gray-700 px-6 py-5 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Collaboration Activity</h2>
            </div>
            <div className="px-6 py-5">
              {activityLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500" />
                </div>
              ) : activityError ? (
                <div className="text-red-400 text-center py-8">{activityError}</div>
              ) : activity.length === 0 ? (
                <EmptyState
                  emoji="📝"
                  title="No collaboration activity yet"
                  description="All collaborator actions will appear here."
                />
              ) : (
                <ul className="divide-y divide-gray-700">
                  {activity.map((event) => (
                    <li key={event.id} className="flex items-center gap-4 py-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-900 text-sm font-semibold text-white">
                        {getInitials(event.actor.displayName || event.actor.username)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-white">
                            {event.actor.displayName || event.actor.username}
                          </span>
                          <span className="text-gray-400 text-xs">@{event.actor.username}</span>
                          <span className="text-gray-500 text-xs">• {formatActionLabel(event.action)}</span>
                        </div>
                        {event.summary && (
                          <div className="text-gray-300 text-sm mt-1 line-clamp-2">{event.summary}</div>
                        )}
                      </div>
                      <div className="text-xs text-gray-400 whitespace-nowrap ml-2">{formatDateTime(event.createdAt)}</div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </>
      ) : (
        <>
          <div>
            <h1 className="text-3xl font-bold text-white">Suggestion Review</h1>
            <p className="mt-2 text-gray-400">
              Review collaborator suggestions chapter by chapter and accept them only when you are ready to apply the change.
            </p>
          </div>

          <div className="rounded-2xl border border-gray-700 bg-gray-800 p-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Choose chapter
            </label>
            <div className="relative max-w-xl">
              <select
                value={selectedSectionId}
                onChange={(event) => setSelectedSectionId(event.target.value)}
                disabled={sectionsLoading || sections.length === 0}
                className="w-full appearance-none rounded-xl border border-gray-700 bg-gray-900 px-4 py-3 pr-10 text-white focus:border-blue-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
              >
                {sections.length === 0 ? (
                  <option value="">No chapters available</option>
                ) : (
                  sections.map((section, index) => (
                    <option key={section.id} value={section.id}>
                      {formatSectionLabel(section, index)}
                    </option>
                  ))
                )}
              </select>
              <ChevronDownIcon className="pointer-events-none absolute right-3 top-3.5 h-5 w-5 text-gray-400" />
            </div>
            {sectionsError && <div className="mt-3 text-sm text-red-400">{sectionsError}</div>}
            <p className="mt-3 text-sm text-gray-400">
              Accepting a suggestion still requires holding the chapter lock, so editors cannot overwrite active work in progress.
            </p>
          </div>

          {sectionsLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
            </div>
          ) : sections.length === 0 ? (
            <div className="rounded-2xl border border-gray-700 bg-gray-800">
              <EmptyState
                emoji="📚"
                title="No chapters yet"
                description="Create a chapter before collaborators can propose edits for it."
              />
            </div>
          ) : (
            <EditSuggestionsPanel
              workId={workId}
              sectionId={selectedSectionId}
              sectionTitle={selectedSectionTitle}
              currentContent={selectedSectionContent}
              onSuggestionResolved={async () => {
                await Promise.all([
                  refreshPendingSuggestions(),
                  refreshSelectedSectionContent(selectedSectionId),
                ])
              }}
            />
          )}
        </>
      )}
    </div>
  )
}

function formatRole(role: string) {
  return role
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function getInitials(value: string) {
  return value
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

function roleBadgeClass(role: string) {
  if (role === 'editor') {
    return 'inline-flex items-center rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-300'
  }

  if (role === 'contributor') {
    return 'inline-flex items-center rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-300'
  }

  return 'inline-flex items-center rounded-full border border-purple-500/20 bg-purple-500/10 px-3 py-1 text-xs font-semibold text-purple-300'
}

function formatActionLabel(action: string) {
  switch (action) {
    case 'added_collaborator':
    case 'invited_collaborator':
      return 'Added collaborator'
    case 'removed_collaborator':
      return 'Removed collaborator'
    case 'changed_role':
      return 'Changed role'
    case 'published_chapter':
      return 'Published chapter'
    case 'edited_section':
      return 'Edited section'
    default:
      return action.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  }
}

function formatDateTime(iso: string) {
  const date = new Date(iso)
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatSectionLabel(section: SectionSummary, index: number) {
  const chapterNumber = section.chapterNumber ?? index + 1
  return `Chapter ${chapterNumber}: ${section.title || 'Untitled chapter'}`
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
    <div className="py-16 text-center">
      <div className="text-4xl">{emoji}</div>
      <h3 className="mt-4 text-xl font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm text-gray-400">{description}</p>
    </div>
  )
}
