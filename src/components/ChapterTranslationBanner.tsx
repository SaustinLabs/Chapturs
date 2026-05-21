'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Globe, Send } from 'lucide-react'

interface ChapterTranslationBannerProps {
  targetLanguage: string
  detectedLanguage: string
  translationId: string | null
  translationRating: number | null
  onRevertToOriginal: () => void
  onSuggestionSubmit: (text: string) => Promise<void>
}

export default function ChapterTranslationBanner({
  targetLanguage,
  detectedLanguage,
  translationId,
  translationRating,
  onRevertToOriginal,
  onSuggestionSubmit,
}: ChapterTranslationBannerProps) {
  const { data: session } = useSession()
  const [showSuggestForm, setShowSuggestForm] = useState(false)
  const [suggestText, setSuggestText] = useState('')
  const [suggestError, setSuggestError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (targetLanguage === 'en') return null

  const languageName = (() => {
    try {
      return new Intl.DisplayNames(['en'], { type: 'language' }).of(targetLanguage) ?? targetLanguage.toUpperCase()
    } catch {
      return targetLanguage.toUpperCase()
    }
  })()

  const handleSubmit = async () => {
    if (!session?.user?.id) {
      setSuggestError('Please sign in to suggest translations.')
      return
    }
    if (!suggestText.trim()) {
      setSuggestError('Please enter a suggestion.')
      return
    }
    setSubmitting(true)
    setSuggestError('')
    try {
      await onSuggestionSubmit(suggestText.trim())
      setSuggestText('')
      setShowSuggestForm(false)
    } catch {
      setSuggestError('Failed to submit suggestion.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mt-4 space-y-2">
      {/* Info + show original */}
      <div className="flex items-center justify-center gap-3 text-xs text-gray-500 dark:text-gray-400">
        <span>
          🌐 Translated from{' '}
          <span className="font-medium text-gray-700 dark:text-gray-300">English</span>
          {' '}to{' '}
          <span className="font-medium text-gray-700 dark:text-gray-300">{languageName}</span>
        </span>
        <button
          onClick={onRevertToOriginal}
          className="underline underline-offset-2 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          Show original
        </button>
      </div>

      {/* Rating + suggestion row */}
      {translationId && (
        <div className="flex items-center justify-center gap-3">
          {/* Star rating */}
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={async () => {
                  if (!session?.user?.id) return
                  try {
                    await fetch(`/api/fan-translations/${translationId}/rate`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ rating: star }),
                    })
                  } catch { /* ignore */ }
                }}
                className={`text-sm ${
                  translationRating && star <= translationRating
                    ? 'text-yellow-500'
                    : 'text-gray-300 dark:text-gray-600'
                } hover:text-yellow-400 transition-colors`}
              >
                ★
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowSuggestForm(!showSuggestForm)}
            className="text-xs text-blue-500 hover:text-blue-600 underline underline-offset-2"
          >
            <Send className="w-3 h-3 inline mr-1" />
            Suggest improvement
          </button>
        </div>
      )}

      {/* Suggestion form */}
      {showSuggestForm && (
        <div className="max-w-md mx-auto">
          <textarea
            value={suggestText}
            onChange={(e) => setSuggestText(e.target.value)}
            placeholder="Suggest a better translation..."
            rows={3}
            className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
          {suggestError && (
            <p className="text-xs text-red-500 mt-1">{suggestError}</p>
          )}
          <div className="flex justify-end gap-2 mt-2">
            <button
              onClick={() => setShowSuggestForm(false)}
              className="px-3 py-1 text-xs text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {submitting ? 'Sending...' : 'Submit'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
