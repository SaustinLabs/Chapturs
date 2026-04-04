'use client'

import type { ReactNode } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { signIn, useSession } from 'next-auth/react'
import AppLayout from '@/components/AppLayout'
import {
  CalendarDaysIcon,
  SparklesIcon,
  TrophyIcon,
  UsersIcon,
} from '@heroicons/react/24/outline'

interface Contest {
  id: string
  title: string
  description: string
  status: string
  startDate: string
  endDate: string
  submissionDeadline: string
  prizePool: number
  prizeSplit?: string
  _count?: {
    entries: number
  }
  winner?: {
    title?: string
    authorName?: string
  }
  winningEntry?: {
    title?: string
    authorName?: string
  }
}

interface WorkOption {
  id: string
  title: string
  description?: string
  sections?: Array<{ id: string; title: string }>
}

const TROPHY_EMOJI = String.fromCodePoint(0x1f3c6)

export default function ContestsPage() {
  const { data: session, status } = useSession()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState<string | null>(null)
  const [openContestId, setOpenContestId] = useState<string | null>(null)
  const [contests, setContests] = useState<Contest[]>([])
  const [works, setWorks] = useState<WorkOption[]>([])
  const [selectedWorkId, setSelectedWorkId] = useState('')
  const [draftTitle, setDraftTitle] = useState('')
  const [draftDescription, setDraftDescription] = useState('')
  const [draftExcerpt, setDraftExcerpt] = useState('')

  useEffect(() => {
    const loadContests = async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await fetch('/api/contests?status=all')

        if (!response.ok) {
          throw new Error('Failed to load contests.')
        }

        const data = await response.json()
        const nextContests = data?.data?.contests

        if (!Array.isArray(nextContests)) {
          console.log('Unexpected contests response:', data)
          throw new Error('Unexpected contests response.')
        }

        setContests(nextContests)
      } catch (loadError) {
        console.error(loadError)
        setError(loadError instanceof Error ? loadError.message : 'Failed to load contests.')
      } finally {
        setLoading(false)
      }
    }

    loadContests()
  }, [])

  useEffect(() => {
    if (!session?.user?.id) return

    const loadWorks = async () => {
      try {
        const response = await fetch('/api/works')
        if (!response.ok) {
          return
        }

        const data = await response.json()
        const nextWorks = data?.data?.works

        if (!Array.isArray(nextWorks)) {
          console.log('Unexpected contest works response:', data)
          return
        }

        setWorks(nextWorks)
      } catch (loadError) {
        console.error(loadError)
      }
    }

    loadWorks()
  }, [session?.user?.id])

  const activeContests = useMemo(
    () => contests.filter((contest) => !isEnded(contest)),
    [contests]
  )
  const pastContests = useMemo(
    () => contests.filter((contest) => isEnded(contest)),
    [contests]
  )
  const selectedWork = useMemo(
    () => works.find((work) => work.id === selectedWorkId) || null,
    [selectedWorkId, works]
  )

  useEffect(() => {
    if (!selectedWork) return
    setDraftTitle(selectedWork.title)
    setDraftDescription(selectedWork.description || '')
    setDraftExcerpt(
      selectedWork.description?.slice(0, 280) ||
        selectedWork.sections?.[0]?.title ||
        ''
    )
  }, [selectedWork])

  const handleEnterContest = async (contestId: string) => {
    if (!session?.user?.id) {
      signIn('google', { callbackUrl: '/contests' })
      return
    }

    if (!selectedWorkId) {
      setError('Select one of your works before entering a contest.')
      return
    }

    setSubmitting(contestId)
    setError(null)

    try {
      const response = await fetch(`/api/contests/${contestId}/enter`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ workId: selectedWorkId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data?.message || data?.error || 'Failed to enter contest.')
      }

      setOpenContestId(null)
      setSelectedWorkId('')
      setDraftTitle('')
      setDraftDescription('')
      setDraftExcerpt('')
    } catch (submitError) {
      console.error(submitError)
      setError(submitError instanceof Error ? submitError.message : 'Failed to enter contest.')
    } finally {
      setSubmitting(null)
    }
  }

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Contests</h1>
          <p className="mt-2 text-gray-400">
            Explore active competitions, review past contests, and submit one of your works to enter.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
          </div>
        ) : error && contests.length === 0 ? (
          <div className="text-red-400 text-center py-8">{error}</div>
        ) : (
          <>
            <ContestSection
              title="Active Contests"
              contests={activeContests}
              emptyTitle="No active contests"
              emptyDescription="New competitions will appear here when they open."
              openContestId={openContestId}
              setOpenContestId={setOpenContestId}
              works={works}
              selectedWorkId={selectedWorkId}
              setSelectedWorkId={setSelectedWorkId}
              draftTitle={draftTitle}
              setDraftTitle={setDraftTitle}
              draftDescription={draftDescription}
              setDraftDescription={setDraftDescription}
              draftExcerpt={draftExcerpt}
              setDraftExcerpt={setDraftExcerpt}
              sessionReady={Boolean(session?.user?.id)}
              sessionStatus={status}
              submitting={submitting}
              onEnterContest={handleEnterContest}
            />

            <ContestSection
              title="Past Contests"
              contests={pastContests}
              emptyTitle="No past contests"
              emptyDescription="Completed contests will appear here once they end."
              openContestId={null}
              setOpenContestId={setOpenContestId}
              works={works}
              selectedWorkId={selectedWorkId}
              setSelectedWorkId={setSelectedWorkId}
              draftTitle={draftTitle}
              setDraftTitle={setDraftTitle}
              draftDescription={draftDescription}
              setDraftDescription={setDraftDescription}
              draftExcerpt={draftExcerpt}
              setDraftExcerpt={setDraftExcerpt}
              sessionReady={Boolean(session?.user?.id)}
              sessionStatus={status}
              submitting={submitting}
              onEnterContest={handleEnterContest}
              readOnly
            />

            {error && contests.length > 0 && (
              <div className="text-red-400 text-center py-4">{error}</div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  )
}

function ContestSection({
  title,
  contests,
  emptyTitle,
  emptyDescription,
  openContestId,
  setOpenContestId,
  works,
  selectedWorkId,
  setSelectedWorkId,
  draftTitle,
  setDraftTitle,
  draftDescription,
  setDraftDescription,
  draftExcerpt,
  setDraftExcerpt,
  sessionReady,
  sessionStatus,
  submitting,
  onEnterContest,
  readOnly = false,
}: {
  title: string
  contests: Contest[]
  emptyTitle: string
  emptyDescription: string
  openContestId: string | null
  setOpenContestId: (value: string | null) => void
  works: WorkOption[]
  selectedWorkId: string
  setSelectedWorkId: (value: string) => void
  draftTitle: string
  setDraftTitle: (value: string) => void
  draftDescription: string
  setDraftDescription: (value: string) => void
  draftExcerpt: string
  setDraftExcerpt: (value: string) => void
  sessionReady: boolean
  sessionStatus: string
  submitting: string | null
  onEnterContest: (contestId: string) => void
  readOnly?: boolean
}) {
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <TrophyIcon className="h-5 w-5 text-amber-300" />
        <h2 className="text-2xl font-semibold text-white">{title}</h2>
      </div>

      {contests.length === 0 ? (
        <EmptyState emoji={TROPHY_EMOJI} title={emptyTitle} description={emptyDescription} />
      ) : (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          {contests.map((contest) => {
            const winner = contest.winner || contest.winningEntry
            return (
              <div key={contest.id} className="rounded-3xl border border-gray-700 bg-gray-800 p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-semibold text-white">{contest.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-gray-400">{contest.description}</p>
                  </div>
                  <span className={statusBadgeClass(contest)}>
                    {isEnded(contest) ? 'Ended' : 'Active'}
                  </span>
                </div>

                <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
                  <MetaCard
                    icon={<CalendarDaysIcon className="h-5 w-5 text-blue-300" />}
                    label="Deadline"
                    value={new Date(contest.submissionDeadline || contest.endDate).toLocaleDateString()}
                  />
                  <MetaCard
                    icon={<SparklesIcon className="h-5 w-5 text-emerald-300" />}
                    label="Prize"
                    value={formatPrizeDescription(contest)}
                  />
                  <MetaCard
                    icon={<UsersIcon className="h-5 w-5 text-purple-300" />}
                    label="Entries"
                    value={`${contest._count?.entries || 0}`}
                  />
                </div>

                {isEnded(contest) && winner?.title && (
                  <div className="mt-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3">
                    <div className="text-xs font-semibold uppercase tracking-wide text-emerald-300">
                      Winner
                    </div>
                    <div className="mt-1 text-sm text-white">
                      {winner.title}
                      {winner.authorName ? ` by ${winner.authorName}` : ''}
                    </div>
                  </div>
                )}

                {!readOnly && (
                  <div className="mt-6">
                    <button
                      type="button"
                      onClick={() =>
                        setOpenContestId(openContestId === contest.id ? null : contest.id)
                      }
                      className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500"
                    >
                      Enter Contest
                    </button>

                    {openContestId === contest.id && (
                      <div className="mt-4 rounded-2xl border border-gray-700 bg-gray-900 p-4">
                        {!sessionReady ? (
                          <div className="space-y-3">
                            <p className="text-sm text-gray-400">
                              Sign in to choose one of your works and enter this contest.
                            </p>
                            <button
                              type="button"
                              onClick={() => signIn('google', { callbackUrl: '/contests' })}
                              className="rounded-xl border border-gray-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800"
                            >
                              {sessionStatus === 'loading' ? 'Loading...' : 'Sign In'}
                            </button>
                          </div>
                        ) : works.length === 0 ? (
                          <p className="text-sm text-gray-400">
                            You need at least one work before you can enter a contest.
                          </p>
                        ) : (
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <label className="block text-sm font-medium text-gray-300">
                                Select Work
                              </label>
                              <select
                                value={selectedWorkId}
                                onChange={(event) => setSelectedWorkId(event.target.value)}
                                className="w-full rounded-xl border border-gray-700 bg-gray-800 px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
                              >
                                <option value="">Choose a work</option>
                                {works.map((work) => (
                                  <option key={work.id} value={work.id}>
                                    {work.title}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <ContestField label="Title" value={draftTitle} onChange={setDraftTitle} />
                            <ContestArea
                              label="Description"
                              value={draftDescription}
                              onChange={setDraftDescription}
                              rows={3}
                            />
                            <ContestArea
                              label="Content / Excerpt"
                              value={draftExcerpt}
                              onChange={setDraftExcerpt}
                              rows={5}
                            />
                            <p className="text-xs text-gray-500">
                              The current contest entry API registers the selected `workId`; these fields help you review what you are submitting.
                            </p>

                            <button
                              type="button"
                              onClick={() => onEnterContest(contest.id)}
                              disabled={submitting === contest.id || !selectedWorkId}
                              className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {submitting === contest.id ? 'Submitting...' : 'Submit Entry'}
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}

function MetaCard({
  icon,
  label,
  value,
}: {
  icon: ReactNode
  label: string
  value: string
}) {
  return (
    <div className="rounded-2xl border border-gray-700 bg-gray-900 p-4">
      <div className="flex items-center gap-2 text-gray-300">
        {icon}
        <span className="text-xs uppercase tracking-wide text-gray-500">{label}</span>
      </div>
      <div className="mt-3 text-sm font-semibold text-white">{value}</div>
    </div>
  )
}

function ContestField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-300">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-gray-700 bg-gray-800 px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
      />
    </div>
  )
}

function ContestArea({
  label,
  value,
  onChange,
  rows,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  rows: number
}) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-300">{label}</label>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={rows}
        className="w-full rounded-xl border border-gray-700 bg-gray-800 px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
      />
    </div>
  )
}

function isEnded(contest: Contest) {
  return (
    contest.status === 'completed' ||
    contest.status === 'cancelled' ||
    new Date(contest.endDate) < new Date()
  )
}

function formatPrizeDescription(contest: Contest) {
  try {
    const split = contest.prizeSplit ? JSON.parse(contest.prizeSplit) : []
    if (Array.isArray(split) && split.length > 0) {
      const topPrize = split[0]
      if (topPrize?.percent) {
        return `$${contest.prizePool.toFixed(0)} total, ${topPrize.percent}% for 1st`
      }
    }
  } catch (error) {
    console.log('Unexpected contest prize split:', contest.prizeSplit)
  }

  return `$${contest.prizePool.toFixed(0)} prize pool`
}

function statusBadgeClass(contest: Contest) {
  return isEnded(contest)
    ? 'inline-flex items-center rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-300'
    : 'inline-flex items-center rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1 text-xs font-semibold text-green-300'
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
    <div className="rounded-3xl border border-gray-700 bg-gray-800 py-16 text-center">
      <div className="text-4xl">{emoji}</div>
      <h3 className="mt-4 text-xl font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm text-gray-400">{description}</p>
    </div>
  )
}
