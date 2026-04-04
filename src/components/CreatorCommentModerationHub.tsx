'use client'

import type { ReactNode } from 'react'
import { useEffect, useMemo, useState } from 'react'
import {
  HandThumbUpIcon,
  NoSymbolIcon,
  TrashIcon,
} from '@heroicons/react/24/outline'
import { useToast } from '@/components/ui/Toast'

interface Report {
  id: string
  reason: string
  status: string
  createdAt: string
  comment: {
    content: string
    createdAt: string
    user: {
      username: string
    }
    work: {
      title: string
    }
    section: {
      title: string
    } | null
  }
}

type FilterTab = 'all' | 'pending' | 'resolved'
const SHIELD_EMOJI = String.fromCodePoint(0x1f6e1)

export default function CreatorCommentModerationHub() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reports, setReports] = useState<Report[]>([])
  const [activeTab, setActiveTab] = useState<FilterTab>('all')
  const [processingId, setProcessingId] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await fetch('/api/creator/moderation/comments?status=all&limit=100')

        if (!response.ok) {
          throw new Error('Failed to fetch flagged comments.')
        }

        const data = await response.json()

        if (!data || typeof data !== 'object' || !Array.isArray(data.reports)) {
          console.log('Unexpected moderation response:', data)
          throw new Error('Unexpected moderation response.')
        }

        setReports(data.reports as Report[])
      } catch (err) {
        console.error(err)
        setError(err instanceof Error ? err.message : 'Failed to load moderation comments.')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  const filteredReports = useMemo(() => {
    if (activeTab === 'pending') {
      return reports.filter((report) => report.status === 'pending')
    }

    if (activeTab === 'resolved') {
      return reports.filter((report) => report.status !== 'pending')
    }

    return reports
  }, [activeTab, reports])

  const handleAction = async (
    reportId: string,
    action: 'dismiss' | 'hide' | 'delete',
    successMessage: string
  ) => {
    setProcessingId(reportId)

    try {
      const response = await fetch(`/api/creator/moderation/comments/${reportId}/action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => null)
        if (data && typeof data === 'object' && 'error' in data) {
          throw new Error(String(data.error))
        }

        console.log('Unexpected moderation action response:', data)
        throw new Error('Failed to update comment moderation.')
      }

      setReports((current) => current.filter((report) => report.id !== reportId))
      toast.success(successMessage)
    } catch (err) {
      console.error(err)
      toast.error(err instanceof Error ? err.message : 'Failed to update comment moderation.')
    } finally {
      setProcessingId(null)
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
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Comment Moderation</h1>
        <p className="mt-2 text-gray-400">
          Review flagged comments across your published and draft works.
        </p>
      </div>

      <div className="flex items-center gap-2 border-b border-gray-700">
        {(['all', 'pending', 'resolved'] as const).map((tab) => (
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
            {tab === 'all' ? 'All' : tab === 'pending' ? 'Pending' : 'Resolved'}
          </button>
        ))}
      </div>

      {filteredReports.length === 0 ? (
        <EmptyState
          emoji={SHIELD_EMOJI}
          title="No flagged comments"
          description="You’re caught up. New flagged comments will appear here."
        />
      ) : (
        <div className="space-y-4">
          {filteredReports.map((report) => (
            <div
              key={report.id}
              className="rounded-2xl border border-gray-700 bg-gray-800 p-6"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-red-300">
                      {report.reason}
                    </span>
                    <span className="text-sm text-gray-400">
                      {new Date(report.createdAt).toLocaleString()}
                    </span>
                  </div>

                  <div className="rounded-xl border border-gray-700 bg-gray-900/60 p-4">
                    <p className="text-base text-white">{report.comment.content}</p>
                  </div>

                  <div className="grid grid-cols-1 gap-3 text-sm text-gray-400 md:grid-cols-2 xl:grid-cols-4">
                    <div>
                      <span className="block text-xs uppercase tracking-wide text-gray-500">
                        Author
                      </span>
                      <span className="text-white">{report.comment.user.username}</span>
                    </div>
                    <div>
                      <span className="block text-xs uppercase tracking-wide text-gray-500">
                        Work
                      </span>
                      <span className="text-white">{report.comment.work.title}</span>
                    </div>
                    <div>
                      <span className="block text-xs uppercase tracking-wide text-gray-500">
                        Chapter
                      </span>
                      <span className="text-white">
                        {report.comment.section?.title || 'Unknown chapter'}
                      </span>
                    </div>
                    <div>
                      <span className="block text-xs uppercase tracking-wide text-gray-500">
                        Timestamp
                      </span>
                      <span className="text-white">
                        {new Date(report.comment.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2 lg:min-w-44">
                  <ActionButton
                    label="Approve"
                    icon={<HandThumbUpIcon className="h-4 w-4" />}
                    className="border-green-500/30 bg-green-500/10 text-green-300 hover:bg-green-500/20"
                    disabled={processingId === report.id}
                    onClick={() =>
                      handleAction(report.id, 'dismiss', 'Comment report approved and resolved.')
                    }
                  />
                  <ActionButton
                    label="Reject"
                    icon={<NoSymbolIcon className="h-4 w-4" />}
                    className="border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20"
                    disabled={processingId === report.id}
                    onClick={() =>
                      handleAction(report.id, 'hide', 'Comment rejected and hidden.')
                    }
                  />
                  <ActionButton
                    label="Delete"
                    icon={<TrashIcon className="h-4 w-4" />}
                    className="border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/20"
                    disabled={processingId === report.id}
                    onClick={() =>
                      handleAction(report.id, 'delete', 'Comment deleted successfully.')
                    }
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ActionButton({
  label,
  icon,
  className,
  disabled,
  onClick,
}: {
  label: string
  icon: ReactNode
  className: string
  disabled: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      {icon}
      {label}
    </button>
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
