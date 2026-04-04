'use client'

import type { ReactNode } from 'react'
import { useEffect, useMemo, useState } from 'react'
import {
  ArrowPathIcon,
  BanknotesIcon,
  CheckBadgeIcon,
  CreditCardIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline'

interface EarningsPayload {
  earnings: {
    totalRevenue: number
    pendingPayout: number
    lifetimePayout: number
  }
  payouts: Array<{
    id: string
    amount: number
    status: string
    method: string | null
    createdAt: string
  }>
}

interface PremiumPayload {
  isPremium: boolean
}

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
})

const rowsPerPage = 8
const MONEY_WITH_WINGS = String.fromCodePoint(0x1f4b8)

export default function CreatorMonetizationHub() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [earnings, setEarnings] = useState<EarningsPayload | null>(null)
  const [isPremium, setIsPremium] = useState(false)
  const [page, setPage] = useState(1)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError(null)

      try {
        const [earningsResponse, premiumResponse] = await Promise.all([
          fetch('/api/creator/earnings'),
          fetch('/api/premium/status'),
        ])

        if (!earningsResponse.ok) {
          throw new Error('Failed to fetch earnings.')
        }

        if (!premiumResponse.ok) {
          throw new Error('Failed to fetch premium status.')
        }

        const [earningsData, premiumData] = await Promise.all([
          earningsResponse.json(),
          premiumResponse.json(),
        ])

        if (
          !earningsData ||
          typeof earningsData !== 'object' ||
          !('earnings' in earningsData) ||
          !('payouts' in earningsData) ||
          !Array.isArray(earningsData.payouts)
        ) {
          console.log('Unexpected earnings response:', earningsData)
          throw new Error('Unexpected earnings response.')
        }

        if (
          !premiumData ||
          typeof premiumData !== 'object' ||
          typeof premiumData.isPremium !== 'boolean'
        ) {
          console.log('Unexpected premium status response:', premiumData)
          throw new Error('Unexpected premium status response.')
        }

        setEarnings(earningsData as EarningsPayload)
        setIsPremium((premiumData as PremiumPayload).isPremium)
      } catch (err) {
        console.error(err)
        setError(err instanceof Error ? err.message : 'Failed to load monetization data.')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  const payoutRows = useMemo(() => earnings?.payouts ?? [], [earnings])
  const lifetimeEarnings = earnings?.earnings.totalRevenue ?? 0
  const pendingPayout = earnings?.earnings.pendingPayout ?? 0
  const currentBalance = Math.max(
    0,
    lifetimeEarnings - (earnings?.earnings.lifetimePayout ?? 0)
  )

  const paginatedRows = useMemo(() => {
    const start = (page - 1) * rowsPerPage
    return payoutRows.slice(start, start + rowsPerPage)
  }, [page, payoutRows])

  const pageCount = Math.max(1, Math.ceil(payoutRows.length / rowsPerPage))

  useEffect(() => {
    if (page > pageCount) {
      setPage(pageCount)
    }
  }, [page, pageCount])

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <div className="space-y-3">
          <div className="h-10 w-64 rounded-xl bg-gray-800 animate-pulse" />
          <div className="h-5 w-96 rounded-xl bg-gray-800 animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[0, 1, 2].map((item) => (
            <div key={item} className="rounded-2xl border border-gray-700 bg-gray-800 p-6 space-y-4">
              <div className="h-5 w-28 rounded bg-gray-700 animate-pulse" />
              <div className="h-9 w-36 rounded bg-gray-700 animate-pulse" />
              <div className="h-4 w-24 rounded bg-gray-700 animate-pulse" />
            </div>
          ))}
        </div>
        <div className="rounded-2xl border border-gray-700 bg-gray-800 p-6 space-y-4">
          {[0, 1, 2, 3, 4].map((item) => (
            <div key={item} className="grid grid-cols-4 gap-4">
              <div className="h-5 rounded bg-gray-700 animate-pulse" />
              <div className="h-5 rounded bg-gray-700 animate-pulse" />
              <div className="h-5 rounded bg-gray-700 animate-pulse" />
              <div className="h-5 rounded bg-gray-700 animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return <div className="text-red-400 text-center py-8">{error}</div>
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Monetization</h1>
          <p className="mt-2 text-gray-400">
            Track earnings, payout progress, and recent payout history.
          </p>
        </div>
        {isPremium && (
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/40 bg-blue-500/10 px-4 py-2 text-sm font-medium text-blue-300">
            <SparklesIcon className="h-5 w-5" />
            Premium Status
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard
          title="Current Balance"
          value={currencyFormatter.format(currentBalance)}
          hint="Available across your creator account"
          icon={<BanknotesIcon className="h-6 w-6 text-emerald-300" />}
        />
        <MetricCard
          title="Pending Payout"
          value={currencyFormatter.format(pendingPayout)}
          hint="Awaiting payout processing"
          icon={<ArrowPathIcon className="h-6 w-6 text-amber-300" />}
        />
        <MetricCard
          title="Lifetime Earnings"
          value={currencyFormatter.format(lifetimeEarnings)}
          hint="Total creator earnings to date"
          icon={<CreditCardIcon className="h-6 w-6 text-blue-300" />}
        />
      </div>

      <div className="rounded-2xl border border-gray-700 bg-gray-800">
        <div className="flex flex-col gap-3 border-b border-gray-700 px-6 py-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white">Payout History</h2>
            <p className="mt-1 text-sm text-gray-400">
              Recent payout activity across your creator account.
            </p>
          </div>
          <div className="text-sm text-gray-400">
            {payoutRows.length} total {payoutRows.length === 1 ? 'entry' : 'entries'}
          </div>
        </div>

        {payoutRows.length === 0 ? (
          <EmptyState
            emoji={MONEY_WITH_WINGS}
            title="No payouts yet"
            description="Your payout history will appear here once earnings are processed."
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-gray-900/60">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">
                      Date
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">
                      Type
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">
                      Amount
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {paginatedRows.map((row) => {
                    const normalizedStatus = normalizePayoutStatus(row.status)
                    return (
                      <tr key={row.id} className="hover:bg-gray-900/40">
                        <td className="px-6 py-4 text-sm text-white">
                          {new Date(row.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-300">
                          {row.method || 'Payout'}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium text-white">
                          {currencyFormatter.format(row.amount)}
                        </td>
                        <td className="px-6 py-4">
                          <span className={statusBadgeClass(normalizedStatus)}>
                            {normalizedStatus === 'paid' && (
                              <CheckBadgeIcon className="h-4 w-4" />
                            )}
                            <span className="capitalize">{normalizedStatus}</span>
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between border-t border-gray-700 px-6 py-4">
              <div className="text-sm text-gray-400">
                Page {page} of {pageCount}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage((value) => Math.max(1, value - 1))}
                  disabled={page === 1}
                  className="rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-gray-300 transition hover:border-gray-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() => setPage((value) => Math.min(pageCount, value + 1))}
                  disabled={page === pageCount}
                  className="rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-gray-300 transition hover:border-gray-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function MetricCard({
  title,
  value,
  hint,
  icon,
}: {
  title: string
  value: string
  hint: string
  icon: ReactNode
}) {
  return (
    <div className="rounded-2xl border border-gray-700 bg-gray-800 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-gray-400">{title}</p>
          <p className="mt-3 text-3xl font-bold text-white">{value}</p>
          <p className="mt-2 text-sm text-gray-400">{hint}</p>
        </div>
        <div className="rounded-xl border border-gray-700 bg-gray-900 p-3">{icon}</div>
      </div>
    </div>
  )
}

function normalizePayoutStatus(status: string): 'paid' | 'pending' | 'failed' {
  if (status === 'completed' || status === 'paid') return 'paid'
  if (status === 'failed') return 'failed'
  return 'pending'
}

function statusBadgeClass(status: 'paid' | 'pending' | 'failed') {
  if (status === 'paid') {
    return 'inline-flex items-center gap-2 rounded-full border border-green-500/20 bg-green-500/10 px-3 py-1 text-xs font-semibold text-green-300'
  }

  if (status === 'failed') {
    return 'inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-300'
  }

  return 'inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-300'
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
