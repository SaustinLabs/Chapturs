'use client'

import { useState } from 'react'
import WorldDefinitionForm from './WorldDefinitionForm'
import CanonGraph from './CanonGraph'

interface LivingWorld {
  id: string
  slug: string
  title: string
  description?: string | null
  theBeginning?: string | null
  theEnd?: string | null
  coverImage?: string | null
  status: string
  founderId: string
}

interface CanonEntry {
  id: string
  entryType: string
  title: string
  content: string
  status: string
  sourceWorkId?: string | null
}

interface Props {
  world: LivingWorld
  canonEntries: CanonEntry[]
  councilRole: string | null
}

type Tab = 'overview' | 'canon' | 'contradictions' | 'council'

export default function WritersRoomConsole({ world: initialWorld, canonEntries: initialEntries, councilRole }: Props) {
  const [world, setWorld] = useState(initialWorld)
  const [canonEntries, setCanonEntries] = useState(initialEntries)
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isFounder = councilRole === 'founder'
  const isCouncil = councilRole === 'founder' || councilRole === 'council'

  async function handleWorldUpdate(updates: Partial<LivingWorld>) {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/living-world/${world.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Failed to save')
      }
      const data = await res.json()
      setWorld(data.world)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  async function handleAddCanonEntry(entry: {
    entryType: string
    title: string
    content: string
    sourceWorkId?: string
  }) {
    setError(null)
    try {
      const res = await fetch(`/api/living-world/${world.id}/canon`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Failed to add entry')
      }
      const data = await res.json()
      setCanonEntries((prev) => [...prev, data.entry])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add canon entry')
    }
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'World Overview' },
    { id: 'canon', label: `Canon (${canonEntries.length})` },
    { id: 'contradictions', label: 'Contradictions' },
    { id: 'council', label: 'Council' },
  ]

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Header */}
      <div className="border-b border-gray-800 bg-gray-900 px-6 py-4">
        <div className="mx-auto max-w-6xl flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">{world.title}</h1>
            <p className="text-sm text-gray-400">
              Writers Room
              {councilRole && (
                <span className="ml-2 rounded-full bg-indigo-900 px-2 py-0.5 text-xs text-indigo-300 capitalize">
                  {councilRole}
                </span>
              )}
            </p>
          </div>
          {saving && <span className="text-sm text-gray-400 animate-pulse">Saving…</span>}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-800 bg-gray-900">
        <div className="mx-auto max-w-6xl flex gap-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'border-b-2 border-indigo-400 text-indigo-300'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="mx-auto max-w-6xl mt-4 px-6">
          <div className="rounded-lg bg-red-900/30 border border-red-700 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        </div>
      )}

      {/* Tab content */}
      <div className="mx-auto max-w-6xl px-6 py-8">
        {activeTab === 'overview' && (
          <WorldDefinitionForm
            world={world}
            onSave={handleWorldUpdate}
            canEdit={isCouncil}
            canArchive={isFounder}
          />
        )}

        {activeTab === 'canon' && (
          <CanonGraph
            worldId={world.id}
            entries={canonEntries}
            canAdd={isCouncil}
            onAddEntry={handleAddCanonEntry}
            onEntriesChange={setCanonEntries}
          />
        )}

        {activeTab === 'contradictions' && (
          <ContradictionsPanel worldId={world.id} canResolve={isCouncil} />
        )}

        {activeTab === 'council' && (
          <CouncilPanel worldId={world.id} isFounder={isFounder} />
        )}
      </div>
    </div>
  )
}

// ── Inline sub-panels ─────────────────────────────────────────────────────────

