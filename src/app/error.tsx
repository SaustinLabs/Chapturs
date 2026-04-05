'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertOctagon } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Unhandled platform error:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center px-4">
      <div className="max-w-md w-full bg-gray-900 rounded-2xl border border-gray-800 p-8 text-center shadow-2xl">
        <AlertOctagon className="mx-auto h-14 w-14 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold text-white mb-2">
          Something went wrong
        </h2>
        <p className="text-sm text-gray-400 mb-6">
          An unexpected error occurred. This is usually temporary — try reloading the page.
        </p>
        {error?.digest && (
          <p className="text-xs text-gray-600 mb-6 font-mono">ref: {error.digest}</p>
        )}
        <div className="flex flex-col gap-3">
          <button
            onClick={() => reset()}
            className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
          >
            Try again
          </button>
          <Link
            href="/"
            className="w-full py-2.5 px-4 rounded-xl border border-gray-700 text-gray-300 hover:bg-gray-800 text-sm font-medium transition-colors block"
          >
            Return Home
          </Link>
        </div>
      </div>
    </div>
  )
}
