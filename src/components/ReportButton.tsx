'use client'

import { useState } from 'react'
import { Flag } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { signIn } from 'next-auth/react'
import { useToast } from '@/components/ui/Toast'

type ReportTargetType = 'work' | 'section' | 'comment' | 'user'
type ReportReason = 'spam' | 'harassment' | 'explicit' | 'misinformation' | 'copyright' | 'other'

interface ReportButtonProps {
  targetType: ReportTargetType
  targetId: string
  /** Optional label shown next to the icon (defaults to hidden, icon only) */
  label?: string
  className?: string
}

const REASON_LABELS: Record<ReportReason, string> = {
  spam: 'Spam or misleading',
  harassment: 'Harassment or bullying',
  explicit: 'Explicit / inappropriate content',
  misinformation: 'Misinformation',
  copyright: 'Copyright violation',
  other: 'Other'
}

export default function ReportButton({ targetType, targetId, label, className = '' }: ReportButtonProps) {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [showModal, setShowModal] = useState(false)
  const [reason, setReason] = useState<ReportReason>('spam')
  const [details, setDetails] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleOpen = () => {
    if (!session?.user) {
      signIn('google', { callbackUrl: window.location.href })
      return
    }
    setShowModal(true)
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      const res = await fetch('/api/moderation/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetType, targetId, reason, details: details.trim() || undefined })
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Failed to submit report')
      } else {
        toast.success('Report submitted. Thank you for keeping Chapturs safe.')
        setShowModal(false)
        setDetails('')
        setReason('spam')
      }
    } catch {
      toast.error('Failed to submit report')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <button
        onClick={handleOpen}
        className={`inline-flex items-center gap-1.5 text-gray-400 hover:text-red-500 transition-colors text-sm ${className}`}
        title="Report"
        aria-label="Report"
      >
        <Flag size={14} />
        {label && <span>{label}</span>}
      </button>

      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={(e) => e.target === e.currentTarget && setShowModal(false)}
        >
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Report Content</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Select a reason for reporting this {targetType}.
            </p>

            <div className="space-y-2">
              {(Object.entries(REASON_LABELS) as [ReportReason, string][]).map(([value, label]) => (
                <label key={value} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="report-reason"
                    value={value}
                    checked={reason === value}
                    onChange={() => setReason(value)}
                    className="text-red-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
                </label>
              ))}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Additional details (optional)
              </label>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                maxLength={500}
                rows={3}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white resize-none focus:ring-2 focus:ring-red-500 focus:outline-none"
                placeholder="Describe the issue..."
              />
              <p className="text-xs text-gray-400 text-right">{details.length}/500</p>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                {submitting ? 'Submitting…' : 'Submit Report'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
