'use client'

import { useState } from 'react'
import { DollarSign, Sparkles, AlertCircle } from 'lucide-react'
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

        {/* Revenue Info */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mt-4">
          <div className="flex items-start gap-3">
            <DollarSign className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <p className="font-medium mb-1">Revenue Share: 70% to creators</p>
              <p className="text-blue-700 dark:text-blue-300">
                You earn 70% of ad revenue generated from your works. Payments are processed monthly
                for accounts with $10+ earnings. Track your revenue in the Analytics dashboard.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Works List */}
      <div className="space-y-8">
        {works.map((work) => (
          <div key={work.id}>
            {/* Work Header */}
            <div className="flex items-center gap-4 mb-4">
              <div className="relative w-16 h-20 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden flex-shrink-0">
                {work.coverImage ? (
                  <Image
                    src={resolveCoverSrc(work.id, work.coverImage) || ''}
                    alt={work.title}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <span className="text-white text-xl font-bold">
                      {work.title.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex-1">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  {work.title}
                </h2>
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

            {/* Error Display */}
            {errors[work.id] && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                <span className="text-sm text-red-700 dark:text-red-300">
                  {errors[work.id]}
                </span>
              </div>
            )}

            {/* Ad Settings */}
            <AuthorAdSettings
              workId={work.id}
              initialSettings={parseAdSettings(work.adSettings)}
              onSave={(settings) => handleSaveSettings(work.id, settings)}
            />
          </div>
        ))}
      </div>

      {/* Footer Info */}
      <div className="mt-12 p-6 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
          About Monetization
        </h3>
        <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
          <p>
            <strong>Sidebar Ads:</strong> Always displayed on chapter pages (platform requirement).
            These provide consistent revenue for all creators.
          </p>
          <p>
            <strong>Inline Ads:</strong> Optional ads between paragraphs/scenes based on chapter length.
            Higher density can increase revenue but may impact reader experience.
          </p>
          <p>
            <strong>Support Author Ads:</strong> Video ads readers can voluntarily watch between chapters
            to directly support you with higher payouts.
          </p>
          <p>
            <strong>Revenue Tracking:</strong> View detailed earnings, impressions, and performance
            metrics in your Analytics dashboard.
          </p>
        </div>
      </div>
    </div>
  )
}