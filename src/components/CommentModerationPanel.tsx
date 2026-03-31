'use client'

import { useState, useEffect } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { AlertTriangle, Eye, Check, X } from 'lucide-react'

interface CommentReport {
  id: string
  commentId: string
  userId: string
  reason: string
  details: string | null
  status: string
  createdAt: string
  comment: {
    id: string
    content: string
    createdAt: string
    user: {
      id: string
      username: string
      displayName: string | null
    }
    work: {
      id: string
      title: string
    }
    section: {
      id: string
      title: string
    } | null
  }
  user: {
    id: string
    username: string
    displayName: string | null
  }
}

export default function CommentModerationPanel() {
  const [reports, setReports] = useState<CommentReport[]>([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState<'pending' | 'reviewed' | 'actioned' | 'all'>('pending')
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [processingReportId, setProcessingReportId] = useState<string | null>(null)

  useEffect(() => {
    fetchReports()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status])

  const fetchReports = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ status, limit: '50' })
      const response = await fetch(`/api/creator/moderation/comments?${params}`)
      const data = await response.json()

      if (response.ok) {
        setReports(data.reports)
        setCounts(data.counts)
      } else {
        console.error('Failed to fetch reports:', data.error)
      }
    } catch (error) {
      console.error('Error fetching reports:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleReportAction = async (reportId: string, action: 'dismiss' | 'hide' | 'delete') => {
    if (action === 'delete' && !confirm('Are you sure you want to delete this comment?')) return

    setProcessingReportId(reportId)
    try {
      const response = await fetch(`/api/creator/moderation/comments/${reportId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      })

      if (response.ok) {
        fetchReports() // Refresh list
      } else {
        const data = await response.json().catch(() => ({}))
        alert(data?.error || 'Failed to process moderation action')
      }
    } catch (error) {
      console.error('Error processing moderation action:', error)
      alert('Failed to process moderation action')
    } finally {
      setProcessingReportId(null)
    }
  }

  const getReasonColor = (reason: string) => {
    switch (reason) {
      case 'spam':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
      case 'harassment':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
      case 'spoiler':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-100 mb-2">Comment Moderation</h1>
        <p className="text-gray-400">Manage reported comments on your works</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
          <div className="text-sm text-gray-400">Pending</div>
          <div className="text-2xl font-bold text-orange-400">{counts.pending || 0}</div>
        </div>
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
          <div className="text-sm text-gray-400">Reviewed</div>
          <div className="text-2xl font-bold text-blue-400">{counts.reviewed || 0}</div>
        </div>
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
          <div className="text-sm text-gray-400">Actioned</div>
          <div className="text-2xl font-bold text-green-400">{counts.actioned || 0}</div>
        </div>
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
          <div className="text-sm text-gray-400">Total</div>
          <div className="text-2xl font-bold text-gray-100">
            {Object.values(counts).reduce((sum, count) => sum + count, 0)}
          </div>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-2 border-b border-gray-700">
        {(['pending', 'reviewed', 'actioned', 'all'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setStatus(tab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              status === tab
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Reports list */}
      {reports.length === 0 ? (
        <div className="text-center py-12 bg-gray-800 rounded-lg border border-gray-700">
          <AlertTriangle className="w-12 h-12 mx-auto text-gray-600 mb-3" />
          <p className="text-gray-300 font-medium">No reports found</p>
          <p className="text-sm text-gray-500 mt-1">
            {status === 'pending'
              ? 'No pending reports at the moment'
              : `No ${status} reports to show`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <div
              key={report.id}
              className="bg-gray-800 rounded-lg border border-gray-700 p-6 space-y-4"
            >
              {/* Report header */}
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getReasonColor(report.reason)}`}>
                      {report.reason}
                    </span>
                    <span className="text-sm text-gray-400">
                      Reported {formatDistanceToNow(new Date(report.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  <div className="text-sm text-gray-400">
                    Reported by{' '}
                    <span className="font-medium text-gray-300">
                      {report.user.displayName || report.user.username}
                    </span>
                  </div>
                </div>
              </div>

              {/* Work & section info */}
              <div className="text-sm text-gray-400">
                <span className="font-medium text-gray-200">{report.comment.work.title}</span>
                {report.comment.section && (
                  <> - {report.comment.section.title}</>
                )}
              </div>

              {/* Comment content */}
              <div className="bg-gray-900/50 rounded-lg p-4 space-y-2 border border-gray-700">
                <div className="flex items-start justify-between">
                  <span className="text-sm font-medium text-gray-200">
                    {report.comment.user.displayName || report.comment.user.username}
                  </span>
                  <span className="text-xs text-gray-500">
                    {formatDistanceToNow(new Date(report.comment.createdAt), { addSuffix: true })}
                  </span>
                </div>
                <p className="text-sm text-gray-300 whitespace-pre-wrap">
                  {report.comment.content}
                </p>
              </div>

              {/* Report details */}
              {report.details && (
                <div className="text-sm text-gray-400">
                  <span className="font-medium text-gray-300">Details:</span> {report.details}
                </div>
              )}

              {/* Actions */}
              {report.status === 'pending' && (
                <div className="flex items-center gap-3 pt-2 border-t border-gray-700">
                  <button
                    onClick={() => handleReportAction(report.id, 'hide')}
                    disabled={processingReportId === report.id}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <Eye className="w-4 h-4" />
                    Hide Comment
                  </button>
                  <button
                    onClick={() => handleReportAction(report.id, 'delete')}
                    disabled={processingReportId === report.id}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <X className="w-4 h-4" />
                    Delete Comment
                  </button>
                  <button
                    onClick={() => handleReportAction(report.id, 'dismiss')}
                    disabled={processingReportId === report.id}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-300 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <Check className="w-4 h-4" />
                    {processingReportId === report.id ? 'Processing...' : 'Dismiss Report'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
