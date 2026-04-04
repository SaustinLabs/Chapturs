'use client'

import { useState, useEffect } from 'react'
import { DollarSign, Sparkles, AlertCircle, TrendingUp, Clock, CheckCircle } from 'lucide-react'
import AuthorAdSettings, { type AdSettings } from '@/components/ads/AuthorAdSettings'
import { resolveCoverSrc } from '@/lib/images'
import Image from 'next/image'

interface Work {
  id: string
  title: string
  coverImage?: string
  status: string
  adSettings: string | null
  _count: {
    sections: number
  }
}

interface MonetizationContentProps {
  works: Work[]
}

interface EarningsData {
  earnings: {
    totalRevenue: number
    premiumRevenue: number
    pendingPayout: number
    lifetimePayout: number
    totalImpressions: number
    totalClicks: number
    lastCalculatedAt: string | null
  }
  payouts: Array<{
    id: string
    amount: number
    status: string
    method: string | null
    transactionId: string | null
    processedAt: string | null
    createdAt: string
  }>
  monthlyEarnings: Array<{ month: string; revenue: number }>
  revenueShare: number
  minimumPayout: number
}

const defaultSettings: AdSettings = {
  sidebarEnabled: true,
  inlineEnabled: true,
  videoInterstitialEnabled: true,
  autoDensity: true,
  maxAdsPerChapter: 3,
  showCreatorPromos: true,
  creatorPromoSlots: 1,
  allowBanner: true,
  allowNative: true,
  allowVideo: false,
}

