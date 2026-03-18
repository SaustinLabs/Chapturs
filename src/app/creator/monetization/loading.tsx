import AppLayout from '@/components/AppLayout'
import { DollarSign, Loader2 } from 'lucide-react'

export default function MonetizationLoading() {
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

        {/* Loading State */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
          <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-full inline-block mb-4">
            <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Loading Your Works
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Fetching monetization settings for your published works...
          </p>
        </div>
      </div>
    </AppLayout>
  )
}