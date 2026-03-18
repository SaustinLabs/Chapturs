'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Heart, Play, SkipForward, X, Volume2, VolumeX } from 'lucide-react'

interface SupportAuthorInterstitialProps {
  authorName: string
  workTitle: string
  chapterTitle: string
  nextChapterUrl: string
  adDuration?: number // seconds, default 15
  onAdComplete?: () => void
  onSkip?: () => void
}

export default function SupportAuthorInterstitial({
  authorName,
  workTitle,
  chapterTitle,
  nextChapterUrl,
  adDuration = 15,
  onAdComplete,
  onSkip,
}: SupportAuthorInterstitialProps) {
  const [phase, setPhase] = useState<'choice' | 'playing' | 'complete'>('choice')
  const [timeRemaining, setTimeRemaining] = useState(adDuration)
  const [muted, setMuted] = useState(false)

  // Countdown timer during ad
  useEffect(() => {
    if (phase !== 'playing' || timeRemaining <= 0) return

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          setPhase('complete')
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [phase, timeRemaining])

  const handleWatchAd = useCallback(() => {
    setPhase('playing')
    // Track the impression
    fetch('/api/ads/impression', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'video-support',
        authorId: authorName,
        workTitle,
      }),
    }).catch(console.error)
  }, [authorName, workTitle])

  const handleSkipToChapter = useCallback(() => {
    onSkip?.()
    window.location.href = nextChapterUrl
  }, [nextChapterUrl, onSkip])

  const handleAdComplete = useCallback(() => {
    onAdComplete?.()
    window.location.href = nextChapterUrl
  }, [nextChapterUrl, onAdComplete])

  // Phase 1: Reader chooses
  if (phase === 'choice') {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8">
        <div className="max-w-md text-center space-y-6">
          <div className="text-6xl">📖</div>
          
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Support {authorName}?
          </h2>
          
          <p className="text-gray-600 dark:text-gray-400">
            Watch a short {adDuration}-second ad to support the author of{' '}
            <span className="font-semibold">{workTitle}</span>. Your support helps them keep writing!
          </p>

          <div className="flex flex-col gap-3 pt-4">
            <button
              onClick={handleWatchAd}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg hover:shadow-xl"
            >
              <Heart className="w-5 h-5" />
              Watch Ad & Support Author
            </button>
            
            <button
              onClick={handleSkipToChapter}
              className="flex items-center justify-center gap-2 px-6 py-3 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
            >
              <SkipForward className="w-4 h-4" />
              Skip to {chapterTitle}
            </button>
          </div>
          
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Ads help keep Chapturs free for readers everywhere
          </p>
        </div>
      </div>
    )
  }

  // Phase 2: Ad playing
  if (phase === 'playing') {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8">
        <div className="max-w-lg w-full space-y-6">
          {/* Ad placeholder - replace with actual video ad */}
          <div className="relative aspect-video bg-gray-900 rounded-xl overflow-hidden flex items-center justify-center">
            <div className="text-white text-center">
              <Play className="w-16 h-16 mx-auto mb-2 opacity-50" />
              <p className="text-sm opacity-70">Ad playing...</p>
            </div>
            
            {/* Timer overlay */}
            <div className="absolute top-3 right-3 bg-black/60 px-3 py-1 rounded-full text-white text-sm">
              {timeRemaining}s
            </div>
            
            {/* Mute toggle */}
            <button
              onClick={() => setMuted(!muted)}
              className="absolute bottom-3 right-3 p-2 bg-black/60 rounded-full text-white hover:bg-black/80"
            >
              {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-purple-600 to-pink-600 h-2 rounded-full transition-all duration-1000"
              style={{ width: `${((adDuration - timeRemaining) / adDuration) * 100}%` }}
            />
          </div>

          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            Thank you for supporting {authorName}! ❤️
          </p>
        </div>
      </div>
    )
  }

  // Phase 3: Complete
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-8">
      <div className="max-w-md text-center space-y-6">
        <div className="text-6xl">🎉</div>
        
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Thanks for supporting!
        </h2>
        
        <p className="text-gray-600 dark:text-gray-400">
          You just helped {authorName} earn a bit more from their writing.
        </p>

        <button
          onClick={handleAdComplete}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg mx-auto"
        >
          Continue to {chapterTitle}
          <SkipForward className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
