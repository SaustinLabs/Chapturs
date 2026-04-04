'use client'

import { useState } from 'react'
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/solid'
import { ArrowRightIcon, ArrowLeftIcon, SparklesIcon } from '@heroicons/react/24/outline'

// === GENRE CLUSTER TAXONOMY ===
// Each cluster maps to a set of genre affinities for the recommendation engine.
// Clusters are intentionally broad so they work across fiction, non-fiction,
// poetry, science journals, news — the full content spectrum.

export const TASTE_CLUSTERS = [
  {
    key: 'epic',
    label: 'Epic Worlds',
    emoji: '🌌',
    tagline: 'Magic, sci-fi, and realities beyond our own',
    genres: ['Fantasy', 'Science Fiction', 'Dystopian', 'Supernatural', 'Alternate History', 'Mythology'],
    formatBoosts: { novel: 0.9, comic: 0.7 },
    color: 'from-indigo-600 to-purple-700',
    hoverBorder: 'border-indigo-400',
  },
  {
    key: 'edge',
    label: 'On the Edge',
    emoji: '🔪',
    tagline: 'Heart-pounding tension that keeps you up all night',
    genres: ['Thriller', 'Mystery', 'Horror', 'Crime', 'Suspense', 'Psychological'],
    formatBoosts: { novel: 0.9, comic: 0.5 },
    color: 'from-red-700 to-rose-900',
    hoverBorder: 'border-red-400',
  },
  {
    key: 'heart',
    label: 'Matters of the Heart',
    emoji: '💞',
    tagline: 'Characters you fall in love with, relationships that resonate',
    genres: ['Romance', 'Drama', 'Literary Fiction', 'Coming of Age', 'Family'],
    formatBoosts: { novel: 0.95, comic: 0.4 },
    color: 'from-pink-500 to-rose-600',
    hoverBorder: 'border-pink-400',
  },
  {
    key: 'visual',
    label: 'Visual Stories',
    emoji: '🎨',
    tagline: 'Comics, webtoons, and illustrated narratives',
    genres: ['Action', 'Adventure', 'Slice of Life', 'Romance', 'Fantasy'],
    formatBoosts: { comic: 0.95, novel: 0.2 },
    color: 'from-amber-500 to-orange-600',
    hoverBorder: 'border-amber-400',
  },
  {
    key: 'ideas',
    label: 'Big Ideas',
    emoji: '🧠',
    tagline: 'Essays and philosophy that shift how you see the world',
    genres: ['Philosophy', 'Essays', 'Cultural Analysis', 'Opinion', 'Sociology', 'Ethics'],
    formatBoosts: { article: 0.95, novel: 0.3 },
    color: 'from-blue-600 to-cyan-700',
    hoverBorder: 'border-blue-400',
  },
  {
    key: 'knowledge',
    label: 'Know More',
    emoji: '🔬',
    tagline: 'Science, history, and the joy of understanding things deeply',
    genres: ['Science', 'History', 'Technology', 'Biography', 'Academic', 'Medicine', 'Economics'],
    formatBoosts: { article: 0.9, novel: 0.3 },
    color: 'from-teal-600 to-emerald-700',
    hoverBorder: 'border-teal-400',
  },
  {
    key: 'current',
    label: 'The World Today',
    emoji: '🌍',
    tagline: 'News, analysis, and current events that matter',
    genres: ['News', 'Politics', 'Environment', 'Business', 'Society', 'International'],
    formatBoosts: { article: 0.9 },
    color: 'from-slate-600 to-gray-700',
    hoverBorder: 'border-slate-400',
  },
  {
    key: 'poetry',
    label: 'The Art of Words',
    emoji: '✍️',
    tagline: 'Poetry, lyrical prose, and experimental writing',
    genres: ['Poetry', 'Experimental', 'Flash Fiction', 'Lyrical Fiction', 'Prose Poetry'],
    formatBoosts: { article: 0.7, novel: 0.6 },
    color: 'from-violet-600 to-fuchsia-700',
    hoverBorder: 'border-violet-400',
  },
  {
    key: 'grounded',
    label: 'Grounded in Life',
    emoji: '🌿',
    tagline: 'Historical fiction, realism, and life as it actually is',
    genres: ['Historical Fiction', 'Realistic Fiction', 'Slice of Life', 'Contemporary'],
    formatBoosts: { novel: 0.85, comic: 0.4 },
    color: 'from-green-700 to-lime-800',
    hoverBorder: 'border-green-400',
  },
] as const

type ClusterKey = typeof TASTE_CLUSTERS[number]['key']

const PACE_OPTIONS = [
  {
    key: 'deep',
    label: 'Deep Dives',
    description: 'I lose myself in long stories for hours — or days',
    icon: '🐋',
    qualityPreference: 0.75,
    freshnessPreference: 0.25,
  },
  {
    key: 'varied',
    label: 'It Depends on My Mood',
    description: 'Long sagas or quick reads — whatever I feel like',
    icon: '🦋',
    qualityPreference: 0.6,
    freshnessPreference: 0.5,
  },
  {
    key: 'snack',
    label: 'Quick Hits',
    description: 'Short, punchy pieces I can finish in one sitting',
    icon: '⚡',
    qualityPreference: 0.5,
    freshnessPreference: 0.8,
  },
] as const

type PaceKey = typeof PACE_OPTIONS[number]['key']

