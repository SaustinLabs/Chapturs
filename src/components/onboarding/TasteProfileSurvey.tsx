'use client'

import { useState, useEffect } from 'react'
import { CheckIcon } from '@heroicons/react/24/solid'
import { ArrowRightIcon, ArrowLeftIcon, SparklesIcon } from '@heroicons/react/24/outline'
import type { SampleWork } from '@/app/api/user/taste-profile/samples/route'

// === FORMAT ICONS & GENRE GRADIENTS ===

const FORMAT_ICONS: Record<string, string> = {
  novel:        '📖',
  article:      '📄',
  comic:        '🎨',
  hybrid:       '✨',
  collection:   '📚',
  poetry:       '🪶',
  experimental: '🧪',
}

const GENRE_GRADIENTS: Record<string, string> = {
  'Fantasy':           'from-indigo-700 to-purple-800',
  'Science Fiction':   'from-blue-700 to-cyan-800',
  'Romance':           'from-pink-600 to-rose-700',
  'Mystery':           'from-slate-700 to-gray-900',
  'Thriller':          'from-red-800 to-rose-900',
  'Horror':            'from-gray-900 to-black',
  'Poetry':            'from-violet-700 to-fuchsia-800',
  'Drama':             'from-amber-700 to-orange-800',
  'Historical Fiction':'from-yellow-800 to-amber-900',
  'Non-Fiction':       'from-teal-700 to-emerald-800',
  'Science':           'from-teal-700 to-cyan-800',
  'News':              'from-slate-600 to-gray-700',
  'Comedy':            'from-yellow-500 to-orange-600',
  'Action':            'from-red-600 to-orange-700',
  'Adventure':         'from-lime-700 to-green-800',
  'dark-fantasy':      'from-gray-800 to-purple-900',
  'grimdark':          'from-red-900 to-gray-900',
  'literary-fiction':  'from-stone-600 to-stone-800',
  'poetry':            'from-violet-700 to-fuchsia-800',
}

const DEFAULT_GRADIENT = 'from-gray-600 to-gray-800'

function getGenreGradient(genre?: string): string {
  if (!genre) return DEFAULT_GRADIENT
  return GENRE_GRADIENTS[genre] ?? DEFAULT_GRADIENT
}

// === PACE + DISCOVERY STEPS (unchanged) ===

const PACE_OPTIONS = [
  {
    key: 'deep',
    label: 'Deep Dives',
    description: 'I lose myself in long stories for hours  Eor days',
    icon: '🐋',
  },
  {
    key: 'varied',
    label: 'It Depends on My Mood',
    description: 'Long sagas or quick reads — whatever I feel like',
    icon: '🦋',
  },
  {
    key: 'snack',
    label: 'Quick Hits',
    description: 'Short, punchy pieces I can finish in one sitting',
    icon: '⚡',
  },
] as const

type PaceKey = typeof PACE_OPTIONS[number]['key']

const DISCOVERY_OPTIONS = [
  {
    key: 'familiar',
    label: 'Stay in My Lane',
    description: 'Give me more of what I already know I love',
    icon: '🏡',
  },
  {
    key: 'mixed',
    label: 'Mostly Familiar, Some Surprises',
    description: 'Keep it comfortable with the occasional curveball',
    icon: '🎲',
  },
  {
    key: 'adventurous',
    label: 'Take Me Somewhere New',
    description: "Show me things I'd never have thought to pick myself",
    icon: '🧭',
  },
] as const

type DiscoveryKey = typeof DISCOVERY_OPTIONS[number]['key']

interface SurveySelections {
  selectedWorkIds: string[]
  pace: PaceKey | null
  discovery: DiscoveryKey | null
}

interface TasteProfileSurveyProps {
  onComplete: () => void
}

// === CONTENT CARD COMPONENT ===

function ContentCard({
  work,
  selected,
  onToggle,
}: {
  work: SampleWork
  selected: boolean
  onToggle: () => void
}) {
  const [imgError, setImgError] = useState(false)
  const showGradient = !work.coverImage || imgError

  return (
    <button
      onClick={onToggle}
      className={`rounded-xl overflow-hidden text-left w-full transition-all duration-150 focus:outline-none ${
        selected
          ? 'ring-2 ring-blue-500 shadow-lg shadow-blue-200 dark:shadow-blue-900/50'
          : 'hover:ring-1 hover:ring-gray-300 dark:hover:ring-gray-600'
      }`}
    >
      {/* Cover image area */}
      <div className="relative h-36 sm:h-40 w-full">
        {showGradient ? (
          <div className={`w-full h-full bg-gradient-to-br ${getGenreGradient(work.genres[0])}`} />
        ) : (
          <img
            src={work.coverImage!}
            alt={work.title}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={() => setImgError(true)}
          />
        )}

        {/* Genre badge */}
        {work.genres[0] && (
          <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 bg-black/55 text-white text-[10px] rounded-full backdrop-blur-sm leading-none">
            {work.genres[0]}
          </span>
        )}

        {/* Format icon */}
        <span className="absolute top-1.5 right-1.5 text-sm leading-none" aria-label={work.formatType}>
          {FORMAT_ICONS[work.formatType] ?? '📄'}
        </span>

        {/* Selection overlay */}
        {selected && (
          <div className="absolute inset-0 bg-blue-500/25 flex items-center justify-center">
            <div className="w-9 h-9 bg-blue-500 rounded-full flex items-center justify-center shadow-lg">
              <CheckIcon className="w-5 h-5 text-white" />
            </div>
          </div>
        )}
      </div>

      {/* Text section */}
      <div className="p-2 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700">
        <p className="text-xs font-semibold text-gray-900 dark:text-white line-clamp-2 leading-tight mb-0.5">
          {work.title}
        </p>
        <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
          {work.authorName}
        </p>
      </div>
    </button>
  )
}

