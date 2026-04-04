'use client'

import { useUser } from '@/hooks/useUser'
import { useState, useEffect } from 'react'
import { 
  BookOpen, 
  TrendingUp, 
  Eye, 
  Star, 
  Clock,
  AlertCircle,
  CheckCircle,
  Sparkles,
  Award,
  BarChart3,
  Edit,
  Trash2,
  Plus
} from 'lucide-react'
import Link from 'next/link'
import { resolveCoverSrc } from '@/lib/images'
import QualityCelebration from './QualityCelebration'

interface Work {
  id: string
  title: string
  genre: string
  coverImage?: string
  description?: string
  status: 'draft' | 'published' | 'completed'
  createdAt: string
  _count: {
    sections: number
    likes: number
  }
  sections: Array<{
    id: string
    title: string
    createdAt: string
  }>
}

interface QualityAssessment {
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
  feedbackMessage: string
  earlyReview: string | null
  boostMultiplier: number
  boostExpiry: string | null
  createdAt: string
}

interface QueueItem {
  id: string
  workId: string
  status: 'queued' | 'processing' | 'completed' | 'failed'
  priority: 'low' | 'normal' | 'high'
  createdAt: string
}

const TIER_CONFIG = {
  exceptional: {
    color: 'from-yellow-400 via-amber-500 to-orange-500',
    bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
    textColor: 'text-yellow-700 dark:text-yellow-300',
    borderColor: 'border-yellow-300 dark:border-yellow-700',
    icon: Award,
    label: 'Exceptional',
    description: '1.5x visibility boost'
  },
  strong: {
    color: 'from-blue-400 via-indigo-500 to-purple-500',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    textColor: 'text-blue-700 dark:text-blue-300',
    borderColor: 'border-blue-300 dark:border-blue-700',
    icon: Star,
    label: 'Strong',
    description: '1.2x visibility boost'
  },
  developing: {
    color: 'from-green-400 via-emerald-500 to-teal-500',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    textColor: 'text-green-700 dark:text-green-300',
    borderColor: 'border-green-300 dark:border-green-700',
    icon: TrendingUp,
    label: 'Developing',
    description: 'Standard visibility'
  },
  needs_work: {
    color: 'from-gray-400 via-gray-500 to-gray-600',
    bgColor: 'bg-gray-50 dark:bg-gray-900/20',
    textColor: 'text-gray-700 dark:text-gray-300',
    borderColor: 'border-gray-300 dark:border-gray-700',
    icon: Edit,
    label: 'Developing',
    description: 'Room for improvement'
  }
}

