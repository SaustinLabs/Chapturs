'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { toast } from 'sonner'

// ─── Types ────────────────────────────────────────────────────────────────────

interface WorkSummary {
  id: string
  title: string
  coverImage?: string | null
  status: string
}

interface Volume {
  id: string
  title: string
  description?: string | null
  orderIndex: number
}

interface SeriesWorkEntry {
  id: string
  workId: string
  orderIndex: number
  work: WorkSummary
  volume?: { id: string; title: string } | null
}

interface Series {
  id: string
  title: string
  description?: string | null
  coverImage?: string | null
  status: string
  volumes: Volume[]
  works: SeriesWorkEntry[]
  _count: { works: number }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  ongoing: 'Ongoing',
  completed: 'Completed',
  hiatus: 'Hiatus',
}

const STATUS_COLORS: Record<string, string> = {
  ongoing: 'bg-green-500/20 text-green-400',
  completed: 'bg-blue-500/20 text-blue-400',
  hiatus: 'bg-yellow-500/20 text-yellow-400',
}

// ─── Main Component ───────────────────────────────────────────────────────────

interface SeriesManagerProps {
  authorId: string
}

export default function SeriesManager({ authorId }: SeriesManagerProps) {
  const [series, setSeries] = useState<Series[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Series | null>(null)
  const [creatorWorks, setCreatorWorks] = useState<WorkSummary[]>([])
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editMode, setEditMode] = useState(false)

  // Form state
  const [formTitle, setFormTitle] = useState('')
  const [formDesc, setFormDesc] = useState('')
  const [formStatus, setFormStatus] = useState('ongoing')

  const fetchSeries = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/series?authorId=${authorId}&pageSize=50`)
      if (res.ok) {
        const data = await res.json()
        setSeries(data.series ?? [])
      }
    } finally {
      setLoading(false)
    }
  }, [authorId])

  const fetchCreatorWorks = useCallback(async () => {
    const res = await fetch(`/api/creator/works?limit=100`)
    if (res.ok) {
      const data = await res.json()
      setCreatorWorks(data.works ?? [])
    }
  }, [])

  useEffect(() => {
    fetchSeries()
    fetchCreatorWorks()
  }, [fetchSeries, fetchCreatorWorks])

  // ─── Create series ──────────────────────────────────────────────────────────

  async function handleCreateSeries(e: React.FormEvent) {
    e.preventDefault()
    if (!formTitle.trim()) return

    const res = await fetch('/api/series', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: formTitle, description: formDesc, status: formStatus }),
    })

    if (res.ok) {
      const data = await res.json()
      setSeries((prev) => [data.series, ...prev])
      setFormTitle('')
      setFormDesc('')
      setFormStatus('ongoing')
      setShowCreateForm(false)
      toast.success('Series created')
    } else {
      toast.error('Failed to create series')
    }
  }

  // ─── Update series ──────────────────────────────────────────────────────────

  async function handleUpdateSeries(e: React.FormEvent) {
    e.preventDefault()
    if (!selected) return

    const res = await fetch(`/api/series/${selected.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: formTitle, description: formDesc, status: formStatus }),
    })

    if (res.ok) {
      const data = await res.json()
      setSeries((prev) => prev.map((s) => (s.id === selected.id ? data.series : s)))
      setSelected(data.series)
      setEditMode(false)
      toast.success('Series updated')
    } else {
      toast.error('Failed to update series')
    }
  }

  // ─── Delete series ──────────────────────────────────────────────────────────

  async function handleDeleteSeries(seriesId: string) {
    if (!confirm('Delete this series? Works will not be deleted.')) return

    const res = await fetch(`/api/series/${seriesId}`, { method: 'DELETE' })
    if (res.ok) {
      setSeries((prev) => prev.filter((s) => s.id !== seriesId))
      if (selected?.id === seriesId) setSelected(null)
      toast.success('Series deleted')
    } else {
      toast.error('Failed to delete series')
    }
  }

  // ─── Add work to series ─────────────────────────────────────────────────────

  async function handleAddWork(workId: string) {
    if (!selected) return

    const res = await fetch(`/api/series/${selected.id}/works`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workId }),
    })

    if (res.ok) {
      // Refresh selected series
      const refreshRes = await fetch(`/api/series/${selected.id}`)
      if (refreshRes.ok) {
        const data = await refreshRes.json()
        setSelected(data.series)
        setSeries((prev) => prev.map((s) => (s.id === selected.id ? data.series : s)))
      }
      toast.success('Work added to series')
    } else {
      const data = await res.json()
      toast.error(data.error ?? 'Failed to add work')
    }
  }

  // ─── Remove work from series ────────────────────────────────────────────────

  async function handleRemoveWork(workId: string) {
    if (!selected) return

    const res = await fetch(`/api/series/${selected.id}/works`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workId }),
    })

    if (res.ok) {
      setSelected((prev) =>
        prev ? { ...prev, works: prev.works.filter((w) => w.workId !== workId) } : prev,
      )
      setSeries((prev) =>
        prev.map((s) =>
          s.id === selected.id
            ? { ...s, works: s.works.filter((w) => w.workId !== workId) }
            : s,
        ),
      )
      toast.success('Work removed from series')
    } else {
      toast.error('Failed to remove work')
    }
  }

  // ─── Open edit form ─────────────────────────────────────────────────────────

  function openEditForm(s: Series) {
    setFormTitle(s.title)
    setFormDesc(s.description ?? '')
    setFormStatus(s.status)
    setEditMode(true)
    setShowCreateForm(false)
  }

  const inSeriesIds = new Set(selected?.works.map((w) => w.workId) ?? [])
  const availableToAdd = creatorWorks.filter((w) => !inSeriesIds.has(w.id))

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-full gap-6">
      {/* Left panel — series list */}
      <div className="w-72 flex-shrink-0 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">My Series</h2>
          <button
            onClick={() => {
              setShowCreateForm(true)
              setEditMode(false)
              setFormTitle('')
              setFormDesc('')
              setFormStatus('ongoing')
            }}
            className="text-sm px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition"
          >
            + New
          </button>
        </div>

        {loading ? (
          <div className="text-gray-400 text-sm">Loading…</div>
        ) : series.length === 0 ? (
          <div className="text-gray-400 text-sm">No series yet. Create one to group your works.</div>
        ) : (
          <div className="flex flex-col gap-2 overflow-y-auto max-h-[calc(100vh-200px)]">
            {series.map((s) => (
              <button
                key={s.id}
                onClick={() => {
                  setSelected(s)
                  setEditMode(false)
                  setShowCreateForm(false)
                }}
                className={`text-left p-3 rounded-xl border transition ${
                  selected?.id === s.id
                    ? 'bg-gray-700 border-blue-500'
                    : 'bg-gray-800/50 border-gray-700/50 hover:border-gray-600'
                }`}
              >
                <div className="font-medium text-white text-sm truncate">{s.title}</div>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[s.status] ?? 'bg-gray-500/20 text-gray-400'}`}
                  >
                    {STATUS_LABELS[s.status] ?? s.status}
                  </span>
                  <span className="text-xs text-gray-400">{s._count.works} work{s._count.works !== 1 ? 's' : ''}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Right panel */}
      <div className="flex-1 min-w-0">
        {/* Create form */}
        {showCreateForm && (
          <SeriesForm
            title="Create Series"
            formTitle={formTitle}
            formDesc={formDesc}
            formStatus={formStatus}
            onChangeTitle={setFormTitle}
            onChangeDesc={setFormDesc}
            onChangeStatus={setFormStatus}
            onSubmit={handleCreateSeries}
            onCancel={() => setShowCreateForm(false)}
            submitLabel="Create"
          />
        )}

        {/* Edit form */}
        {selected && editMode && (
          <SeriesForm
            title="Edit Series"
            formTitle={formTitle}
            formDesc={formDesc}
            formStatus={formStatus}
            onChangeTitle={setFormTitle}
            onChangeDesc={setFormDesc}
            onChangeStatus={setFormStatus}
            onSubmit={handleUpdateSeries}
            onCancel={() => setEditMode(false)}
            submitLabel="Save Changes"
          />
        )}

        {/* Series detail */}
        {selected && !editMode && (
          <div className="flex flex-col gap-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-white">{selected.title}</h2>
                {selected.description && (
                  <p className="text-gray-400 text-sm mt-1">{selected.description}</p>
                )}
                <span
                  className={`inline-block mt-2 text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[selected.status] ?? 'bg-gray-500/20 text-gray-400'}`}
                >
                  {STATUS_LABELS[selected.status] ?? selected.status}
                </span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => openEditForm(selected)}
                  className="text-sm px-3 py-1.5 rounded-lg border border-gray-600 hover:border-gray-400 text-gray-300 hover:text-white transition"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteSeries(selected.id)}
                  className="text-sm px-3 py-1.5 rounded-lg border border-red-800 hover:border-red-500 text-red-400 hover:text-red-300 transition"
                >
                  Delete
                </button>
              </div>
            </div>

            {/* Works in series */}
            <div>
              <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide mb-3">
                Works in Series ({selected.works.length})
              </h3>
              {selected.works.length === 0 ? (
                <p className="text-gray-500 text-sm">No works added yet.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {selected.works.map((entry, i) => (
                    <div
                      key={entry.id}
                      className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-xl border border-gray-700/50"
                    >
                      <span className="text-gray-500 text-xs w-5 text-center">{i + 1}</span>
                      {entry.work.coverImage ? (
                        <div className="relative w-8 h-12 flex-shrink-0 rounded overflow-hidden">
                          <Image
                            src={entry.work.coverImage}
                            alt={entry.work.title}
                            fill
                            className="object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-8 h-12 bg-gray-700 rounded flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">{entry.work.title}</p>
                        {entry.volume && (
                          <p className="text-gray-400 text-xs truncate">Vol: {entry.volume.title}</p>
                        )}
                      </div>
                      <button
                        onClick={() => handleRemoveWork(entry.workId)}
                        className="text-xs text-red-400 hover:text-red-300 transition px-2 py-1 rounded hover:bg-red-900/20"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Add works */}
            {availableToAdd.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide mb-3">
                  Add Works
                </h3>
                <div className="flex flex-col gap-2">
                  {availableToAdd.map((w) => (
                    <div
                      key={w.id}
                      className="flex items-center gap-3 p-3 bg-gray-800/30 rounded-xl border border-gray-700/30"
                    >
                      {w.coverImage ? (
                        <div className="relative w-8 h-12 flex-shrink-0 rounded overflow-hidden">
                          <Image src={w.coverImage} alt={w.title} fill className="object-cover" />
                        </div>
                      ) : (
                        <div className="w-8 h-12 bg-gray-700 rounded flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-300 text-sm truncate">{w.title}</p>
                        <p className="text-gray-500 text-xs capitalize">{w.status}</p>
                      </div>
                      <button
                        onClick={() => handleAddWork(w.id)}
                        className="text-xs text-blue-400 hover:text-blue-300 transition px-2 py-1 rounded hover:bg-blue-900/20"
                      >
                        Add
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {!selected && !showCreateForm && (
          <div className="flex items-center justify-center h-48 text-gray-500 text-sm">
            Select a series or create a new one.
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Series Form Sub-component ────────────────────────────────────────────────

interface SeriesFormProps {
  title: string
  formTitle: string
  formDesc: string
  formStatus: string
  onChangeTitle: (v: string) => void
  onChangeDesc: (v: string) => void
  onChangeStatus: (v: string) => void
  onSubmit: (e: React.FormEvent) => void
  onCancel: () => void
  submitLabel: string
}

function SeriesForm({
  title,
  formTitle,
  formDesc,
  formStatus,
  onChangeTitle,
  onChangeDesc,
  onChangeStatus,
  onSubmit,
  onCancel,
  submitLabel,
}: SeriesFormProps) {
  return (
    <form onSubmit={onSubmit} className="bg-gray-800/50 rounded-xl border border-gray-700/50 p-5 mb-6">
      <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
      <div className="flex flex-col gap-4">
        <div>
          <label className="block text-sm text-gray-300 mb-1">Title *</label>
          <input
            value={formTitle}
            onChange={(e) => onChangeTitle(e.target.value)}
            required
            placeholder="Series title"
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-300 mb-1">Description</label>
          <textarea
            value={formDesc}
            onChange={(e) => onChangeDesc(e.target.value)}
            rows={3}
            placeholder="Optional description"
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-300 mb-1">Status</label>
          <select
            value={formStatus}
            onChange={(e) => onChangeStatus(e.target.value)}
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
          >
            <option value="ongoing">Ongoing</option>
            <option value="completed">Completed</option>
            <option value="hiatus">Hiatus</option>
          </select>
        </div>
        <div className="flex gap-3">
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg transition"
          >
            {submitLabel}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-600 hover:border-gray-400 text-gray-300 hover:text-white text-sm rounded-lg transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </form>
  )
}