// === SKELETON CARD ===

function SkeletonCard() {
  return (
    <div className="rounded-xl overflow-hidden animate-pulse">
      <div className="h-36 sm:h-40 bg-gray-200 dark:bg-gray-700" />
      <div className="p-2 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 space-y-1.5">
        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-4/5" />
        <div className="h-2.5 bg-gray-100 dark:bg-gray-600 rounded w-2/5" />
      </div>
    </div>
  )
}

// === SINGLE-OPTION SELECTOR (Pace + Discovery steps) ===

function OptionSelector<T extends string>({
  options,
  value,
  onChange,
}: {
  options: readonly { key: T; label: string; description: string; icon: string }[]
  value: T | null
  onChange: (key: T) => void
}) {
  return (
    <div className="flex flex-col gap-3">
      {options.map(option => {
        const selected = value === option.key
        return (
          <button
            key={option.key}
            onClick={() => onChange(option.key)}
            className={`rounded-xl border-2 p-5 text-left transition-all duration-150 ${
              selected
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/40 shadow-md'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800'
            }`}
          >
            <div className="flex items-center gap-4">
              <span className="text-3xl">{option.icon}</span>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className={`font-semibold text-gray-900 dark:text-white ${selected ? 'text-blue-700 dark:text-blue-300' : ''}`}>
                    {option.label}
                  </span>
                  {selected && (
                    <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <CheckIcon className="w-3 h-3 text-white" />
                    </div>
                  )}
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  {option.description}
                </p>
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}

// === MAIN SURVEY ===

export default function TasteProfileSurvey({ onComplete }: TasteProfileSurveyProps) {
  const [step, setStep] = useState(0)
  const [selections, setSelections] = useState<SurveySelections>({
    selectedWorkIds: [],
    pace: null,
    discovery: null,
  })
  const [samples, setSamples] = useState<SampleWork[]>([])
  const [samplesLoading, setSamplesLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Prefetch samples as soon as the component mounts so step 1 is instant
  useEffect(() => {
    setSamplesLoading(true)
    fetch('/api/user/taste-profile/samples')
      .then(r => r.json())
      .then(data => setSamples(data.works ?? []))
      .catch(() => {/* non-critical */})
      .finally(() => setSamplesLoading(false))
  }, [])

  const toggleWork = (id: string) => {
    setSelections(prev => ({
      ...prev,
      selectedWorkIds: prev.selectedWorkIds.includes(id)
        ? prev.selectedWorkIds.filter(w => w !== id)
        : [...prev.selectedWorkIds, id],
    }))
  }

  const canProceed = () => {
    if (step === 2) return selections.pace !== null
    if (step === 3) return selections.discovery !== null
    return true // step 1 has no minimum
  }

  const handleSkip = async () => {
    try {
      await fetch('/api/user/taste-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selectedWorkIds: [], skipped: true }),
      })
    } catch { /* best-effort */ }
    onComplete()
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/user/taste-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(selections),
      })
      if (!res.ok) throw new Error('Save failed')
      setStep(4)
    } catch {
      setError("Couldn't save preferences  Eyour feed will still work. Try again later.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Derive selected genres for the success screen
  const selectedGenres = Array.from(
    new Set(
      samples
        .filter(w => selections.selectedWorkIds.includes(w.id))
        .flatMap(w => w.genres)
    )
  ).slice(0, 8)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden">

        {/* Progress bar */}
        {step > 0 && step < 4 && (
          <div className="h-1 bg-gray-100 dark:bg-gray-800 rounded-t-2xl overflow-hidden flex-shrink-0">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-violet-500 transition-all duration-500"
              style={{ width: `${((step - 1) / 3) * 100 + 33}%` }}
            />
          </div>
        )}

        {/* ── Step 0: Intro ── */}
        {step === 0 && (
          <div className="flex flex-col items-center justify-center p-10 text-center gap-5 flex-1">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shadow-lg">
              <SparklesIcon className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Tell us what you like
              </h2>
              <p className="text-gray-500 dark:text-gray-400 max-w-md text-sm leading-relaxed">
                Three quick questions and your feed will be tuned to exactly what you love  Efiction, poetry, science, news, whatever it is.
              </p>
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500">Takes about 30 seconds</p>
            <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm mt-2">
              <button
                onClick={() => setStep(1)}
                className="flex-1 py-3 px-6 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white font-semibold rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
              >
                Get Started <ArrowRightIcon className="w-4 h-4" />
              </button>
              <button
                onClick={handleSkip}
                className="flex-1 py-3 px-6 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors border border-gray-200 dark:border-gray-700 rounded-xl"
              >
                Skip for now
              </button>
            </div>
          </div>
        )}

        {/* ── Step 1: Content Card Grid ── */}
        {step === 1 && (
          <div className="flex flex-col flex-1 overflow-hidden">
            <div className="p-6 pb-3 flex-shrink-0">
              <p className="text-xs font-medium text-blue-500 uppercase tracking-wider mb-1">Step 1 of 3</p>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Tap anything that looks interesting
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Mix freely  Enovels, articles, poetry, news. No right or wrong answers.
              </p>
            </div>

            <div className="flex-1 overflow-y-auto px-6 pb-2">
              {samplesLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {Array.from({ length: 12 }).map((_, i) => <SkeletonCard key={i} />)}
                </div>
              ) : samples.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-center text-gray-400 dark:text-gray-600">
                  <p className="text-sm">No published content yet.</p>
                  <p className="text-xs mt-1">We'll personalize as you explore!</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {samples.map(work => (
                    <ContentCard
                      key={work.id}
                      work={work}
                      selected={selections.selectedWorkIds.includes(work.id)}
                      onToggle={() => toggleWork(work.id)}
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="p-6 pt-4 border-t border-gray-100 dark:border-gray-800 flex-shrink-0 flex items-center justify-between">
              <span className="text-xs text-gray-400">
                {selections.selectedWorkIds.length === 0
                  ? 'Select anything  Eor skip'
                  : `${selections.selectedWorkIds.length} selected`}
              </span>
              <button
                onClick={() => setStep(2)}
                className="py-2 px-5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all flex items-center gap-2 text-sm"
              >
                Next <ArrowRightIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ── Step 2: Reading Pace ── */}
        {step === 2 && (
          <div className="flex flex-col flex-1 overflow-hidden">
            <div className="p-6 pb-4 flex-shrink-0">
              <p className="text-xs font-medium text-blue-500 uppercase tracking-wider mb-1">Step 2 of 3</p>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">How do you like to read?</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Helps us match content length and format to your style.
              </p>
            </div>
            <div className="flex-1 overflow-y-auto px-6 pb-2">
              <OptionSelector
                options={PACE_OPTIONS}
                value={selections.pace}
                onChange={pace => setSelections(prev => ({ ...prev, pace }))}
              />
            </div>
            <div className="p-6 pt-4 border-t border-gray-100 dark:border-gray-800 flex-shrink-0 flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="py-2 px-4 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-xl transition-colors flex items-center gap-2 text-sm"
              >
                <ArrowLeftIcon className="w-4 h-4" /> Back
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!canProceed()}
                className="flex-1 py-2 px-5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 text-sm"
              >
                Next <ArrowRightIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ── Step 3: Discovery Appetite ── */}
        {step === 3 && (
          <div className="flex flex-col flex-1 overflow-hidden">
            <div className="p-6 pb-4 flex-shrink-0">
              <p className="text-xs font-medium text-blue-500 uppercase tracking-wider mb-1">Step 3 of 3</p>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">How adventurous are you?</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Should we stick close to what you love, or push your boundaries?
              </p>
            </div>
            <div className="flex-1 overflow-y-auto px-6 pb-2">
              <OptionSelector
                options={DISCOVERY_OPTIONS}
                value={selections.discovery}
                onChange={discovery => setSelections(prev => ({ ...prev, discovery }))}
              />
            </div>

            {error && (
              <p className="mx-6 mb-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
                {error}
              </p>
            )}

            <div className="p-6 pt-4 border-t border-gray-100 dark:border-gray-800 flex-shrink-0 flex gap-3">
              <button
                onClick={() => setStep(2)}
                className="py-2 px-4 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-xl transition-colors flex items-center gap-2 text-sm"
              >
                <ArrowLeftIcon className="w-4 h-4" /> Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={!canProceed() || isSubmitting}
                className="flex-1 py-2 px-5 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 text-sm shadow-md hover:shadow-lg"
              >
                {isSubmitting ? (
                  <span className="inline-flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Building your feed…
                  </span>
                ) : (
                  <>Build My Feed <SparklesIcon className="w-4 h-4" /></>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ── Step 4: Success ── */}
        {step === 4 && (
          <div className="flex flex-col items-center justify-center p-10 text-center gap-5 flex-1">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center shadow-lg">
              <CheckIcon className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Your feed is ready!
              </h2>
              <p className="text-gray-500 dark:text-gray-400 max-w-md text-sm leading-relaxed">
                We've tuned Chapturs to your taste. The more you read, the better it gets.
              </p>
              {selectedGenres.length > 0 && (
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  {selectedGenres.map(genre => (
                    <span key={genre} className="px-3 py-1 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs rounded-full font-medium">
                      {genre}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={onComplete}
              className="py-3 px-8 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white font-semibold rounded-xl transition-all shadow-md hover:shadow-lg mt-2"
            >
              Start Reading
            </button>
          </div>
        )}

      </div>
    </div>
  )
}
