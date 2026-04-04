'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@/hooks/useUser'
import { signIn } from 'next-auth/react'
import { BookmarkIcon, UserIcon, HeartIcon } from '@heroicons/react/24/outline'
import { BookmarkIcon as BookmarkSolidIcon } from '@heroicons/react/24/solid'
import DataService from '@/lib/api/DataService'

interface LibraryItem {
  id: string
  type: 'subscription' | 'bookmark'
  title: string
  author: string
  authorId?: string
  workId?: string
  description?: string
  lastUpdated: string
  coverImage?: string
  genres: string[]
  status: string
}

export default function LibraryPage() {
  const { userId, isAuthenticated, isLoading } = useUser()
  const [libraryItems, setLibraryItems] = useState<LibraryItem[]>([])
  const [activeTab, setActiveTab] = useState<'all' | 'subscriptions' | 'bookmarks'>('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      // Show sign-in prompt for unauthenticated users
      return
    }

    if (userId) {
      loadLibraryData()
    }
  }, [userId, isAuthenticated, isLoading])

  const loadLibraryData = async () => {
    try {
      setLoading(true)
      const libraryData = await DataService.getUserLibrary(userId!)
      setLibraryItems(libraryData)
    } catch (error) {
      console.error('Failed to load library data:', error)
      setLibraryItems([]) // Set empty array on error
    } finally {
      setLoading(false)
    }
  }

  const removeSubscription = async (authorId: string) => {
    if (!userId) return
    try {
      await DataService.toggleSubscription(authorId, userId)
      setLibraryItems(items => items.filter(item => !(item.type === 'subscription' && item.authorId === authorId)))
    } catch (error) {
      console.error('Failed to remove subscription:', error)
    }
  }

  const removeBookmark = async (workId: string) => {
    if (!userId) return
    try {
      await DataService.toggleBookmark(workId, userId)
      setLibraryItems(items => items.filter(item => !(item.type === 'bookmark' && item.workId === workId)))
    } catch (error) {
      console.error('Failed to remove bookmark:', error)
    }
  }

  const filteredItems = libraryItems.filter(item => {
    if (activeTab === 'all') return true
    if (activeTab === 'subscriptions') return item.type === 'subscription'
    if (activeTab === 'bookmarks') return item.type === 'bookmark'
    return true
  })

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading your library...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <BookmarkIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Your Library
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Sign in to view your subscriptions and bookmarks, and keep track of your favorite stories.
          </p>
          <button
            onClick={() => signIn('google')}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            Sign In to Access Library
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Your Library
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your subscriptions and bookmarks
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('all')}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === 'all'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                All ({libraryItems.length})
              </button>
              <button
                onClick={() => setActiveTab('subscriptions')}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors inline-flex items-center ${
                  activeTab === 'subscriptions'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <UserIcon className="w-4 h-4 mr-1" />
                Subscriptions ({libraryItems.filter(item => item.type === 'subscription').length})
              </button>
              <button
                onClick={() => setActiveTab('bookmarks')}
                className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors inline-flex items-center ${
                  activeTab === 'bookmarks'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <BookmarkSolidIcon className="w-4 h-4 mr-1" />
                Bookmarks ({libraryItems.filter(item => item.type === 'bookmark').length})
              </button>
            </nav>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600 dark:text-gray-400">Loading...</span>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              {activeTab === 'subscriptions' ? (
                <UserIcon className="w-8 h-8 text-gray-400" />
              ) : activeTab === 'bookmarks' ? (
                <BookmarkIcon className="w-8 h-8 text-gray-400" />
              ) : (
                <HeartIcon className="w-8 h-8 text-gray-400" />
              )}
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No {activeTab === 'all' ? 'library items' : activeTab} yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {activeTab === 'subscriptions' 
                ? 'Subscribe to authors to get notified of new content'
                : activeTab === 'bookmarks'
                ? 'Bookmark stories to save them for later'
                : 'Start building your library by subscribing to authors and bookmarking stories'
              }
            </p>
            <a
              href="/"
              className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            >
              Explore Stories
            </a>
          </div>
        ) : (
          <div className="grid gap-6">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      {item.type === 'subscription' ? (
                        <UserIcon className="w-5 h-5 text-blue-600 mr-2" />
                      ) : (
                        <BookmarkSolidIcon className="w-5 h-5 text-yellow-600 mr-2" />
                      )}
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400 capitalize">
                        {item.type}
                      </span>
                    </div>
                    
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
                      {item.title}
                    </h3>
                    
                    <p className="text-gray-600 dark:text-gray-400 mb-1">
                      by {item.author}
                    </p>
                    
                    {item.description && (
                      <p className="text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                        {item.description}
                      </p>
                    )}
                    
                    <div className="flex flex-wrap gap-2 mb-3">
                      {Array.isArray(item.genres) && item.genres.slice(0, 3).map((genre) => (
                        <span
                          key={genre}
                          className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded"
                        >
                          {genre}
                        </span>
                      ))}
                      <span
                        className={`px-2 py-1 text-xs rounded ${
                          item.status === 'ongoing'
                            ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                        }`}
                      >
                        {item.status === 'ongoing' ? 'Ongoing' : 'Complete'}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Last updated: {new Date(item.lastUpdated).toLocaleDateString()}
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <a
                      href={item.type === 'subscription' ? `/profile/${item.authorId}` : `/story/${item.workId}`}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
                    >
                      View
                    </a>
                    <button
                      onClick={() => {
                        if (item.type === 'subscription' && item.authorId) {
                          removeSubscription(item.authorId)
                        } else if (item.type === 'bookmark' && item.workId) {
                          removeBookmark(item.workId)
                        }
                      }}
                      className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
