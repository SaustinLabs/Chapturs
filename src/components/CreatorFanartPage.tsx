'use client'

import { useUser } from '@/hooks/useUser'
import { useState, useEffect } from 'react'
import { 
  Image, Check, X, ExternalLink, User, Calendar,
  Filter, Search, AlertCircle, CheckCircle, XCircle,
  Loader2, Eye, Clock
} from 'lucide-react'
import Link from 'next/link'

interface FanartSubmission {
  id: string
  imageUrl: string
  artistName: string
  artistLink?: string
  artistHandle?: string
  notes?: string
  status: 'pending' | 'approved' | 'rejected'
  submittedBy?: string
  createdAt: string
  reviewedAt?: string
  reviewedBy?: string
  workId: string
  workTitle: string
  characterId: string
  characterName: string
  characterMetadata?: any
  characterAllowUserSubmissions?: boolean
  submitterName?: string
  submitterEmail?: string
}

interface StatusCounts {
  pending: number
  approved: number
  rejected: number
}

type ConfirmationFilter = 'all' | 'needs-confirmation' | 'auto-confirmed' | 'manual-confirmed'

export default function CreatorFanartPage() {
  const { isAuthenticated, isLoading } = useUser()
  const [submissions, setSubmissions] = useState<FanartSubmission[]>([])
  const [counts, setCounts] = useState<StatusCounts>({ pending: 0, approved: 0, rejected: 0 })
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending')
  const [confirmationFilter, setConfirmationFilter] = useState<ConfirmationFilter>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (isAuthenticated) {
      fetchSubmissions()
    }
  }, [isAuthenticated, statusFilter])

  const fetchSubmissions = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/creator/fanart?status=${statusFilter}`)
      if (!res.ok) throw new Error('Failed to fetch submissions')
      
      const data = await res.json()
      if (data.success) {
        setSubmissions(data.submissions)
        setCounts(data.counts)
      }
    } catch (error) {
      console.error('Failed to fetch fanart submissions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleReview = async (submissionId: string, action: 'approve' | 'reject', workId: string, characterId: string) => {
    setProcessingIds(prev => new Set(prev).add(submissionId))
    
    try {
      const res = await fetch(`/api/works/${workId}/characters/${characterId}/submissions`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissionId, action })
      })

      if (!res.ok) throw new Error('Failed to review submission')

      // Refresh the list
      await fetchSubmissions()
    } catch (error) {
      console.error('Failed to review submission:', error)
      alert('Failed to review submission. Please try again.')
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(submissionId)
        return newSet
      })
    }
  }

  const handleConfirmCharacter = async (
    submissionId: string,
    workId: string,
    characterId: string,
    characterName: string,
    approveSubmission: boolean
  ) => {
    setProcessingIds(prev => new Set(prev).add(submissionId))

    try {
      const res = await fetch('/api/creator/fanart', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'confirm-character',
          submissionId,
          workId,
          characterId,
          characterName,
          approveSubmission,
        })
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.error || 'Failed to confirm character')
      }

      await fetchSubmissions()
    } catch (error: any) {
      console.error('Failed to confirm character:', error)
      alert(error?.message || 'Failed to confirm character. Please try again.')
    } finally {
      setProcessingIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(submissionId)
        return newSet
      })
    }
  }

  const filteredSubmissions = submissions.filter(sub => {
    const meta = (() => {
      if (!sub.characterMetadata) return null
      if (typeof sub.characterMetadata === 'string') {
        try {
          return JSON.parse(sub.characterMetadata)
        } catch {
          return null
        }
      }
      return sub.characterMetadata
    })()

    const pendingAuthorConfirmation = Boolean(meta?.pendingAuthorConfirmation)
    const confirmationSource = meta?.confirmationSource as string | undefined

    const confirmationMatch = (() => {
      if (confirmationFilter === 'all') return true
      if (confirmationFilter === 'needs-confirmation') return pendingAuthorConfirmation
      if (confirmationFilter === 'auto-confirmed') {
        return !pendingAuthorConfirmation && confirmationSource === 'fanart-submit-anyway'
      }
      if (confirmationFilter === 'manual-confirmed') {
        return !pendingAuthorConfirmation && confirmationSource === 'creator-fanart-review'
      }
      return true
    })()

    if (!confirmationMatch) return false

    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      sub.characterName.toLowerCase().includes(query) ||
      sub.workTitle.toLowerCase().includes(query) ||
      sub.artistName.toLowerCase().includes(query) ||
      sub.artistHandle?.toLowerCase().includes(query)
    )
  })

  if (isLoading || loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="animate-spin text-blue-600" size={32} />
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="text-center py-12">
          <AlertCircle className="mx-auto mb-4 text-red-500" size={48} />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Unauthorized</h2>
          <p className="text-gray-600 dark:text-gray-400">Please sign in to manage fanart submissions.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Fanart Submissions
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Review and manage character fanart submissions from your readers
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Pending Review</p>
              <p className="text-2xl font-bold text-orange-600">{counts.pending}</p>
            </div>
            <Clock className="text-orange-500" size={24} />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Approved</p>
              <p className="text-2xl font-bold text-green-600">{counts.approved}</p>
            </div>
            <CheckCircle className="text-green-500" size={24} />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Rejected</p>
              <p className="text-2xl font-bold text-red-600">{counts.rejected}</p>
            </div>
            <XCircle className="text-red-500" size={24} />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
              <p className="text-2xl font-bold text-blue-600">
                {counts.pending + counts.approved + counts.rejected}
              </p>
            </div>
            <Image className="text-blue-500" size={24} />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-6 border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter size={20} className="text-gray-500" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="pending">Pending Only</option>
              <option value="approved">Approved Only</option>
              <option value="rejected">Rejected Only</option>
              <option value="all">All Submissions</option>
            </select>
          </div>

          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by character, story, or artist..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {[
            { id: 'all', label: 'All Confirm States' },
            { id: 'needs-confirmation', label: 'Needs Confirmation' },
            { id: 'auto-confirmed', label: 'Auto-Confirmed' },
            { id: 'manual-confirmed', label: 'Manual Confirmed' },
          ].map((option) => {
            const active = confirmationFilter === option.id
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => setConfirmationFilter(option.id as ConfirmationFilter)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                  active
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                }`}
              >
                {option.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Submissions Grid */}
      {filteredSubmissions.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-12 text-center border border-gray-200 dark:border-gray-700">
          <Image className="mx-auto mb-4 text-gray-400" size={48} />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            No Submissions Found
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {statusFilter === 'pending' 
              ? "No pending fanart submissions at the moment."
              : `No ${statusFilter} submissions found.`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSubmissions.map((submission) => (
            <SubmissionCard
              key={submission.id}
              submission={submission}
              onReview={handleReview}
              onConfirmCharacter={handleConfirmCharacter}
              isProcessing={processingIds.has(submission.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// Submission Card Component
function SubmissionCard({ 
  submission, 
  onReview, 
  onConfirmCharacter,
  isProcessing 
}: { 
  submission: FanartSubmission
  onReview: (id: string, action: 'approve' | 'reject', workId: string, characterId: string) => void
  onConfirmCharacter: (
    submissionId: string,
    workId: string,
    characterId: string,
    characterName: string,
    approveSubmission: boolean
  ) => void
  isProcessing: boolean
}) {
  const [showFullImage, setShowFullImage] = useState(false)
  const [proposedCharacterName, setProposedCharacterName] = useState(submission.characterName)

  const characterMeta = (() => {
    if (!submission.characterMetadata) return null
    if (typeof submission.characterMetadata === 'string') {
      try {
        return JSON.parse(submission.characterMetadata)
      } catch {
        return null
      }
    }
    return submission.characterMetadata
  })()

  const needsCharacterConfirmation = Boolean(characterMeta?.pendingAuthorConfirmation)
  const confirmationSource = characterMeta?.confirmationSource as string | undefined
  const confirmedAt = characterMeta?.confirmedAt as string | undefined
  const isConfirmed = !needsCharacterConfirmation && Boolean(confirmedAt)
  const confirmationPill = needsCharacterConfirmation
    ? { label: 'Needs Confirmation', className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' }
    : confirmationSource === 'fanart-submit-anyway'
      ? { label: 'Auto-Confirmed', className: 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300' }
      : confirmationSource === 'creator-fanart-review'
        ? { label: 'Manual Confirmed', className: 'bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300' }
        : null

  const statusColors = {
    pending: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
    approved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
  }

  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
        {/* Image */}
        <div className="relative aspect-square bg-gray-100 dark:bg-gray-900 group cursor-pointer">
          <img
            src={submission.imageUrl}
            alt={`Fanart of ${submission.characterName}`}
            className="w-full h-full object-cover"
            onClick={() => setShowFullImage(true)}
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors flex items-center justify-center">
            <Eye className="text-white opacity-0 group-hover:opacity-100 transition-opacity" size={32} />
          </div>
          
          {/* Status Badge */}
          <div className={`absolute top-2 right-2 px-2 py-1 rounded text-xs font-semibold ${statusColors[submission.status]}`}>
            {submission.status.toUpperCase()}
          </div>
        </div>

        {/* Details */}
        <div className="p-4">
          <div className="mb-3">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
              {submission.characterName}
            </h3>
            {confirmationPill && (
              <span className={`inline-flex mb-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${confirmationPill.className}`}>
                {confirmationPill.label}
              </span>
            )}
            <Link 
              href={`/creator/works/${submission.workId}`}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              {submission.workTitle}
            </Link>
          </div>

          {/* Artist Info */}
          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <User size={14} />
              <span className="font-medium">{submission.artistName}</span>
            </div>
            {submission.artistHandle && (
              <div className="text-sm text-gray-600 dark:text-gray-400 ml-6">
                @{submission.artistHandle}
              </div>
            )}
            {submission.artistLink && (
              <a
                href={submission.artistLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:underline ml-6"
              >
                <ExternalLink size={14} />
                View Portfolio
              </a>
            )}
          </div>

          {/* Notes */}
          {submission.notes && (
            <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded text-sm text-gray-700 dark:text-gray-300">
              <p className="font-medium mb-1">Artist's Note:</p>
              <p className="text-sm">{submission.notes}</p>
            </div>
          )}

          {needsCharacterConfirmation && (
            <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded text-sm text-amber-900 dark:text-amber-200">
              <p className="font-medium mb-1">Character confirmation needed</p>
              <p className="mb-2">This submission created a provisional character. Confirm it here, optionally renaming first.</p>
              <input
                type="text"
                value={proposedCharacterName}
                onChange={(e) => setProposedCharacterName(e.target.value)}
                className="w-full mb-2 px-2 py-1 text-sm text-gray-900 border border-amber-300 rounded"
                placeholder="Character name"
              />
              <div className="flex flex-wrap gap-2 mb-2">
                <button
                  onClick={() => onConfirmCharacter(
                    submission.id,
                    submission.workId,
                    submission.characterId,
                    proposedCharacterName,
                    false
                  )}
                  disabled={isProcessing || !proposedCharacterName.trim()}
                  className="px-2 py-1 text-xs bg-amber-600 text-white rounded hover:bg-amber-700 disabled:opacity-50"
                >
                  Confirm Character
                </button>
                {submission.status === 'pending' && (
                  <button
                    onClick={() => onConfirmCharacter(
                      submission.id,
                      submission.workId,
                      submission.characterId,
                      proposedCharacterName,
                      true
                    )}
                    disabled={isProcessing || !proposedCharacterName.trim()}
                    className="px-2 py-1 text-xs bg-emerald-600 text-white rounded hover:bg-emerald-700 disabled:opacity-50"
                  >
                    Approve + Confirm
                  </button>
                )}
              </div>
              <Link
                href={`/creator/works/${submission.workId}/characters`}
                className="inline-flex items-center gap-1 text-amber-800 dark:text-amber-300 underline"
              >
                Open character management
              </Link>
            </div>
          )}

          {isConfirmed && (
            <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded text-sm text-emerald-900 dark:text-emerald-200">
              <p className="font-medium mb-1">Character confirmation recorded</p>
              <p>
                {confirmationSource === 'creator-fanart-review'
                  ? 'Confirmed in fanart review.'
                  : confirmationSource === 'fanart-submit-anyway'
                    ? 'Auto-confirmed by creator automation settings.'
                    : 'Confirmed.'}
              </p>
              {confirmedAt && (
                <p className="text-xs mt-1 opacity-80">
                  {new Date(confirmedAt).toLocaleString()}
                </p>
              )}
            </div>
          )}

          {/* Metadata */}
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-4">
            <Calendar size={12} />
            <span>
              Submitted {new Date(submission.createdAt).toLocaleDateString()}
            </span>
          </div>

          {/* Action Buttons */}
          {submission.status === 'pending' && (
            <div className="flex gap-2">
              <button
                onClick={() => onReview(submission.id, 'approve', submission.workId, submission.characterId)}
                disabled={isProcessing}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg transition-colors disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : (
                  <>
                    <Check size={16} />
                    Approve
                  </>
                )}
              </button>
              <button
                onClick={() => onReview(submission.id, 'reject', submission.workId, submission.characterId)}
                disabled={isProcessing}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-lg transition-colors disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : (
                  <>
                    <X size={16} />
                    Reject
                  </>
                )}
              </button>
            </div>
          )}

          {submission.status !== 'pending' && submission.reviewedAt && (
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {submission.status === 'approved' ? 'Approved' : 'Rejected'} on{' '}
              {new Date(submission.reviewedAt).toLocaleDateString()}
            </div>
          )}
        </div>
      </div>

      {/* Full Image Modal */}
      {showFullImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setShowFullImage(false)}
        >
          <button
            className="absolute top-4 right-4 text-white hover:text-gray-300"
            onClick={() => setShowFullImage(false)}
          >
            <X size={32} />
          </button>
          <img
            src={submission.imageUrl}
            alt={`Fanart of ${submission.characterName}`}
            className="max-w-full max-h-full object-contain"
          />
        </div>
      )}
    </>
  )
}
