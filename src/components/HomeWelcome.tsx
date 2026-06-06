'use client'

import { useState, useEffect } from 'react'
import BetaWelcome from '@/components/BetaWelcome'
import TasteProfileSurvey from '@/components/onboarding/TasteProfileSurvey'
import { clearFeedSnapshot } from '@/lib/feedCache'

interface HomeWelcomeProps {
  userName: string
}

export default function HomeWelcome({ userName }: HomeWelcomeProps) {
  const [showSurvey, setShowSurvey] = useState(false)

  // Check if user needs onboarding
  useEffect(() => {
    fetch('/api/user/taste-profile')
      .then(r => r.json())
      .then(data => { if (data.needsOnboarding) setShowSurvey(true) })
      .catch(() => { /* non-critical */ })
  }, [])

  const handleSurveyComplete = () => {
    setShowSurvey(false)
    clearFeedSnapshot('reader')
  }

  if (showSurvey) {
    return <TasteProfileSurvey onComplete={handleSurveyComplete} />
  }

  return (
    <>
      <BetaWelcome isLoggedIn={true} />

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Welcome back, {userName}!
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Continue your reading journey or discover something new.
        </p>
      </div>
    </>
  )
}