function ContradictionsPanel({ worldId, canResolve }: { worldId: string; canResolve: boolean }) {
  const [flags, setFlags] = useState<{
    id: string
    description: string
    status: string
    createdAt: string
    resolution?: string | null
    canonEntry?: { id: string; title: string } | null
    sourceWork?: { id: string; title: string } | null
  }[]>([])
  const [loaded, setLoaded] = useState(false)
  const [resolving, setResolving] = useState<string | null>(null)
  const [resolution, setResolution] = useState('')

  async function load() {
    const res = await fetch(`/api/living-world/${worldId}/contradictions?status=open`)
    if (res.ok) {
      const data = await res.json()
      setFlags(data.contradictions)
    }
    setLoaded(true)
  }

  if (!loaded) {
    return (
      <div className="text-center py-12">
        <button onClick={load} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500">
          Load Contradictions
        </button>
      </div>
    )
  }

  if (flags.length === 0) {
    return <p className="text-gray-400 text-center py-12">No open contradictions. The lore is consistent ✓</p>
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-white">Open Contradictions</h2>
      {flags.map((flag) => (
        <div key={flag.id} className="rounded-lg border border-gray-700 bg-gray-900 p-4">
          <p className="text-sm text-gray-200">{flag.description}</p>
          {flag.canonEntry && (
            <p className="mt-1 text-xs text-gray-400">Related canon: {flag.canonEntry.title}</p>
          )}
          {flag.sourceWork && (
            <p className="text-xs text-gray-400">Source: {flag.sourceWork.title}</p>
          )}
          {canResolve && resolving === flag.id ? (
            <div className="mt-3 space-y-2">
              <textarea
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                placeholder="Explain how this is resolved…"
                rows={2}
                className="w-full rounded bg-gray-800 border border-gray-600 px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <div className="flex gap-2">
                <button
                  onClick={async () => {
                    if (!resolution.trim()) return
                    const res = await fetch(`/api/living-world/${worldId}/contradictions`, {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ flagId: flag.id, resolution, dismiss: false }),
                    })
                    if (res.ok) setFlags((prev) => prev.filter((f) => f.id !== flag.id))
                    setResolving(null)
                    setResolution('')
                  }}
                  className="rounded bg-green-700 px-3 py-1 text-xs text-white hover:bg-green-600"
                >
                  Resolve
                </button>
                <button
                  onClick={async () => {
                    const res = await fetch(`/api/living-world/${worldId}/contradictions`, {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ flagId: flag.id, resolution: 'Dismissed', dismiss: true }),
                    })
                    if (res.ok) setFlags((prev) => prev.filter((f) => f.id !== flag.id))
                    setResolving(null)
                  }}
                  className="rounded bg-gray-600 px-3 py-1 text-xs text-white hover:bg-gray-500"
                >
                  Dismiss
                </button>
                <button onClick={() => setResolving(null)} className="text-xs text-gray-400 hover:text-gray-200 px-2">
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            canResolve && (
              <button
                onClick={() => setResolving(flag.id)}
                className="mt-2 text-xs text-indigo-400 hover:text-indigo-300"
              >
                Resolve →
              </button>
            )
          )}
        </div>
      ))}
    </div>
  )
}

function CouncilPanel({ worldId, isFounder }: { worldId: string; isFounder: boolean }) {
  const [userId, setUserId] = useState('')
  const [role, setRole] = useState<'council' | 'contributor'>('contributor')
  const [status, setStatus] = useState<'idle' | 'saving' | 'done' | 'error'>('idle')
  const [msg, setMsg] = useState('')

  async function addMember() {
    if (!userId.trim()) return
    setStatus('saving')
    setMsg('')
    const res = await fetch(`/api/living-world/${worldId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'add_member', userId: userId.trim(), memberRole: role }),
    })
    if (res.ok) {
      setStatus('done')
      setMsg('Member added.')
      setUserId('')
    } else {
      const data = await res.json()
      setStatus('error')
      setMsg(data.error ?? 'Failed')
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-white">World Council</h2>
      {isFounder && (
        <div className="rounded-lg border border-gray-700 bg-gray-900 p-4 space-y-3">
          <p className="text-sm font-medium text-gray-200">Add Council Member</p>
          <div className="flex gap-3 flex-wrap">
            <input
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="User ID"
              className="flex-1 min-w-0 rounded bg-gray-800 border border-gray-600 px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as 'council' | 'contributor')}
              className="rounded bg-gray-800 border border-gray-600 px-3 py-2 text-sm text-gray-100 focus:outline-none"
            >
              <option value="council">Council</option>
              <option value="contributor">Contributor</option>
            </select>
            <button
              onClick={addMember}
              disabled={status === 'saving'}
              className="rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
            >
              Add
            </button>
          </div>
          {msg && (
            <p className={`text-xs ${status === 'error' ? 'text-red-400' : 'text-green-400'}`}>{msg}</p>
          )}
        </div>
      )}
      {!isFounder && (
        <p className="text-gray-400 text-sm">Only the world founder can manage council membership.</p>
      )}
    </div>
  )
}