export default function StoryManagement() {
  const { userId, isAuthenticated, isLoading } = useUser()
  const [works, setWorks] = useState<Work[]>([])
  const [assessments, setAssessments] = useState<Record<string, QualityAssessment>>({})
  const [queueItems, setQueueItems] = useState<Record<string, QueueItem>>({})
  const [loadingWorks, setLoadingWorks] = useState(true)
  const [loadingAssessments, setLoadingAssessments] = useState(false)
  const [selectedAssessment, setSelectedAssessment] = useState<{ workId: string; sectionId: string } | null>(null)
  const [filter, setFilter] = useState<'all' | 'published' | 'draft' | 'completed'>('all')

  // Fetch user's works
  useEffect(() => {
    if (!isAuthenticated || !userId) {
      console.log('StoryManagement: Not fetching works', { isAuthenticated, userId })
      return
    }

    const fetchWorks = async () => {
      try {
        setLoadingWorks(true)
        console.log('StoryManagement: Fetching works for userId:', userId)
        const response = await fetch(`/api/works?authorId=${userId}`)
        console.log('StoryManagement: Response status:', response.status)
        if (response.ok) {
          const responseData = await response.json()
          console.log('StoryManagement: Received data:', responseData)
          
          // Handle wrapped response format: { success: true, data: { works: [...] } }
          const data = responseData.data || responseData
          const worksArray = data.works || data || []
          
          console.log('StoryManagement: Extracted data:', data)
          console.log('StoryManagement: Works array:', worksArray)
          console.log('StoryManagement: Works array length:', worksArray.length)
          
          setWorks(worksArray)
        } else {
          console.error('StoryManagement: Failed to fetch works, status:', response.status)
        }
      } catch (error) {
        console.error('Failed to fetch works:', error)
      } finally {
        setLoadingWorks(false)
      }
    }

    fetchWorks()
  }, [userId, isAuthenticated])

  // Fetch quality assessments for all works
  useEffect(() => {
    if (!works.length) return

    const fetchAssessments = async () => {
      setLoadingAssessments(true)
      const assessmentPromises = works.map(async (work) => {
        if (!work.sections || work.sections.length === 0) return null
        
        const firstSection = work.sections[0]
        try {
          const response = await fetch(`/api/quality-assessment/${work.id}?sectionId=${firstSection.id}`)
          if (response.ok) {
            const assessment = await response.json()
            return { workId: work.id, assessment }
          }
        } catch (error) {
          console.error(`Failed to fetch assessment for ${work.id}:`, error)
        }
        return null
      })

      const results = await Promise.all(assessmentPromises)
      const assessmentMap: Record<string, QualityAssessment> = {}
      results.forEach(result => {
        if (result) {
          assessmentMap[result.workId] = result.assessment
        }
      })
      setAssessments(assessmentMap)
      setLoadingAssessments(false)
    }

    fetchAssessments()
  }, [works])

  const filteredWorks = works.filter(work => {
    if (filter === 'all') return true
    return work.status === filter
  })

  const getStatusBadge = (status: string) => {
    const config = {
      draft: { color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300', label: 'Draft' },
      published: { color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300', label: 'Published' },
      completed: { color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300', label: 'Completed' }
    }
    const { color, label } = config[status as keyof typeof config] || config.draft
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${color}`}>
        {label}
      </span>
    )
  }

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          <div className="h-32 bg-gray-100 dark:bg-gray-800 rounded"></div>
          <div className="h-32 bg-gray-100 dark:bg-gray-800 rounded"></div>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-7xl mx-auto p-6 text-center">
        <h2 className="text-2xl font-bold mb-4">Story Management</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Please sign in to manage your stories.
        </p>
        <Link 
          href="/auth/signin"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Sign In
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Your Stories
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your works, view quality assessments, and track performance
          </p>
        </div>
        <Link
          href="/creator/upload"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          New Story
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 dark:border-gray-700">
        {(['all', 'published', 'draft', 'completed'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-4 py-2 font-medium transition-colors border-b-2 ${
              filter === tab
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Loading State */}
      {loadingWorks && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse bg-gray-100 dark:bg-gray-800 rounded-lg h-64"></div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loadingWorks && filteredWorks.length === 0 && (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
          <BookOpen className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No stories yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {filter === 'all' 
              ? "Start your writing journey by creating your first story!"
              : `You don't have any ${filter} stories yet.`
            }
          </p>
          <Link
            href="/creator/upload"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Create Your First Story
          </Link>
        </div>
      )}

      {/* Works Grid */}
      {!loadingWorks && filteredWorks.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredWorks.map((work) => {
            const assessment = assessments[work.id]
            const hasAssessment = !!assessment
            const tierConfig = hasAssessment ? TIER_CONFIG[assessment.qualityTier] : null
            const TierIcon = tierConfig?.icon

            return (
              <div
                key={work.id}
                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-shadow"
              >
                {/* Cover Image or Placeholder */}
                <div className="relative h-48 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800">
                  {work.coverImage ? (
                    <img 
                      src={resolveCoverSrc(work.id, work.coverImage)} 
                      alt={work.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <BookOpen className="w-16 h-16 text-gray-400" />
                    </div>
                  )}
                  
                  {/* Quality Badge Overlay */}
                  {hasAssessment && tierConfig && (
                    <div className="absolute top-4 right-4">
                      <button
                        onClick={() => setSelectedAssessment({ workId: work.id, sectionId: work.sections[0]?.id })}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg ${tierConfig.bgColor} ${tierConfig.textColor} border ${tierConfig.borderColor} backdrop-blur-sm shadow-lg hover:scale-105 transition-transform`}
                      >
                        {TierIcon && <TierIcon className="w-4 h-4" />}
                        <span className="font-semibold text-sm">{assessment.overallScore}</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                  {/* Title and Status */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1 truncate">
                        {work.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {work.genre}
                      </p>
                    </div>
                    {getStatusBadge(work.status)}
                  </div>

                  {/* Description */}
                  {work.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                      {work.description}
                    </p>
                  )}

                  {/* Quality Assessment Section */}
                  {hasAssessment && assessment && tierConfig && (
                    <div className={`p-4 rounded-lg ${tierConfig.bgColor} border ${tierConfig.borderColor}`}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Sparkles className={`w-4 h-4 ${tierConfig.textColor}`} />
                          <span className={`font-semibold text-sm ${tierConfig.textColor}`}>
                            {tierConfig.label} Quality
                          </span>
                        </div>
                        <span className={`text-xs ${tierConfig.textColor}`}>
                          {tierConfig.description}
                        </span>
                      </div>
                      
                      {/* Discovery Tags */}
                      {assessment.discoveryTags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {assessment.discoveryTags.slice(0, 4).map((tag, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 bg-white/60 dark:bg-gray-900/60 rounded text-xs font-medium text-gray-700 dark:text-gray-300"
                            >
                              {tag}
                            </span>
                          ))}
                          {assessment.discoveryTags.length > 4 && (
                            <span className="px-2 py-1 bg-white/60 dark:bg-gray-900/60 rounded text-xs font-medium text-gray-700 dark:text-gray-300">
                              +{assessment.discoveryTags.length - 4} more
                            </span>
                          )}
                        </div>
                      )}

                      {/* Feedback Message */}
                      <p className="text-sm text-gray-700 dark:text-gray-300 italic">
                        "{assessment.feedbackMessage}"
                      </p>

                      {/* View Full Assessment Button */}
                      <button
                        onClick={() => setSelectedAssessment({ workId: work.id, sectionId: work.sections[0]?.id })}
                        className={`mt-3 w-full py-2 rounded-lg font-medium text-sm ${tierConfig.textColor} hover:bg-white/40 dark:hover:bg-gray-900/40 transition-colors`}
                      >
                        View Full Assessment
                      </button>
                    </div>
                  )}

                  {/* Stats */}
                  <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4" />
                      <span>{work._count.sections} chapters</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4" />
                      <span>{work._count.likes} likes</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <Link
                      href={`/story/${work.id}`}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      View
                    </Link>
                    <Link
                      href={`/creator/work/${work.id}/chapters`}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                      Chapters
                    </Link>
                    <Link
                      href={`/creator/work/${work.id}/edit`}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </Link>
                    <button
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Quality Celebration Modal */}
      {selectedAssessment && (
        <QualityCelebration
          workId={selectedAssessment.workId}
          sectionId={selectedAssessment.sectionId}
          onClose={() => setSelectedAssessment(null)}
        />
      )}
    </div>
  )
}
