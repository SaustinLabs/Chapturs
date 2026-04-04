'use client'

import { useState, useEffect, Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { StarIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { StarIcon as StarSolid } from '@heroicons/react/24/solid'

interface ExistingRating {
  overall: number
  writing: number | null
  plot: number | null
  characters: number | null
  worldBuilding: number | null
  pacing: number | null
  review: string | null
}

interface RateWorkModalProps {
  isOpen: boolean
  onClose: () => void
  workId: string
  workTitle: string
  onSuccess?: (average: number, total: number) => void
}

const DIMENSIONS: { key: keyof Omit<ExistingRating, 'overall' | 'review'>; label: string }[] = [
  { key: 'writing', label: 'Writing Quality' },
  { key: 'plot', label: 'Plot' },
  { key: 'characters', label: 'Characters' },
  { key: 'worldBuilding', label: 'World Building' },
  { key: 'pacing', label: 'Pacing' },
]

function StarRow({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState(0)
  return (
    <div className="flex items-center space-x-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(n)}
          aria-label={`${n} star${n !== 1 ? 's' : ''}`}
          className="focus:outline-none"
        >
          {n <= (hovered || value) ? (
            <StarSolid className="w-8 h-8 text-yellow-400" />
          ) : (
            <StarIcon className="w-8 h-8 text-gray-400" />
          )}
        </button>
      ))}
    </div>
  )
}

function DimRow({
  label,
  value,
  onChange,
}: {
  label: string
  value: number
  onChange: (v: number) => void
}) {
  const [hovered, setHovered] = useState(0)
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-400 w-36">{label}</span>
      <div className="flex items-center space-x-0.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onMouseEnter={() => setHovered(n)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => onChange(value === n ? 0 : n)}
            aria-label={`${label} ${n} star${n !== 1 ? 's' : ''}`}
            className="focus:outline-none"
          >
            {n <= (hovered || value) ? (
              <StarSolid className="w-5 h-5 text-yellow-400" />
            ) : (
              <StarIcon className="w-5 h-5 text-gray-500" />
            )}
          </button>
        ))}
      </div>
    </div>
  )
}

export default function RateWorkModal({ isOpen, onClose, workId, workTitle, onSuccess }: RateWorkModalProps) {
  const [overall, setOverall] = useState(0)
  const [dims, setDims] = useState<Record<string, number>>({
    writing: 0, plot: 0, characters: 0, worldBuilding: 0, pacing: 0,
  })
  const [review, setReview] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load existing rating when modal opens
  useEffect(() => {
    if (!isOpen) return
    fetch(`/api/works/${workId}/rate`)
      .then((r) => r.json())
      .then((data) => {
        const ur = data.data?.userRating
        if (ur) {
          setOverall(ur.overall ?? 0)
          setDims({
            writing: ur.writing ?? 0,
            plot: ur.plot ?? 0,
            characters: ur.characters ?? 0,
            worldBuilding: ur.worldBuilding ?? 0,
            pacing: ur.pacing ?? 0,
          })
          setReview(ur.review ?? '')
        }
      })
      .catch(() => {})
  }, [isOpen, workId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (overall < 1) { setError('Please select an overall rating'); return }
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch(`/api/works/${workId}/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          overall,
          writing: dims.writing || null,
          plot: dims.plot || null,
          characters: dims.characters || null,
          worldBuilding: dims.worldBuilding || null,
          pacing: dims.pacing || null,
          review: review.trim() || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message ?? 'Failed to submit rating')
      onSuccess?.(data.data?.average ?? 0, data.data?.total ?? 0)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  function handleClose() {
    if (submitting) return
    onClose()
  }

  const LABELS = ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent']

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto flex items-center justify-center p-4">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <Dialog.Panel className="w-full max-w-md bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
                <Dialog.Title className="text-base font-semibold text-white">
                  Rate this work
                </Dialog.Title>
                <button onClick={handleClose} className="text-gray-400 hover:text-white transition-colors">
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="px-6 py-5 space-y-6">
                {/* Work title */}
                <p className="text-sm text-gray-400 truncate">{workTitle}</p>

                {/* Overall stars */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">Overall Rating *</label>
                  <StarRow value={overall} onChange={setOverall} />
                  {overall > 0 && (
                    <p className="text-sm text-yellow-400 font-medium">{LABELS[overall]}</p>
                  )}
                </div>

                {/* Dimension ratings */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-300">
                    Dimension Ratings <span className="text-gray-500 font-normal">(optional)</span>
                  </label>
                  {DIMENSIONS.map(({ key, label }) => (
                    <DimRow
                      key={key}
                      label={label}
                      value={dims[key]}
                      onChange={(v) => setDims((prev) => ({ ...prev, [key]: v }))}
                    />
                  ))}
                </div>

                {/* Review text */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">
                    Review <span className="text-gray-500 font-normal">(optional)</span>
                  </label>
                  <textarea
                    value={review}
                    onChange={(e) => setReview(e.target.value)}
                    maxLength={2000}
                    rows={3}
                    placeholder="Share your thoughts..."
                    className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                  />
                  <p className="text-xs text-gray-500 text-right">{review.length}/2000</p>
                </div>

                {error && (
                  <p className="text-sm text-red-400">{error}</p>
                )}

                {/* Actions */}
                <div className="flex items-center justify-end space-x-3 pt-1">
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={submitting}
                    className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || overall < 1}
                    className="px-5 py-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    {submitting ? 'Submitting…' : 'Submit Rating'}
                  </button>
                </div>
              </form>
            </Dialog.Panel>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  )
}
