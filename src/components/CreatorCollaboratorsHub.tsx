'use client'

import { FormEvent, useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import {
  TrashIcon,
  UserPlusIcon,
} from '@heroicons/react/24/outline'
import { useToast } from '@/components/ui/Toast'

interface Collaborator {
  id: string
  userId: string
  role: string
  status: string
  user: {
    id: string
    username: string
    displayName?: string | null
    avatar?: string | null
  }
}

type CollaboratorResponse = {
  collaborators?: Collaborator[]
  data?: {
    collaborators?: Collaborator[]
    collaborator?: Collaborator
  }
}

const roles = ['editor', 'proofreader', 'co-author'] as const
const HANDSHAKE_EMOJI = String.fromCodePoint(0x1f91d)

export default function CreatorCollaboratorsHub() {
  const params = useParams()
  const { toast } = useToast()
  const workId = params?.id as string

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [collaborators, setCollaborators] = useState<Collaborator[]>([])
  const [username, setUsername] = useState('')
  const [role, setRole] = useState<(typeof roles)[number]>('editor')

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError(null)

      try {
        const response = await fetch(`/api/works/${workId}/collaborators`)

        if (!response.ok) {
          throw new Error('Failed to fetch collaborators.')
        }

        const data: CollaboratorResponse = await response.json()
        const nextCollaborators = data.data?.collaborators ?? data.collaborators

        if (!Array.isArray(nextCollaborators)) {
          console.log('Unexpected collaborators response:', data)
          throw new Error('Unexpected collaborators response.')
        }

        setCollaborators(nextCollaborators)
      } catch (err) {
        console.error(err)
        setError(err instanceof Error ? err.message : 'Failed to load collaborators.')
      } finally {
        setLoading(false)
      }
    }

    if (workId) {
      load()
    }
  }, [workId])

  const handleAddCollaborator = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitting(true)

    try {
      const response = await fetch(`/api/works/${workId}/collaborators`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          identity: username,
          role,
        }),
      })

      const data: CollaboratorResponse & { error?: string } = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add collaborator.')
      }

      const createdCollaborator = data.data?.collaborator

      if (!createdCollaborator) {
        console.log('Unexpected collaborator creation response:', data)
        throw new Error('Unexpected collaborator creation response.')
      }

      setCollaborators((current) => [createdCollaborator, ...current])
      setUsername('')
      setRole('editor')
      toast.success('Collaborator added successfully.')
    } catch (err) {
      console.error(err)
      toast.error(err instanceof Error ? err.message : 'Failed to add collaborator.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteCollaborator = async (userId: string) => {
    setRemovingId(userId)

    try {
      const response = await fetch(`/api/works/${workId}/collaborators`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => null)
        if (data && typeof data === 'object' && 'error' in data) {
          throw new Error(String(data.error))
        }

        console.log('Unexpected collaborator delete response:', data)
        throw new Error('Failed to remove collaborator.')
      }

      setCollaborators((current) => current.filter((collaborator) => collaborator.userId !== userId))
      toast.success('Collaborator removed successfully.')
    } catch (err) {
      console.error(err)
      toast.error(err instanceof Error ? err.message : 'Failed to remove collaborator.')
    } finally {
      setRemovingId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    )
  }

  if (error) {
    return <div className="text-red-400 text-center py-8">{error}</div>
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Collaborators</h1>
        <p className="mt-2 text-gray-400">
          Invite editors, proofreaders, and co-authors to contribute to this work.
        </p>
      </div>

      <div className="rounded-2xl border border-gray-700 bg-gray-800 p-6">
        <h2 className="text-lg font-semibold text-white">Add Collaborator</h2>
        <form className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-[1fr,200px,auto]" onSubmit={handleAddCollaborator}>
          <input
            type="text"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="Enter username"
            className="rounded-xl border border-gray-700 bg-gray-900 px-4 py-3 text-white placeholder:text-gray-500 focus:border-blue-500 focus:outline-none"
            required
          />
          <select
            value={role}
            onChange={(event) => setRole(event.target.value as (typeof roles)[number])}
            className="rounded-xl border border-gray-700 bg-gray-900 px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
          >
            {roles.map((roleOption) => (
              <option key={roleOption} value={roleOption}>
                {formatRole(roleOption)}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <UserPlusIcon className="h-5 w-5" />
            Add
          </button>
        </form>
      </div>

      <div className="rounded-2xl border border-gray-700 bg-gray-800">
        <div className="border-b border-gray-700 px-6 py-5">
          <h2 className="text-lg font-semibold text-white">Current Collaborators</h2>
        </div>

        {collaborators.length === 0 ? (
          <EmptyState
            emoji={HANDSHAKE_EMOJI}
            title="No collaborators yet"
            description="Invite someone to start sharing editing and review work."
          />
        ) : (
          <div className="divide-y divide-gray-700">
            {collaborators.map((collaborator) => (
              <div
                key={collaborator.id}
                className="flex flex-col gap-4 px-6 py-5 md:flex-row md:items-center md:justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-900 text-sm font-semibold text-white">
                    {getInitials(collaborator.user.displayName || collaborator.user.username)}
                  </div>
                  <div>
                    <div className="text-base font-semibold text-white">
                      {collaborator.user.displayName || collaborator.user.username}
                    </div>
                    <div className="text-sm text-gray-400">@{collaborator.user.username}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className={roleBadgeClass(collaborator.role)}>
                    {formatRole(collaborator.role)}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDeleteCollaborator(collaborator.userId)}
                    disabled={removingId === collaborator.userId}
                    className="inline-flex items-center justify-center rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-red-300 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label={`Remove ${collaborator.user.username}`}
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function formatRole(role: string) {
  return role
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function getInitials(value: string) {
  return value
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

function roleBadgeClass(role: string) {
  if (role === 'editor') {
    return 'inline-flex items-center rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-300'
  }

  if (role === 'proofreader') {
    return 'inline-flex items-center rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-300'
  }

  return 'inline-flex items-center rounded-full border border-purple-500/20 bg-purple-500/10 px-3 py-1 text-xs font-semibold text-purple-300'
}

function EmptyState({
  emoji,
  title,
  description,
}: {
  emoji: string
  title: string
  description: string
}) {
  return (
    <div className="py-16 text-center">
      <div className="text-4xl">{emoji}</div>
      <h3 className="mt-4 text-xl font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm text-gray-400">{description}</p>
    </div>
  )
}
