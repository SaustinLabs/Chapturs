import Link from 'next/link'
import { BookX } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 dark:bg-gray-900">
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-12 px-4 shadow sm:rounded-lg sm:px-10 dark:bg-gray-800 text-center">
          <BookX className="mx-auto h-16 w-16 text-gray-400 mb-4" />
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2">
            Page Not Found
          </h2>
          <p className="text-md text-gray-600 dark:text-gray-300 mb-6">
            Looks like this chapter is missing from the library. We couldn't find the page you were looking for.
          </p>
          <div className="flex flex-col space-y-4">
            <Link
              href="/"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Return Home
            </Link>
            <Link
              href="/browse"
              className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
            >
              Browse Stories
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
