'use client'

import { useState, useEffect } from 'react'
import { Sparkles, TrendingUp, Award, Heart, Lightbulb } from 'lucide-react'

interface QualityAssessmentResult {
  id: string
  workId: string
  sectionId: string
  overallScore: number
  qualityTier: 'exceptional' | 'strong' | 'developing' | 'needs_work'
  scores: {
    writingQuality: number
    storytelling: number
    characterization: number
    worldBuilding: number
    engagement: number
    originality: number
  }
  discoveryTags: string[]
  feedbackMessage: string | null
  earlyReview: string | null
  boostMultiplier: number
  boostExpiry: string | null
  createdAt: string
}

interface QualityCelebrationProps {
  workId: string
  sectionId: string
  onClose?: () => void
}

export default function QualityCelebration({ workId, sectionId, onClose }: QualityCelebrationProps) {
  const [assessment, setAssessment] = useState<QualityAssessmentResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showFireworks, setShowFireworks] = useState(false)

  useEffect(() => {
    fetchAssessment()
  }, [workId, sectionId])

  const fetchAssessment = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/quality-assessment/${workId}?sectionId=${sectionId}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('Assessment not ready yet. Check back soon!')
          return
        }
        throw new Error('Failed to fetch assessment')
      }

      const data = await response.json()
      setAssessment(data)

      // Trigger fireworks for exceptional/strong tiers
      if (data.qualityTier === 'exceptional' || data.qualityTier === 'strong') {
        setShowFireworks(true)
        setTimeout(() => setShowFireworks(false), 5000)
      }
    } catch (err) {
      setError('Failed to load quality assessment')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error || !assessment) {
    return (
      <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-6 text-center">
        <p className="text-gray-600 dark:text-gray-400">{error || 'No assessment available'}</p>
      </div>
    )
  }

  const tierConfig = {
    exceptional: {
      title: '🎉 Exceptional Work!',
      color: 'from-purple-500 to-pink-500',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      borderColor: 'border-purple-200 dark:border-purple-700',
      textColor: 'text-purple-900 dark:text-purple-100',
      icon: Award,
      message: 'Your story shows exceptional quality! It will receive enhanced visibility to help readers discover it.',
    },
    strong: {
      title: '⭐ Strong Quality!',
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      borderColor: 'border-blue-200 dark:border-blue-700',
      textColor: 'text-blue-900 dark:text-blue-100',
      icon: TrendingUp,
      message: 'Great work! Your story demonstrates strong quality and will get a visibility boost.',
    },
    developing: {
      title: '📝 Developing Well',
      color: 'from-green-500 to-teal-500',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      borderColor: 'border-green-200 dark:border-green-700',
      textColor: 'text-green-900 dark:text-green-100',
      icon: Lightbulb,
      message: 'Your story is on the right track! Keep refining your craft.',
    },
    needs_work: {
      title: '💪 Keep Building',
      color: 'from-yellow-500 to-orange-500',
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
      borderColor: 'border-yellow-200 dark:border-yellow-700',
      textColor: 'text-yellow-900 dark:text-yellow-100',
      icon: Heart,
      message: 'Every great writer started somewhere. Keep writing and improving!',
    },
  }

  const config = tierConfig[assessment.qualityTier]
  const Icon = config.icon

  return (
    <div className="relative">
      {/* Fireworks effect for exceptional/strong */}
      {showFireworks && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="animate-ping absolute top-10 left-1/4 w-2 h-2 bg-purple-500 rounded-full"></div>
          <div className="animate-ping absolute top-20 left-3/4 w-2 h-2 bg-pink-500 rounded-full delay-100"></div>
          <div className="animate-ping absolute top-5 left-1/2 w-2 h-2 bg-blue-500 rounded-full delay-200"></div>
        </div>
      )}

      {/* Main card */}
      <div className={`relative rounded-lg border-2 ${config.borderColor} ${config.bgColor} p-6 space-y-6`}>
        {/* Header */}
        <div className="text-center">
          <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r ${config.color} mb-4`}>
            <Icon className="text-white" size={32} />
          </div>
          <h2 className={`text-2xl font-bold ${config.textColor} mb-2`}>{config.title}</h2>
          <p className="text-gray-600 dark:text-gray-400">{config.message}</p>
        </div>

        {/* Overall score */}
        <div className="text-center">
          <div className={`text-5xl font-bold bg-gradient-to-r ${config.color} bg-clip-text text-transparent`}>
            {Math.round(assessment.overallScore)}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Overall Score</div>
        </div>

        {/* Score breakdown */}
        <div className="grid grid-cols-2 gap-4">
          {Object.entries(assessment.scores).map(([key, value]) => (
            <div key={key} className="bg-white dark:bg-gray-800 rounded-lg p-3">
              <div className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                {key.replace(/([A-Z])/g, ' $1').trim()}
              </div>
              <div className="text-xl font-bold text-gray-900 dark:text-gray-100">{value}</div>
            </div>
          ))}
        </div>

        {/* Feedback message */}
        {assessment.feedbackMessage && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-start gap-3">
              <Lightbulb className="text-blue-500 flex-shrink-0 mt-1" size={20} />
              <p className="text-gray-700 dark:text-gray-300">{assessment.feedbackMessage}</p>
            </div>
          </div>
        )}

        {/* Reader blurb preview */}
        {assessment.earlyReview && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
              How your story appears to readers
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300 italic leading-relaxed">
              {assessment.earlyReview}
            </p>
          </div>
        )}

        {/* Discovery tags */}
        {assessment.discoveryTags.length > 0 && (
          <div>
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
              <Sparkles size={16} />
              Discovery Tags (helping readers find your story)
            </div>
            <div className="flex flex-wrap gap-2">
              {assessment.discoveryTags.map((tag, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 bg-white dark:bg-gray-800 rounded-full text-sm text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Boost info */}
        {assessment.boostMultiplier > 1 && (
          <div className={`bg-gradient-to-r ${config.color} text-white rounded-lg p-4 text-center`}>
            <div className="font-bold text-lg">
              {assessment.boostMultiplier}x Visibility Boost!
            </div>
            {assessment.boostExpiry && (
              <div className="text-sm opacity-90 mt-1">
                Active until {new Date(assessment.boostExpiry).toLocaleDateString()}
              </div>
            )}
          </div>
        )}

        {/* Close button */}
        {onClose && (
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            Continue
          </button>
        )}
      </div>
    </div>
  )
}
