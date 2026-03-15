'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Users, UserPlus, Trash2, CheckCircle, Clock, AlertCircle, ChevronDown } from 'lucide-react'

interface Collaborator {
  id: string
  userId: string
  role: string
  revenueShare: number
  status: string
  invitedAt: string
  acceptedAt?: string
  user: {
    id: string
    username: string
    displayName?: string
    avatar?: string
  }
}

export default function WorkCollaboratorsPage() {
  const params = useParams()
  const workId = params.id as string

  const [collaborators, setCollaborators] = useState<Collaborator[]>([])
  const [loading, setLoading] = useState(true)
  const [identity, setIdentity] = useState('')
  const [role, setRole] = useState('editor')
  const [revenueShare, setRevenueShare] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  useEffect(() => {
    if (workId) fetchCollaborators()
  }, [workId])

  const fetchCollaborators = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/works/${workId}/collaborators`)
      if (res.ok) {
        const data = await res.json()
        setCollaborators(data.collaborators || [])
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    setSuccessMsg(null)
    try {
      const res = await fetch(`/api/works/${workId}/collaborators`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identity, role, revenueShare })
      })
      const data = await res.json()
      if (res.ok) {
        setSuccessMsg(`Invitation sent to ${identity}!`)
        setIdentity('')
        setRevenueShare(0)
        fetchCollaborators()
      } else {
        setError(data.error || 'Failed to send invitation')
      }
    } catch (e) {
      setError('An unexpected error occurred')
    } finally {
      setSubmitting(false)
    }
  }

  const statusColors: Record<string, string> = {
    pending: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    active:  'text-green-600 bg-green-50 border-green-200',
    removed: 'text-red-600 bg-red-50 border-red-200',
  }

  const statusIcon = (status: string) => {
    if (status === 'active') return <CheckCircle className="w-3.5 h-3.5" />
    if (status === 'pending') return <Clock className="w-3.5 h-3.5" />
    return <AlertCircle className="w-3.5 h-3.5" />
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 mt-16">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <Users className="w-7 h-7 text-indigo-500" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Collaborators</h1>
          <p className="text-sm text-gray-500">Invite co-authors to share ownership and edit rights</p>
        </div>
      </div>

      {/* Invite Form */}
      <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 mb-8">
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
          <UserPlus className="w-4 h-4 text-indigo-400" /> Invite Collaborator
        </h2>

        <form onSubmit={handleInvite} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Username or Email
            </label>
            <input
              type="text"
              value={identity}
              onChange={e => setIdentity(e.target.value)}
              placeholder="Enter username or email..."
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role</label>
              <div className="relative">
                <select
                  value={role}
                  onChange={e => setRole(e.target.value)}
                  className="w-full appearance-none px-3 py-2 pr-8 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                >
                  <option value="editor">Editor (can edit, cannot publish)</option>
                  <option value="co-owner">Co-Owner (full access)</option>
                  <option value="contributor">Contributor (read-only + comments)</option>
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Revenue Share (%)
              </label>
              <input
                type="number"
                min={0}
                max={100}
                step={5}
                value={revenueShare}
                onChange={e => setRevenueShare(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400">
              {error}
            </div>
          )}
          {successMsg && (
            <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-sm text-green-600 dark:text-green-400 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" /> {successMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || !identity}
            className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg flex items-center justify-center gap-2 transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            {submitting ? 'Sending Invite...' : 'Send Invitation'}
          </button>
        </form>
      </section>

      {/* Current Collaborators */}
      <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Current Collaborators {collaborators.length > 0 && <span className="text-gray-400 font-normal ml-1">({collaborators.length})</span>}
        </h2>

        {loading ? (
          <div className="text-center py-6">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500 mx-auto"></div>
          </div>
        ) : collaborators.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No collaborators yet. Invite someone above!</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {collaborators.map(c => (
              <li
                key={c.id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/40 rounded-lg border border-gray-100 dark:border-gray-700"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-semibold text-sm flex-shrink-0">
                    {(c.user.displayName || c.user.username || '?')[0].toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {c.user.displayName || c.user.username}
                    </p>
                    <p className="text-xs text-gray-500">@{c.user.username} · {c.role} · {c.revenueShare}% revenue</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full border ${statusColors[c.status] || ''}`}>
                    {statusIcon(c.status)}
                    {c.status}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
