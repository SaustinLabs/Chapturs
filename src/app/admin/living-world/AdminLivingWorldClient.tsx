'use client'

import { useState } from 'react'
import Link from 'next/link'

interface AdminWorld {
  id: string
  slug: string
  title: string
  status: string
  createdAt: string
  founder: { username: string; displayName?: string | null }
  _count: {
    works: number
    canonEntries: number
    contradictions: number
    councilMembers: number
  }
}

interface Contradiction {
  id: string
  description: string
  severity: string
  status: string
  createdAt: string
  world: { id: string; title: string; slug: string }
  flaggedWork?: { id: string; title: string } | null
  flaggedSection?: { id: string; title: string } | null
}

interface Props {
  worlds: AdminWorld[]
  openContradictions: Contradiction[]
}

const STATUS_BADGE: Record<string, string> = {
  active: 'bg-green-900 text-green-300',
  archived: 'bg-gray-800 text-gray-400',
  draft: 'bg-yellow-900 text-yellow-300',
}

const SEVERITY_BADGE: Record<string, string> = {
  low: 'bg-gray-800 text-gray-400',
  medium: 'bg-yellow-900 text-yellow-300',
  high: 'bg-red-900 text-red-300',
  critical: 'bg-red-700 text-red-100',
}

export default function AdminLivingWorldClient({ worlds, openContradictions }: Props) {
  const [activeTab, setActiveTab] = useState<'worlds' | 'contradictions'>('worlds')
  const [search, setSearch] = useState('')

  const filteredWorlds = worlds.filter(
    (w) =>
      !search ||
      w.title.toLowerCase().includes(search.toLowerCase()) ||
      w.founder.username.toLowerCase().includes(search.toLowerCase()),
  )

  const updateWorldStatus = async (worldId: string, status: string) => {
    await fetch(`/api/living-world/${worldId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    window.location.reload()
  }

  const resolveContradiction = async (id: string, worldId: string) => {
    await fetch(`/api/living-world/${worldId}/contradictions`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: 'resolved', resolutionNote: 'Resolved by admin' }),
    })
    window.location.reload()
  }

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-1">Living Worlds Admin</h1>
          <p className="text-gray-400 text-sm">
            Manage shared universe worlds, contradiction flags, and council memberships.
          </p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="rounded-xl bg-gray-900 border border-gray-800 p-4 text-center">
            <p className="text-2xl font-bold text-white">{worlds.length}</p>
            <p className="text-xs text-gray-400 mt-1">Total Worlds</p>
          </div>
          <div className="rounded-xl bg-gray-900 border border-gray-800 p-4 text-center">
            <p className="text-2xl font-bold text-white">{worlds.filter((w) => w.status === 'active').length}</p>
            <p className="text-xs text-gray-400 mt-1">Active</p>
          </div>
          <div className="rounded-xl bg-gray-900 border border-gray-800 p-4 text-center">
            <p className="text-2xl font-bold text-red-400">{openContradictions.length}</p>
            <p className="text-xs text-gray-400 mt-1">Open Contradictions</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-800 mb-6">
          <button
            onClick={() => setActiveTab('worlds')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'worlds' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-gray-500 hover:text-gray-300'
            }`}
          >
            Worlds ({worlds.length})
          </button>
          <button
            onClick={() => setActiveTab('contradictions')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'contradictions' ? 'border-red-500 text-red-400' : 'border-transparent text-gray-500 hover:text-gray-300'
            }`}
          >
            Open Contradictions ({openContradictions.length})
          </button>
        </div>

        {activeTab === 'worlds' && (
          <>
            <div className="mb-4">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search worlds…"
                className="w-full max-w-sm rounded-lg bg-gray-800 border border-gray-700 px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="overflow-x-auto rounded-xl border border-gray-800">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800 bg-gray-900/60">
                    <th className="text-left px-4 py-3 text-gray-400 font-medium">World</th>
                    <th className="text-left px-4 py-3 text-gray-400 font-medium">Founder</th>
                    <th className="text-center px-4 py-3 text-gray-400 font-medium">Works</th>
                    <th className="text-center px-4 py-3 text-gray-400 font-medium">Canon</th>
                    <th className="text-center px-4 py-3 text-gray-400 font-medium">Flags</th>
                    <th className="text-center px-4 py-3 text-gray-400 font-medium">Council</th>
                    <th className="text-left px-4 py-3 text-gray-400 font-medium">Status</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {filteredWorlds.map((w) => (
                    <tr key={w.id} className="border-b border-gray-800 hover:bg-gray-900/40 transition-colors">
                      <td className="px-4 py-3">
                        <Link
                          href={`/worlds/${w.slug}`}
                          target="_blank"
                          className="font-medium text-gray-100 hover:text-indigo-400"
                        >
                          {w.title}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-gray-400">{w.founder.displayName ?? w.founder.username}</td>
                      <td className="px-4 py-3 text-center text-gray-300">{w._count.works}</td>
                      <td className="px-4 py-3 text-center text-gray-300">{w._count.canonEntries}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={w._count.contradictions > 0 ? 'text-red-400 font-medium' : 'text-gray-500'}>
                          {w._count.contradictions}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-gray-300">{w._count.councilMembers}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[w.status] ?? 'bg-gray-800 text-gray-400'}`}>
                          {w.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2 justify-end">
                          <Link
                            href={`/creator/living-world/${w.id}`}
                            className="text-xs text-indigo-400 hover:text-indigo-300"
                          >
                            Writers Room
                          </Link>
                          {w.status === 'active' ? (
                            <button
                              onClick={() => updateWorldStatus(w.id, 'archived')}
                              className="text-xs text-red-400 hover:text-red-300"
                            >
                              Archive
                            </button>
                          ) : w.status === 'archived' ? (
                            <button
                              onClick={() => updateWorldStatus(w.id, 'active')}
                              className="text-xs text-green-400 hover:text-green-300"
                            >
                              Restore
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredWorlds.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-gray-500 text-sm">
                        No worlds found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {activeTab === 'contradictions' && (
          <div className="space-y-3">
            {openContradictions.length === 0 ? (
              <p className="text-center text-gray-500 text-sm py-8">No open contradiction flags.</p>
            ) : (
              openContradictions.map((c) => (
                <div
                  key={c.id}
                  className="rounded-xl border border-gray-800 bg-gray-900 p-4 flex items-start justify-between gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${SEVERITY_BADGE[c.severity] ?? 'bg-gray-800 text-gray-400'}`}>
                        {c.severity}
                      </span>
                      <Link
                        href={`/worlds/${c.world.slug}`}
                        target="_blank"
                        className="text-xs text-indigo-400 hover:text-indigo-300"
                      >
                        {c.world.title}
                      </Link>
                      {c.flaggedWork && (
                        <Link
                          href={`/story/${c.flaggedWork.id}`}
                          target="_blank"
                          className="text-xs text-gray-500 hover:text-gray-300"
                        >
                          in {c.flaggedWork.title}
                        </Link>
                      )}
                    </div>
                    <p className="text-sm text-gray-300">{c.description}</p>
                    <p className="text-xs text-gray-600 mt-1">{new Date(c.createdAt).toLocaleDateString()}</p>
                  </div>
                  <button
                    onClick={() => resolveContradiction(c.id, c.world.id)}
                    className="flex-shrink-0 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs px-3 py-1.5 transition-colors"
                  >
                    Resolve
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
