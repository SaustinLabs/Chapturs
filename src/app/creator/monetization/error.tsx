'use client'

import { useEffect } from 'react'
import AppLayout from '@/components/AppLayout'
import { DollarSign, AlertTriangle, RefreshCw } from 'lucide-react'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function MonetizationError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('Monetization page error:', error)
  }, [error])

  return (
    <AppLayout>
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

        {/* Error State */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-red-200 dark:border-red-800 p-12 text-center">
          <div className="p-4 bg-red-100 dark:bg-red-900/30 rounded-full inline-block mb-4">
            <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Failed to Load Monetization Settings
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
            We encountered an error while loading your works and monetization settings.
            This might be a temporary issue.
          </p>
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={reset}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
            <a
              href="/creator/dashboard"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors"
            >
              Back to Dashboard
            </a>
          </div>
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-6 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg text-left">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                Error Details (development):
              </p>
              <pre className="text-xs text-gray-600 dark:text-gray-400 overflow-auto">
                {error.message}
              </pre>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}