const DISCOVERY_OPTIONS = [
  {
    key: 'familiar',
    label: 'Stay in My Lane',
    description: "Give me more of what I already know I love",
    icon: '🏡',
    diversityPreference: 0.15,
  },
  {
    key: 'mixed',
    label: 'Mostly Familiar, Some Surprises',
    description: 'Keep it comfortable with the occasional curveball',
    icon: '🎲',
    diversityPreference: 0.45,
  },
  {
    key: 'adventurous',
    label: 'Take Me Somewhere New',
    description: "Show me things I'd never have thought to pick myself",
    icon: '🧭',
    diversityPreference: 0.8,
  },
] as const

type DiscoveryKey = typeof DISCOVERY_OPTIONS[number]['key']

interface SurveySelections {
  clusters: ClusterKey[]
  pace: PaceKey | null
  discovery: DiscoveryKey | null
}

interface TasteProfileSurveyProps {
  onComplete: () => void
}

export default function TasteProfileSurvey({ onComplete }: TasteProfileSurveyProps) {
  const [step, setStep] = useState(0)
  const [selections, setSelections] = useState<SurveySelections>({
    clusters: [],
    pace: null,
    discovery: null,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const toggleCluster = (key: ClusterKey) => {
    setSelections(prev => ({
      ...prev,
      clusters: prev.clusters.includes(key)
        ? prev.clusters.filter(c => c !== key)
        : [...prev.clusters, key],
    }))
  }

  const canProceed = () => {
    if (step === 1) return selections.clusters.length >= 1
    if (step === 2) return selections.pace !== null
    if (step === 3) return selections.discovery !== null
    return true
  }

  const handleSkip = async () => {
    try {
      await fetch('/api/user/taste-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clusters: [], pace: 'varied', discovery: 'mixed', skipped: true }),
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
      setError("Couldn't save preferences — but your feed will still work. Try again later.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden">

        {/* Header progress bar */}
        {step > 0 && step < 4 && (
          <div className="h-1 bg-gray-100 dark:bg-gray-800 rounded-t-2xl overflow-hidden flex-shrink-0">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-violet-500 transition-all duration-500"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        )}

        {/* Step 0: Intro */}
        {step === 0 && (
          <div className="flex flex-col items-center justify-center p-10 text-center gap-5 flex-1">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shadow-lg">
              <SparklesIcon className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Build Your Taste Profile
              </h2>
              <p className="text-gray-500 dark:text-gray-400 max-w-md text-sm leading-relaxed">
                Answer three quick questions and we'll tune your feed to exactly what you love — fiction, poetry, science, news, whatever it is.
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

        {/* Step 1: Content Cluster Selection */}
        {step === 1 && (
          <div className="flex flex-col flex-1 overflow-hidden">
            <div className="p-6 pb-3 flex-shrink-0">
              <p className="text-xs font-medium text-blue-500 uppercase tracking-wider mb-1">Step 1 of 3</p>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">What worlds call to you?</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Pick everything that sounds interesting — mix and match freely.
              </p>
            </div>

            <div className="flex-1 overflow-y-auto px-6 pb-2">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {TASTE_CLUSTERS.map(cluster => {
                  const selected = selections.clusters.includes(cluster.key)
                  return (
                    <button
                      key={cluster.key}
                      onClick={() => toggleCluster(cluster.key)}
                      className={`relative rounded-xl border-2 p-4 text-left transition-all duration-150 ${
                        selected
                          ? `border-blue-500 bg-blue-50 dark:bg-blue-950/40 shadow-md`
                          : `border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm bg-white dark:bg-gray-800`
                      }`}
                    >
                      {selected && (
                        <div className="absolute top-2 right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                          <CheckIcon className="w-3 h-3 text-white" />
                        </div>
                      )}
                      <div className="text-2xl mb-2">{cluster.emoji}</div>
                      <div className="font-semibold text-sm text-gray-900 dark:text-white mb-1">
                        {cluster.label}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                        {cluster.tagline}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="p-6 pt-4 border-t border-gray-100 dark:border-gray-800 flex-shrink-0">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">
                  {selections.clusters.length === 0
                    ? 'Select at least one'
                    : `${selections.clusters.length} selected`}
                </span>
                <button
                  onClick={() => setStep(2)}
                  disabled={!canProceed()}
                  className="py-2 px-5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all flex items-center gap-2 text-sm"
                >
                  Next <ArrowRightIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Reading Pace */}
        {step === 2 && (
          <div className="flex flex-col flex-1 overflow-hidden">
            <div className="p-6 pb-4 flex-shrink-0">
              <p className="text-xs font-medium text-blue-500 uppercase tracking-wider mb-1">Step 2 of 3</p>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">How do you like to read?</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                This helps us match content length and format to your style.
              </p>
            </div>

            <div className="flex-1 overflow-y-auto px-6 pb-2">
              <div className="flex flex-col gap-3">
                {PACE_OPTIONS.map(option => {
                  const selected = selections.pace === option.key
                  return (
                    <button
                      key={option.key}
                      onClick={() => setSelections(prev => ({ ...prev, pace: option.key }))}
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

        {/* Step 3: Discovery Appetite */}
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
              <div className="flex flex-col gap-3">
                {DISCOVERY_OPTIONS.map(option => {
                  const selected = selections.discovery === option.key
                  return (
                    <button
                      key={option.key}
                      onClick={() => setSelections(prev => ({ ...prev, discovery: option.key }))}
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
            </div>

            {error && (
              <div className="mx-6 mb-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
                {error}
              </div>
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

        {/* Step 4: Success */}
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
              {selections.clusters.length > 0 && (
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  {selections.clusters.map(key => {
                    const cluster = TASTE_CLUSTERS.find(c => c.key === key)!
                    return (
                      <span key={key} className="px-3 py-1 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs rounded-full font-medium">
                        {cluster.emoji} {cluster.label}
                      </span>
                    )
                  })}
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
