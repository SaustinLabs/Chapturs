'use client'

import { useState } from 'react'
import { StarIcon } from '@heroicons/react/24/outline'
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid'

interface WorkRatingSystemProps {
  workId: string
  initialRating?: number
  onRatingSubmitted?: (avg: number, total: number) => void
}

export default function WorkRatingSystem({ workId, initialRating = 0, onRatingSubmitted }: WorkRatingSystemProps) {
  const [rating, setRating] = useState(initialRating)
  const [hover, setHover] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [comment, setComment] = useState('')
  const [showForm, setShowForm] = useState(false)

  const submitRating = async (value: number) => {
    setSubmitting(true)
    try {
      const res = await fetch(`/api/works/${workId}/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: value, comment })
      })
      if (res.ok) {
        const data = await res.json()
        setRating(value)
        setShowForm(false)
        if (onRatingSubmitted) onRatingSubmitted(data.data.average, data.data.total)
      }
    } catch (e) {
      console.error('Rating failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 p-8 shadow-xl">
      <div className="text-center mb-6">
        <h3 className="text-xl font-black text-gray-900 dark:text-white mb-1">Enjoying this story?</h3>
        <p className="text-sm text-gray-500 underline decoration-blue-500/30">Leave a rating to support the author</p>
      </div>

      <div className="flex justify-center items-center space-x-2 mb-4">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            disabled={submitting}
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
            onClick={() => {
              setHover(0)
              setShowForm(true)
              setRating(star)
            }}
            className="p-1 transition-transform hover:scale-125 active:scale-90"
          >
            {star <= (hover || rating) ? (
              <StarIconSolid className="w-10 h-10 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.4)]" />
            ) : (
              <StarIcon className="w-10 h-10 text-gray-300 dark:text-gray-600" />
            )}
          </button>
        ))}
      </div>

      {showForm && (
        <div className="animate-in fade-in slide-in-from-top-4 duration-300">
          <textarea
            placeholder="Add a comment (optional)..."
            className="w-full p-4 bg-gray-50 dark:bg-gray-900 border-none rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 mb-4 dark:text-white"
            value={comment}
            onChange={e => setComment(e.target.value)}
          />
          <div className="flex justify-center">
            <button
              onClick={() => submitRating(rating)}
              disabled={submitting}
              className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-8 py-2 rounded-xl font-bold text-sm hover:scale-105 transition"
            >
              Post Review
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
