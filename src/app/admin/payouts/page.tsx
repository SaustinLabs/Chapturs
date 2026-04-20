'use client'

import { useEffect, useMemo, useState } from 'react'
import AppLayout from '@/components/AppLayout'

type PayoutRow = {
  id: string
  authorId: string
  amount: number
  status: string
  method?: string | null
  failureReason?: string | null
  requestedAt?: string | null
  processedAt?: string | null
  createdAt: string
  author?: {
    user?: {
      username?: string | null
      displayName?: string | null
      email?: string | null
    }
  }
}

export default function AdminPayoutsPage() {
  const [rows, setRows] = useState<PayoutRow[]>([])
  const [selectedAuthorIds, setSelectedAuthorIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [method, setMethod] = useState('stripe')
  const [statusFilter, setStatusFilter] = useState('pending,processing')
  const [failureReason, setFailureReason] = useState('Manual review failed payout verification')

  async function loadRows() {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/payouts?status=${encodeURIComponent(statusFilter)}`)
      const data = await res.json()
      setRows(Array.isArray(data?.payouts) ? data.payouts : [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRows()
  }, [statusFilter])

  const uniqueAuthorIds = useMemo(() => {
    return Array.from(new Set(rows.map((r) => r.authorId)))
  }, [rows])

  const selectedRows = useMemo(() => {
    return rows.filter((r) => selectedAuthorIds.includes(r.authorId))
  }, [rows, selectedAuthorIds])

  const selectedTotal = useMemo(() => {
    return selectedRows.reduce((sum, row) => sum + Number(row.amount || 0), 0)
  }, [selectedRows])

  function toggleAuthor(authorId: string) {
    setSelectedAuthorIds((prev) =>
      prev.includes(authorId) ? prev.filter((id) => id !== authorId) : [...prev, authorId]
    )
  }

  async function process(action: 'approve' | 'complete' | 'fail') {
    if (selectedAuthorIds.length === 0) return
    setSubmitting(true)
    try {
      const payload: any = {
        action,
        authorIds: selectedAuthorIds,
      }
      if (action === 'approve' || action === 'complete') payload.method = method
      if (action === 'fail') payload.failureReason = failureReason

      await fetch('/api/admin/payouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      await loadRows()
      setSelectedAuthorIds([])
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Payout Operations</h1>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Approve, complete, or fail creator payout batches.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-4">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
            Status Filter
            <select
              className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="pending,processing">pending + processing</option>
              <option value="pending">pending</option>
              <option value="processing">processing</option>
              <option value="failed">failed</option>
              <option value="completed">completed</option>
            </select>
          </label>

          <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
            Method
            <select
              className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2"
              value={method}
              onChange={(e) => setMethod(e.target.value)}
            >
              <option value="stripe">stripe</option>
              <option value="paypal">paypal</option>
              <option value="bank">bank</option>
            </select>
          </label>

          <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
            Fail Reason
            <input
              className="mt-1 w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2"
              value={failureReason}
              onChange={(e) => setFailureReason(e.target.value)}
            />
          </label>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-4 flex flex-wrap items-center gap-3">
          <button
            disabled={submitting || selectedAuthorIds.length === 0}
            onClick={() => process('approve')}
            className="rounded-lg bg-yellow-600 text-white px-4 py-2 disabled:opacity-50"
          >
            Approve
          </button>
          <button
            disabled={submitting || selectedAuthorIds.length === 0}
            onClick={() => process('complete')}
            className="rounded-lg bg-green-600 text-white px-4 py-2 disabled:opacity-50"
          >
            Complete
          </button>
          <button
            disabled={submitting || selectedAuthorIds.length === 0}
            onClick={() => process('fail')}
            className="rounded-lg bg-red-600 text-white px-4 py-2 disabled:opacity-50"
          >
            Fail
          </button>
          <span className="text-sm text-gray-600 dark:text-gray-300">
            Selected authors: {selectedAuthorIds.length} / {uniqueAuthorIds.length}
          </span>
          <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">
            Selected total: ${selectedTotal.toFixed(2)}
          </span>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden">
          {loading ? (
            <div className="p-6 text-sm text-gray-500">Loading payouts...</div>
          ) : rows.length === 0 ? (
            <div className="p-6 text-sm text-gray-500">No payouts found for current filter.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="text-left p-3">Select</th>
                  <th className="text-left p-3">Creator</th>
                  <th className="text-left p-3">Amount</th>
                  <th className="text-left p-3">Status</th>
                  <th className="text-left p-3">Method</th>
                  <th className="text-left p-3">Requested</th>
                  <th className="text-left p-3">Processed</th>
                  <th className="text-left p-3">Failure</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const creatorLabel = row.author?.user?.displayName || row.author?.user?.username || row.author?.user?.email || row.authorId
                  const selected = selectedAuthorIds.includes(row.authorId)
                  return (
                    <tr key={row.id} className="border-t border-gray-100 dark:border-gray-800">
                      <td className="p-3">
                        <input type="checkbox" checked={selected} onChange={() => toggleAuthor(row.authorId)} />
                      </td>
                      <td className="p-3">{creatorLabel}</td>
                      <td className="p-3">${Number(row.amount || 0).toFixed(2)}</td>
                      <td className="p-3">{row.status}</td>
                      <td className="p-3">{row.method || '-'}</td>
                      <td className="p-3">{row.requestedAt ? new Date(row.requestedAt).toLocaleString() : '-'}</td>
                      <td className="p-3">{row.processedAt ? new Date(row.processedAt).toLocaleString() : '-'}</td>
                      <td className="p-3">{row.failureReason || '-'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
