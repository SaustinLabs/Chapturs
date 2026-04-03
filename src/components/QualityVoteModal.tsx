'use client'

import { useState } from 'react'
import { StarIcon } from '@heroicons/react/24/solid'
import { StarIcon as StarOutline } from '@heroicons/react/24/outline'
import { useToast } from '@/components/ui/Toast'

interface QualityVoteModalProps {
  contentId: string
  contentType: 'translation' | 'audiobook'
  contentTitle: string
  onClose: () => void
  onSubmit: (vote: {
    readability: number
    comprehension: number
    polish: number
  }) => void
  existingVote?: {
    readability: number
    comprehension: number
    polish: number
  } | null
}

export default function QualityVoteModal({
  contentId,
  contentType,
  contentTitle,
  onClose,
  onSubmit,
  existingVote,
}: QualityVoteModalProps) {
  const [readability, setReadability] = useState(existingVote?.readability || 0)
  const [comprehension, setComprehension] = useState(
    existingVote?.comprehension || 0
  )
  const [polish, setPolish] = useState(existingVote?.polish || 0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async () => {
    if (readability === 0 || comprehension === 0 || polish === 0) {
      toast.warning('Please rate all three dimensions')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/fan-content/vote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          [contentType === 'translation'
            ? 'fanTranslationId'
            : 'fanAudiobookId']: contentId,
          readabilityRating: readability,
          comprehensionRating: comprehension,
          polishRating: polish,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        onSubmit({ readability, comprehension, polish })
        onClose()
      } else {
        toast.error('Failed to submit vote. Please try again.')
      }
    } catch (error) {
      console.error('Failed to submit vote:', error)
      toast.error('Failed to submit vote. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const overallScore =
    readability && comprehension && polish
      ? ((readability + comprehension + polish) / 3).toFixed(1)
      : '0.0'

  const getRatingDescription = (contentType: 'translation' | 'audiobook') => {
    if (contentType === 'translation') {
      return {
        readability: 'Grammar, sentence structure, natural flow',
        comprehension: 'Meaning preserved, tone conveyed',
        polish: 'Typos, consistency, prose quality',
      }
    } else {
      return {
        readability: 'Clarity, pacing, pronunciation',
        comprehension: 'Story understandable, character voices',
        polish: 'Audio quality, consistency, production value',
      }
    }
  }

  const descriptions = getRatingDescription(contentType)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="border-b border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                Rate Quality
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {contentTitle}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Overall Score Display */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 text-center">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              Overall Quality Score
            </div>
            <div className="text-4xl font-bold text-blue-600 dark:text-blue-400">
              {overallScore}/5
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Average of three dimensions
            </div>
          </div>

          {/* Readability */}
          <RatingDimension
            title="Readability"
            description={descriptions.readability}
            rating={readability}
            onRate={setReadability}
          />

          {/* Comprehension */}
          <RatingDimension
            title="Comprehension"
            description={descriptions.comprehension}
            rating={comprehension}
            onRate={setComprehension}
          />

          {/* Polish */}
          <RatingDimension
            title="Polish"
            description={descriptions.polish}
            rating={polish}
            onRate={setPolish}
          />

          {/* Info Box */}
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
              Why separate from story likes?
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Stories can be amazing but have terrible translations/narrations.
              Story &quot;Like&quot; = love the narrative. Quality Rating = rate the
              adaptation/performance quality.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-end space-x-3">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={
                isSubmitting ||
                readability === 0 ||
                comprehension === 0 ||
                polish === 0
              }
              className="px-6 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Rating'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function RatingDimension({
  title,
  description,
  rating,
  onRate,
}: {
  title: string
  description: string
  rating: number
  onRate: (rating: number) => void
}) {
  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
      <div className="mb-2">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {title}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {description}
        </p>
      </div>
      <div className="flex items-center space-x-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => onRate(star)}
            className="focus:outline-none transform hover:scale-110 transition-transform"
          >
            {star <= rating ? (
              <StarIcon className="w-8 h-8 text-yellow-400" />
            ) : (
              <StarOutline className="w-8 h-8 text-gray-300 dark:text-gray-600" />
            )}
          </button>
        ))}
        <span className="ml-2 text-lg font-medium text-gray-700 dark:text-gray-300">
          {rating > 0 ? `${rating}/5` : 'Not rated'}
        </span>
      </div>
    </div>
  )
}
