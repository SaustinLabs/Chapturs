'use client'

import { useState, useEffect } from 'react'
import AppLayout from '@/components/AppLayout'
import InfiniteFeed from '@/components/InfiniteFeed'
import BetaWelcome from '@/components/BetaWelcome'
import ErrorBoundary from '@/components/ErrorBoundary'
import TasteProfileSurvey from '@/components/onboarding/TasteProfileSurvey'
import { useUser } from '@/hooks/useUser'
import { signIn } from 'next-auth/react'
import { clearFeedSnapshot } from '@/lib/feedCache'

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
    // Discard stale feed snapshot so the remounted feed fetches fresh personalised content
    clearFeedSnapshot('reader')
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
      {/* Mobile brand header — scrolls with page content, hidden on desktop */}
      <div className="md:hidden flex items-center mb-5 pt-1">
        <span className="bg-white rounded-2xl px-3 py-1.5 flex items-center gap-2 shadow-sm">
          <img src="/logo-transparent.png" alt="Chapturs" className="w-7 h-7" />
          <span className="text-base font-bold text-blue-600 tracking-wide">Chapturs</span>
        </span>
      </div>

      {/* Taste profile onboarding — shown once to users with no preferences set */}
      {showSurvey && <TasteProfileSurvey onComplete={handleSurveyComplete} />}

      {/* Beta Welcome sidebar for logged-in users */}
      {isAuthenticated && <BetaWelcome isLoggedIn={true} />}

      {/* Hero banner for unauthenticated visitors */}
      {!isAuthenticated && (
        <div className="mb-8 rounded-2xl bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 px-6 py-8 sm:px-10 text-white">
          <h1 className="text-3xl sm:text-4xl font-extrabold mb-2 leading-tight">
            Stories worth reading.<br />
            <span className="text-blue-300">Creators worth supporting.</span>
          </h1>
          <p className="text-blue-100 mb-6 max-w-xl text-lg">
            Chapturs is the free webnovel platform where 70% of ad revenue goes directly to the authors you love.
          </p>
          <div className="flex flex-wrap gap-4 mb-6 text-sm">
            <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2">
              <span className="text-green-400">✓</span>
              <span>Free to read, always</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2">
              <span className="text-green-400">✓</span>
              <span>70% ad revenue to creators</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2">
              <span className="text-green-400">✓</span>
              <span>You own your work, always</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => signIn('google')}
              className="px-5 py-2.5 bg-white text-indigo-900 font-semibold rounded-lg hover:bg-blue-50 transition-colors"
            >
              Sign in with Google
            </button>
            <a
              href="/about"
              className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white font-medium rounded-lg transition-colors"
            >
              Learn more
            </a>
          </div>
        </div>
      )}

      {/* Authenticated header */}
      {isAuthenticated && (
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome back, {userName}!
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Continue your reading journey or discover something new.
          </p>
        </div>
      )}

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
