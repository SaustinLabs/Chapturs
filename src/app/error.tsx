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
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 dark:bg-gray-900">
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-12 px-8 shadow sm:rounded-lg dark:bg-gray-800 text-center">
          <AlertOctagon className="mx-auto h-16 w-16 text-red-500 mb-4" />
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2">
            Something went wrong
          </h2>
          <p className="text-md text-gray-600 dark:text-gray-300 mb-6">
            An unexpected error occurred while loading this page. Our team has been notified.
          </p>
          <div className="flex flex-col space-y-4">
            <button
              onClick={() => reset()}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Try again
            </button>
            <Link
              href="/"
              className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
            >
              Return Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
