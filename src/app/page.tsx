'use client'

import { useState, useEffect } from 'react'
import AppLayout from '@/components/AppLayout'
import InfiniteFeed from '@/components/InfiniteFeed'
import BetaWelcome from '@/components/BetaWelcome'
import ErrorBoundary from '@/components/ErrorBoundary'
import TasteProfileSurvey from '@/components/onboarding/TasteProfileSurvey'
import { useUser } from '@/hooks/useUser'
import { signIn } from 'next-auth/react'

function ReaderHomePage() {
  const { isAuthenticated, userName, isLoading } = useUser()
  const [showSurvey, setShowSurvey] = useState(false)
  const [feedKey, setFeedKey] = useState(0)

  // Check if logged-in user needs onboarding once auth settles
  useEffect(() => {
    if (!isAuthenticated || isLoading) return
    fetch('/api/user/taste-profile')
      .then(r => r.json())
      .then(data => { if (data.needsOnboarding) setShowSurvey(true) })
      .catch(() => { /* non-critical */ })
  }, [isAuthenticated, isLoading])

  const handleSurveyComplete = () => {
    setShowSurvey(false)
    // Reload feed so it uses the freshly stored preferences
    setFeedKey(k => k + 1)
  }

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-8"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-40 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Taste profile onboarding — shown once to users with no preferences set */}
      {showSurvey && <TasteProfileSurvey onComplete={handleSurveyComplete} />}

      {/* Beta Welcome sidebar for logged-in users */}
      {isAuthenticated && <BetaWelcome isLoggedIn={true} />}

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {isAuthenticated ? `Welcome back, ${userName}!` : 'Discover Stories'}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          {isAuthenticated
            ? 'Continue your reading journey or discover something new.'
            : 'Explore webnovels, poetry, and articles from independent creators.'}
        </p>
      </div>

      {/* Infinite Feed - visible to everyone */}
      <ErrorBoundary name="Feed">
        <InfiniteFeed key={feedKey} hubMode="reader" />
      </ErrorBoundary>
    </div>
  )
}

export default function Home() {
  return (
    <AppLayout>
      <ReaderHomePage />
    </AppLayout>
  )
}