export default function MonetizationContent({ works }: MonetizationContentProps) {
  const [savingStates, setSavingStates] = useState<Record<string, boolean>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [earningsData, setEarningsData] = useState<EarningsData | null>(null)
  const [earningsLoading, setEarningsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'earnings' | 'settings'>('earnings')

  useEffect(() => {
    fetch('/api/creator/earnings')
      .then((r) => r.json())
      .then(setEarningsData)
      .catch(() => {})
      .finally(() => setEarningsLoading(false))
  }, [])

  const handleSaveSettings = async (workId: string, settings: AdSettings) => {
    setSavingStates(prev => ({ ...prev, [workId]: true }))
    setErrors(prev => ({ ...prev, [workId]: '' }))

    try {
      const response = await fetch('/api/works/ad-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workId,
          settings,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save ad settings')
      }

      // Success is handled by the AuthorAdSettings component's internal state
    } catch (error) {
      console.error('Failed to save ad settings:', error)
      setErrors(prev => ({
        ...prev,
        [workId]: 'Failed to save settings. Please try again.'
      }))
      throw error // Re-throw so AuthorAdSettings can handle it
    } finally {
      setSavingStates(prev => ({ ...prev, [workId]: false }))
    }
  }

  const parseAdSettings = (adSettings: string | null): AdSettings => {
    if (!adSettings) return defaultSettings

    try {
      return JSON.parse(adSettings)
    } catch {
      return defaultSettings
    }
  }

  if (works.length === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
              <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Monetization
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Configure ad settings and revenue preferences for your works
              </p>
            </div>
          </div>
        </div>

        {/* Empty State */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
          <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-full inline-block mb-4">
            <Sparkles className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            No Published Works Yet
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
            Create and publish your first work to start earning revenue from ads.
            Only published works are eligible for monetization.
          </p>
          <a
            href="/creator/upload"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            Create Your First Work
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
            <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Monetization
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Earnings, payouts, and ad settings for your works
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg w-fit">
          <button
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'earnings'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
            onClick={() => setActiveTab('earnings')}
          >
            Earnings
          </button>
          <button
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'settings'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
            onClick={() => setActiveTab('settings')}
          >
            Ad Settings
          </button>
        </div>
      </div>

      {/* Earnings Tab */}
      {activeTab === 'earnings' && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              {
                label: 'Total Earned',
                value: `$${(earningsData?.earnings.totalRevenue ?? 0).toFixed(2)}`,
                icon: <TrendingUp className="w-5 h-5 text-green-500" />,
                sub: 'lifetime',
              },
              {
                label: 'Premium Revenue',
                value: `$${(earningsData?.earnings.premiumRevenue ?? 0).toFixed(2)}`,
                icon: <Sparkles className="w-5 h-5 text-purple-500" />,
                sub: 'from premium pool',
              },
              {
                label: 'Pending Payout',
                value: `$${(earningsData?.earnings.pendingPayout ?? 0).toFixed(2)}`,
                icon: <Clock className="w-5 h-5 text-yellow-500" />,
                sub: earningsData && earningsData.earnings.pendingPayout >= earningsData.minimumPayout
                  ? 'eligible for payout'
                  : `min. $${earningsData?.minimumPayout ?? 10}`,
              },
              {
                label: 'Ad Impressions',
                value: (earningsData?.earnings.totalImpressions ?? 0).toLocaleString(),
                icon: <DollarSign className="w-5 h-5 text-blue-500" />,
                sub: `${(earningsData?.earnings.totalClicks ?? 0).toLocaleString()} clicks`,
              },
            ].map((card) => (
              <div
                key={card.label}
                className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4"
              >
                <div className="flex items-center gap-2 mb-2">{card.icon}<span className="text-xs text-gray-500 dark:text-gray-400">{card.label}</span></div>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{earningsLoading ? '—' : card.value}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{card.sub}</p>
              </div>
            ))}
          </div>

          {/* Monthly Earnings */}
          {earningsData && earningsData.monthlyEarnings.length > 0 && (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Monthly Revenue</h3>
              <div className="flex items-end gap-2 h-24">
                {earningsData.monthlyEarnings.map(({ month, revenue }) => {
                  const max = Math.max(...earningsData.monthlyEarnings.map((e) => e.revenue), 0.01)
                  return (
                    <div key={month} className="flex flex-col items-center gap-1 flex-1">
                      <div
                        className="w-full bg-blue-500 rounded-sm min-h-[4px]"
                        style={{ height: `${Math.max(4, (revenue / max) * 80)}px` }}
                        title={`$${revenue.toFixed(2)}`}
                      />
                      <span className="text-[10px] text-gray-500 dark:text-gray-400">{month.slice(5)}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {earningsData?.earnings.totalRevenue === 0 && !earningsLoading && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <DollarSign className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  <p className="font-medium mb-1">Revenue Share: 70% to creators</p>
                  <p className="text-blue-700 dark:text-blue-300">
                    You earn 70% of ad revenue generated from your works. Payments are processed monthly
                    for accounts with $10+ earnings. Enable ads in the <button className="underline" onClick={() => setActiveTab('settings')}>Ad Settings tab</button> to start earning.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Payout History */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Payout History</h3>
            </div>
            {earningsLoading ? (
              <div className="p-8 text-center text-sm text-gray-500">Loading...</div>
            ) : !earningsData?.payouts.length ? (
              <div className="p-8 text-center text-sm text-gray-500 dark:text-gray-400">No payouts yet. Earn $10+ to request your first payout.</div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {earningsData.payouts.map((payout) => (
                  <div key={payout.id} className="flex items-center justify-between px-5 py-3">
                    <div className="flex items-center gap-3">
                      {payout.status === 'completed' ? (
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      ) : (
                        <Clock className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                      )}
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">${payout.amount.toFixed(2)}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(payout.createdAt).toLocaleDateString()} · {payout.method ?? 'Stripe'}
                        </p>
                      </div>
                    </div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${
                      payout.status === 'completed'
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                        : payout.status === 'failed'
                        ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                        : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                    }`}>
                      {payout.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Ad Settings Tab */}
      {activeTab === 'settings' && (
        <div className="space-y-8">
          {works.length === 0 && (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
              <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-full inline-block mb-4">
                <Sparkles className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">No Published Works Yet</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
                Publish your first work to configure ad settings and start earning revenue.
              </p>
              <a href="/creator/upload" className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">
                <Sparkles className="w-4 h-4" />Create Your First Work
              </a>
            </div>
          )}

          {works.map((work) => (
            <div key={work.id}>
              <div className="flex items-center gap-4 mb-4">
                <div className="relative w-16 h-20 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden flex-shrink-0">
                  {work.coverImage ? (
                    <Image src={resolveCoverSrc(work.id, work.coverImage) || ''} alt={work.title} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                      <span className="text-white text-xl font-bold">{work.title.charAt(0).toUpperCase()}</span>
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{work.title}</h2>
                  <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mt-1">
                    <span className="capitalize">{work.status}</span>
                    <span>•</span>
                    <span>{work._count.sections} chapters</span>
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                  work.status === 'published'
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    : work.status === 'draft'
                    ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                    : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                }`}>
                  {work.status === 'published' ? 'Earning Revenue' : 'No Revenue'}
                </div>
              </div>

              {errors[work.id] && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                  <span className="text-sm text-red-700 dark:text-red-300">{errors[work.id]}</span>
                </div>
              )}

              <AuthorAdSettings
                workId={work.id}
                initialSettings={parseAdSettings(work.adSettings)}
                onSave={(settings) => handleSaveSettings(work.id, settings)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}