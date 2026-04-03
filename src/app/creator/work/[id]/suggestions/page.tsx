'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import AppLayout from '@/components/AppLayout'
import { useUser } from '@/hooks/useUser'
import { useToast } from '@/components/ui/Toast'
import { EditSuggestionCard, EditSuggestion } from '@/components/EditSuggestionModal'
import { ChevronLeftIcon } from '@heroicons/react/24/outline'
import { Edit3, Globe, Clock, CheckCircle, XCircle } from 'lucide-react'

interface TranslationSuggestion {
  id: string
  workId: string
  sectionId: string
  blockId: string
  sentenceId: string
  language: string
  originalText: string
  suggestedText: string
  reason?: string
  userId: string
  votes: number
  status: string
  createdAt: string
}

type Tab = 'edit' | 'translation'

export default function SuggestionsInboxPage() {
  const params = useParams()
  const router = useRouter()
  const { userId, isAuthenticated, isLoading: userLoading } = useUser()
  const { toast } = useToast()
  const workId = params?.id as string

  const [activeTab, setActiveTab] = useState<Tab>('edit')
  const [loading, setLoading] = useState(true)
  const [editSuggestions, setEditSuggestions] = useState<EditSuggestion[]>([])
  const [translationSuggestions, setTranslationSuggestions] = useState<TranslationSuggestion[]>([])
  const [statusFilter, setStatusFilter] = useState<'pending' | 'approved' | 'rejected'>('pending')

  const loadEditSuggestions = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/edit-suggestions?workId=${workId}&status=${statusFilter}`
      )
      if (response.ok) {
        const data = await response.json()
        setEditSuggestions(data.suggestions || [])
      } else {
        toast.error('Failed to load edit suggestions')
      }
    } catch {
      toast.error('Failed to load edit suggestions')
    }
  }, [workId, statusFilter, toast])

  const loadTranslationSuggestions = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/translations/suggestions?workId=${workId}&status=${statusFilter}`
      )
      if (response.ok) {
        const data = await response.json()
        setTranslationSuggestions(data.suggestions || [])
      } else {
        toast.error('Failed to load translation suggestions')
      }
    } catch {
      toast.error('Failed to load translation suggestions')
    }
  }, [workId, statusFilter, toast])

  useEffect(() => {
    if (!isAuthenticated || !userId) return
    const load = async () => {
      setLoading(true)
      await Promise.all([loadEditSuggestions(), loadTranslationSuggestions()])
      setLoading(false)
    }
    load()
  }, [isAuthenticated, userId, loadEditSuggestions, loadTranslationSuggestions])

  const handleApprove = async (suggestionId: string) => {
    try {
      const response = await fetch(`/api/edit-suggestions/${suggestionId}/approve`, {
        method: 'POST'
      })
      if (response.ok) {
        toast.success('Suggestion approved')
        loadEditSuggestions()
      } else if (response.status === 403) {
        toast.error('You can only action suggestions for your own works')
      } else {
        toast.error('Failed to approve suggestion')
      }
    } catch {
      toast.error('Failed to approve suggestion')
    }
  }

  const handleReject = async (suggestionId: string) => {
    try {
      const response = await fetch(`/api/edit-suggestions/${suggestionId}/reject`, {
        method: 'POST'
      })
      if (response.ok) {
        toast.success('Suggestion rejected')
        loadEditSuggestions()
      } else if (response.status === 403) {
        toast.error('You can only action suggestions for your own works')
      } else {
        toast.error('Failed to reject suggestion')
      }
    } catch {
      toast.error('Failed to reject suggestion')
    }
  }

  if (userLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      </AppLayout>
    )
  }

  const pendingEditCount = editSuggestions.filter(s => s.status === 'pending').length
  const pendingTranslationCount = translationSuggestions.filter(s => s.status === 'pending').length

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Back nav */}
        <button
          onClick={() => router.push(`/creator/work/${workId}/edit`)}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 mb-6"
        >
          <ChevronLeftIcon className="w-4 h-4" />
          Back to Work
        </button>

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Suggestions Inbox</h1>
          {(pendingEditCount + pendingTranslationCount) > 0 && (
            <span className="px-3 py-1 text-sm font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full">
              {pendingEditCount + pendingTranslationCount} pending
            </span>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('edit')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'edit'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-600 hover:text-gray-900 dark:text-gray-400'
            }`}
          >
            <Edit3 size={16} />
            Edit Suggestions
            {pendingEditCount > 0 && (
              <span className="px-1.5 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">{pendingEditCount}</span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('translation')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'translation'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-600 hover:text-gray-900 dark:text-gray-400'
            }`}
          >
            <Globe size={16} />
            Translation Suggestions
            {pendingTranslationCount > 0 && (
              <span className="px-1.5 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">{pendingTranslationCount}</span>
            )}
          </button>
        </div>

        {/* Status filter */}
        <div className="flex gap-2 mb-6">
          {(['pending', 'approved', 'rejected'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-full border transition-colors ${
                statusFilter === s
                  ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-transparent'
                  : 'border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-gray-500'
              }`}
            >
              {s === 'pending' && <Clock size={13} />}
              {s === 'approved' && <CheckCircle size={13} />}
              {s === 'rejected' && <XCircle size={13} />}
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(n => (
              <div key={n} className="h-28 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
            ))}
          </div>
        ) : activeTab === 'edit' ? (
          editSuggestions.length === 0 ? (
            <div className="text-center py-16 text-gray-500 dark:text-gray-400">
              <Edit3 size={40} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">No {statusFilter} edit suggestions</p>
            </div>
          ) : (
            <div className="space-y-4">
              {editSuggestions.map(suggestion => (
                <EditSuggestionCard
                  key={suggestion.id}
                  suggestion={suggestion}
                  onApprove={statusFilter === 'pending' ? handleApprove : undefined}
                  onReject={statusFilter === 'pending' ? handleReject : undefined}
                  isAuthor
                  showActions={statusFilter === 'pending'}
                />
              ))}
            </div>
          )
        ) : (
          translationSuggestions.length === 0 ? (
            <div className="text-center py-16 text-gray-500 dark:text-gray-400">
              <Globe size={40} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">No {statusFilter} translation suggestions</p>
            </div>
          ) : (
            <div className="space-y-4">
              {translationSuggestions.map(s => (
                <div
                  key={s.id}
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5"
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex items-center gap-2">
                      <Globe size={15} className="text-blue-500 flex-shrink-0" />
                      <span className="text-xs font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400">
                        {s.language}
                      </span>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      s.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      s.status === 'approved' ? 'bg-green-100 text-green-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {s.status}
                    </span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="p-2 bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700">
                      <div className="text-xs text-gray-500 mb-0.5">Original</div>
                      <div className="text-gray-800 dark:text-gray-200">{s.originalText}</div>
                    </div>
                    <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
                      <div className="text-xs text-blue-600 dark:text-blue-400 mb-0.5">Suggested</div>
                      <div className="text-gray-900 dark:text-gray-100 font-medium">{s.suggestedText}</div>
                    </div>
                    {s.reason && (
                      <p className="text-xs text-gray-500 italic">{s.reason}</p>
                    )}
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs text-gray-400">
                      {s.votes} vote{s.votes !== 1 ? 's' : ''} · {new Date(s.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </AppLayout>
  )
}
