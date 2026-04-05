'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Global render error:', error)
  }, [error])

  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-gray-950 flex flex-col items-center justify-center px-4">
        <div className="max-w-md w-full bg-gray-900 rounded-2xl border border-gray-800 p-8 text-center shadow-2xl">
          <div className="text-5xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-white mb-2">Something went wrong</h1>
          <p className="text-gray-400 text-sm mb-6">
            An unexpected error occurred. This is usually temporary — try reloading.
          </p>
          {error?.digest && (
            <p className="text-xs text-gray-600 mb-6 font-mono">ref: {error.digest}</p>
          )}
          <div className="flex flex-col gap-3">
            <button
              onClick={reset}
              className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
            >
              Try again
            </button>
            <a
              href="/"
              className="w-full py-2.5 px-4 rounded-xl border border-gray-700 text-gray-300 hover:bg-gray-800 text-sm font-medium transition-colors block text-center"
            >
              Return Home
            </a>
          </div>
        </div>
      </body>
    </html>
  )
}
