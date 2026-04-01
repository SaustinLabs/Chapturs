'use client'

import { useState, useEffect } from 'react'
import { CheckCircleIcon, XCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'

interface ModerationItem {
  id: string
  workId?: string
  sectionId?: string
  priority: string
  reason: string
  status: string
  assignedTo?: string | null
  assignedAt?: string | null
  assignee?: {
    id: string
    displayName?: string | null
    username: string
  } | null
  createdAt: string
  work?: {
    id: string
    title: string
    description: string
    author: {
      displayName: string
      username: string
    }
    sections: Array<{
      id: string
      title: string
      content: string
      wordCount: number
    }>
  }
  section?: {
    id: string
    title: string
    content: string
    wordCount: number
    work: {
      title: string
      author: {
        displayName: string
        username: string
      }
    }
  }
}

interface ValidationResult {
  id: string
  validationType: string
  status: string
  score?: number
  details: string
  createdAt: string
}

export default function ModerationDashboard() {
  const [queue, setQueue] = useState<ModerationItem[]>([])
  const [selectedItem, setSelectedItem] = useState<ModerationItem | null>(null)
  const [validations, setValidations] = useState<ValidationResult[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string>('')
  const [currentUserRole, setCurrentUserRole] = useState<string>('')
  const [claimTimeoutMinutes, setClaimTimeoutMinutes] = useState<number>(20)
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    loadModerationQueue()
  }, [])

  const loadModerationQueue = async () => {
    try {
      const response = await fetch('/api/moderation/queue')
      if (response.ok) {
        const data = await response.json()
        setQueue(data.items || [])
        setCurrentUserId(data.currentUserId || '')
        setCurrentUserRole(data.currentUserRole || '')
        setClaimTimeoutMinutes(data.claimTimeoutMinutes || 20)
      }
    } catch (error) {
      console.error('Failed to load moderation queue:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadItemDetails = async (itemId: string) => {
    try {
      const response = await fetch(`/api/moderation/queue/${itemId}`)
      if (response.ok) {
        const data = await response.json()
        setSelectedItem(data.moderationItem)
        setValidations(data.validations || [])
      }
    } catch (error) {
      console.error('Failed to load item details:', error)
    }
  }

  const handleModerationAction = async (itemId: string, action: 'approve' | 'reject' | 'flag' | 'claim' | 'release', notes?: string) => {
    setProcessing(true)
    setStatusMessage(null)
    try {
      const response = await fetch(`/api/moderation/queue/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, notes })
      })

      if (response.ok) {
        // Refresh the queue
        await loadModerationQueue()
        if (['approve', 'reject', 'flag'].includes(action)) {
          setSelectedItem(null)
          setValidations([])
        } else {
          await loadItemDetails(itemId)
        }
        setStatusMessage({
          type: 'success',
          text: action === 'claim'
            ? 'Item claimed for review.'
            : action === 'release'
              ? 'Item released back to queue.'
              : `Item ${action}d successfully.`,
        })
      } else {
        const error = await response.json()
        setStatusMessage({ type: 'error', text: `Failed to ${action}: ${error.error || 'Unknown error'}` })
      }
    } catch (error) {
      console.error(`Failed to ${action} item:`, error)
      setStatusMessage({ type: 'error', text: `Failed to ${action} item.` })
    } finally {
      setProcessing(false)
    }
  }

  const getPreviewText = (rawContent: string) => {
    if (!rawContent) return ''
    try {
      const parsed = JSON.parse(rawContent)
      if (parsed?.text && typeof parsed.text === 'string') {
        return parsed.text
      }
      return rawContent
    } catch {
      return rawContent
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800'
      case 'high': return 'bg-orange-100 text-orange-800'
      case 'normal': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      case 'in_review': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const canResolveSelected = Boolean(
    selectedItem && (
      currentUserRole === 'admin' ||
      selectedItem.assignedTo === currentUserId
    )
  )

  const isSelectedAssignedToCurrentUser = Boolean(selectedItem && selectedItem.assignedTo === currentUserId)
  const isSelectedUnassigned = Boolean(selectedItem && !selectedItem.assignedTo)

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Content Moderation</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Review and moderate user-generated content
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Claimed items auto-release after {claimTimeoutMinutes} minutes of inactivity.
        </p>
        {statusMessage && (
          <div
            className={`mt-3 rounded-lg px-4 py-2 text-sm ${
              statusMessage.type === 'success'
                ? 'bg-green-50 border border-green-200 text-green-700'
                : 'bg-red-50 border border-red-200 text-red-700'
            }`}
          >
            {statusMessage.text}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Moderation Queue */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Moderation Queue ({queue.length})
              </h2>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {queue.length === 0 ? (
                <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                  No items in queue
                </div>
              ) : (
                queue.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => loadItemDetails(item.id)}
                    className={`p-4 border-b border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 ${
                      selectedItem?.id === item.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(item.priority)}`}>
                            {item.priority}
                          </span>
                          <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(item.status)}`}>
                            {item.status}
                          </span>
                        </div>
                        <h3 className="font-medium text-gray-900 dark:text-white text-sm">
                          {item.work?.title || item.section?.title}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {item.work?.author?.displayName || item.section?.work?.author?.displayName}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {item.assignee
                            ? `Assigned: ${item.assignee.displayName || item.assignee.username}`
                            : 'Unassigned'}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Content Review */}
        <div className="lg:col-span-2">
          {selectedItem ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Content Review
                  </h2>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mr-3">
                    {selectedItem.assignee
                      ? `Assigned to ${selectedItem.assignee.displayName || selectedItem.assignee.username}`
                      : 'Unassigned'}
                  </div>
                  <div className="flex space-x-2">
                    {(isSelectedUnassigned || !isSelectedAssignedToCurrentUser) && (
                      <button
                        onClick={() => handleModerationAction(selectedItem.id, 'claim')}
                        disabled={processing}
                        className="px-3 py-1 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700 disabled:opacity-50"
                      >
                        Claim
                      </button>
                    )}
                    {isSelectedAssignedToCurrentUser && (
                      <button
                        onClick={() => handleModerationAction(selectedItem.id, 'release')}
                        disabled={processing}
                        className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 disabled:opacity-50"
                      >
                        Release
                      </button>
                    )}
                    <button
                      onClick={() => handleModerationAction(selectedItem.id, 'approve')}
                      disabled={processing || !canResolveSelected}
                      className="flex items-center space-x-2 px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50"
                    >
                      <CheckCircleIcon className="w-4 h-4" />
                      <span>Approve</span>
                    </button>
                    <button
                      onClick={() => handleModerationAction(selectedItem.id, 'reject')}
                      disabled={processing || !canResolveSelected}
                      className="flex items-center space-x-2 px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50"
                    >
                      <XCircleIcon className="w-4 h-4" />
                      <span>Reject</span>
                    </button>
                    <button
                      onClick={() => handleModerationAction(selectedItem.id, 'flag')}
                      disabled={processing || !canResolveSelected}
                      className="flex items-center space-x-2 px-3 py-1 bg-yellow-600 text-white text-sm rounded hover:bg-yellow-700 disabled:opacity-50"
                    >
                      <ExclamationTriangleIcon className="w-4 h-4" />
                      <span>Flag</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-4">
                {/* Content Details */}
                <div className="mb-6">
                  <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                    {selectedItem.work?.title || selectedItem.section?.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    By: {selectedItem.work?.author?.displayName || selectedItem.section?.work?.author?.displayName}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-500">
                    Reason: {selectedItem.reason}
                  </p>
                </div>

                {/* Validation Results */}
                {validations.length > 0 && (
                  <div className="mb-6">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-3">Validation Results</h4>
                    <div className="space-y-2">
                      {validations.map((validation) => (
                        <div key={validation.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded">
                          <div>
                            <span className="font-medium text-sm capitalize">{validation.validationType}</span>
                            <span className={`ml-2 px-2 py-1 text-xs rounded ${
                              validation.status === 'passed' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {validation.status}
                            </span>
                            {validation.score && (
                              <span className="ml-2 text-xs text-gray-500">
                                Score: {(validation.score * 100).toFixed(0)}%
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Content Preview */}
                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3">Content Preview</h4>
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded max-h-96 overflow-y-auto">
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      {selectedItem.work?.description && (
                        <div className="mb-4">
                          <h5 className="font-medium mb-2">Description:</h5>
                          <p>{selectedItem.work.description}</p>
                        </div>
                      )}
                      {selectedItem.section?.content && (
                        <div>
                          <h5 className="font-medium mb-2">Content:</h5>
                          <div className="whitespace-pre-wrap text-sm">
                            {getPreviewText(selectedItem.section.content)}
                          </div>
                        </div>
                      )}
                      {selectedItem.work?.sections?.[0]?.content && (
                        <div>
                          <h5 className="font-medium mb-2">First Chapter:</h5>
                          <div className="whitespace-pre-wrap text-sm">
                            {getPreviewText(selectedItem.work.sections[0].content)}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
              <p className="text-gray-500 dark:text-gray-400">
                Select an item from the queue to review
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}