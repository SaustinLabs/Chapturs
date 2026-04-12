'use client'

import { useState, useEffect } from 'react'
import { 
  CheckCircleIcon, 
  ExclamationCircleIcon, 
  InformationCircleIcon,
  SparklesIcon,
  ShieldCheckIcon,
  ClockIcon
} from '@heroicons/react/24/outline'

interface CheckResult {
  id: string
  label: string
  status: 'pass' | 'fail' | 'warn'
  message: string
}

interface PrePublishChecklistProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (scheduledDate?: string) => void
  isScheduling: boolean
  document: any
  workId: string
}

export default function PrePublishChecklist({
  isOpen,
  onClose,
  onConfirm,
  isScheduling,
  document,
  workId
}: PrePublishChecklistProps) {
  const [checks, setChecks] = useState<CheckResult[]>([])
  const [loading, setLoading] = useState(true)
  const [scheduledDate, setScheduledDate] = useState('')

  useEffect(() => {
    if (!isOpen) return

    const runChecks = async () => {
      setLoading(true)
      const results: CheckResult[] = []

      // Client-side checks
      const wordCount = document.metadata.wordCount || 0
      results.push({
        id: 'length',
        label: 'Minimum Length',
        status: wordCount > 500 ? 'pass' : wordCount >= 100 ? 'warn' : 'fail',
        message: wordCount > 500 ? 'Good length!' : wordCount >= 100 ? 'This chapter is quite short.' : `Only ${wordCount} words. Need at least 100.`
      })

      if (!document.metadata.title) {
        results.push({
          id: 'title',
          label: 'Chapter Title',
          status: 'fail',
          message: 'Please provide a title for this chapter.'
        })
      } else {
        results.push({
          id: 'title',
          label: 'Chapter Title',
          status: 'pass',
          message: 'Title looks good.'
        })
      }

      // Server-side validation checks
      try {
        const resp = await fetch(`/api/works/${workId}/validate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        })
        if (resp.ok) {
          const data = await resp.json()
          // Merge server checks, skipping duplicates (title/length already checked client-side)
          for (const check of data.checks) {
            if (check.id === 'length' || check.id === 'title') continue
            results.push({
              id: check.id,
              label: check.label,
              status: check.status,
              message: check.message
            })
          }
        }
      } catch (e) {
        results.push({
          id: 'server-check',
          label: 'Server Checks',
          status: 'warn',
          message: 'Could not reach validation service. Will retry on publish.'
        })
      }

      setChecks(results)
      setLoading(false)
    }

    runChecks()
  }, [isOpen, document, workId])

  if (!isOpen) return null

  const canProceed = !checks.some(c => c.status === 'fail') && (!isScheduling || scheduledDate)

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in duration-200">
        <div className="p-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-3">
              <ShieldCheckIcon className="w-8 h-8 text-blue-600" />
              {isScheduling ? 'Schedule Publish' : 'Ready to Publish?'}
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
              <InformationCircleIcon className="w-6 h-6" />
            </button>
          </div>

          {loading ? (
            <div className="py-12 flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="space-y-4 mb-8">
              {checks.map(check => (
                <div key={check.id} className="flex items-start gap-4 p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700">
                  <div className="mt-0.5">
                    {check.status === 'pass' && <CheckCircleIcon className="w-6 h-6 text-green-500" />}
                    {check.status === 'warn' && <ExclamationCircleIcon className="w-6 h-6 text-orange-500" />}
                    {check.status === 'fail' && <ExclamationCircleIcon className="w-6 h-6 text-red-500" />}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 dark:text-white leading-tight">{check.label}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{check.message}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {isScheduling && (
            <div className="mb-8">
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Release Date & Time</label>
              <div className="relative">
                <ClockIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="datetime-local"
                  required
                  className="w-full pl-12 pr-4 py-3 bg-gray-100 dark:bg-gray-800 rounded-2xl border-none focus:ring-2 focus:ring-blue-600 transition-all text-sm font-bold dark:text-white"
                  value={scheduledDate}
                  onChange={e => setScheduledDate(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="flex gap-4">
            <button
              onClick={onClose}
              className="flex-1 py-4 text-gray-500 font-bold hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              disabled={!canProceed || loading}
              onClick={() => onConfirm(isScheduling ? scheduledDate : undefined)}
              className="flex-[2] py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-2xl font-black text-lg hover:scale-[1.02] transition active:scale-95 disabled:opacity-20 disabled:cursor-not-allowed shadow-xl shadow-blue-500/10"
            >
              {isScheduling ? 'Set Schedule' : 'Publish Content'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
