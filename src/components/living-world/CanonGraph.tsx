'use client'

import { useState } from 'react'

interface CanonEntry {
  id: string
  entryType: string
  title: string
  content: string
  status: string
  sourceWorkId?: string | null
}

interface Props {
  worldId: string
  entries: CanonEntry[]
  canAdd: boolean
  onAddEntry: (entry: { entryType: string; title: string; content: string; sourceWorkId?: string }) => Promise<void>
  onEntriesChange: (entries: CanonEntry[]) => void
}

const ENTRY_TYPES = ['fact', 'event', 'location', 'rule', 'character_fact'] as const
const TYPE_LABELS: Record<string, string> = {
  fact: 'Fact',
  event: 'Event',
  location: 'Location',
  rule: 'Rule',
  character_fact: 'Character Fact',
}
const TYPE_COLORS: Record<string, string> = {
  fact: 'bg-blue-900 text-blue-200 border-blue-700',
  event: 'bg-amber-900 text-amber-200 border-amber-700',
  location: 'bg-green-900 text-green-200 border-green-700',
  rule: 'bg-purple-900 text-purple-200 border-purple-700',
  character_fact: 'bg-rose-900 text-rose-200 border-rose-700',
}
const STATUS_COLORS: Record<string, string> = {
  proposed: 'text-yellow-400',
  canon: 'text-green-400',
  disputed: 'text-orange-400',
  retconned: 'text-gray-500 line-through',
}

type FilterType = 'all' | typeof ENTRY_TYPES[number]

export default function CanonGraph({ worldId, entries, canAdd, onAddEntry }: Props) {
  const [filter, setFilter] = useState<FilterType>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showAddForm, setShowAddForm] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [addForm, setAddForm] = useState({
    entryType: 'fact' as typeof ENTRY_TYPES[number],
    title: '',
    content: '',
    sourceWorkId: '',
  })

  const filtered = entries.filter((e) => {
    if (filter !== 'all' && e.entryType !== filter) return false
    if (statusFilter !== 'all' && e.status !== statusFilter) return false
    return true
  })

  async function handleAdd() {
    if (!addForm.title.trim() || !addForm.content.trim()) return
    setAdding(true)
    await onAddEntry({
      entryType: addForm.entryType,
      title: addForm.title.trim(),
      content: addForm.content.trim(),
      sourceWorkId: addForm.sourceWorkId.trim() || undefined,
    })
    setAdding(false)
    setShowAddForm(false)
    setAddForm({ entryType: 'fact', title: '', content: '', sourceWorkId: '' })
  }

  const grouped = ENTRY_TYPES.reduce<Record<string, CanonEntry[]>>((acc, type) => {
    acc[type] = filtered.filter((e) => e.entryType === type)
    return acc
  }, {} as Record<string, CanonEntry[]>)

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div className="flex flex-wrap gap-2">
          {(['all', ...ENTRY_TYPES] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
                filter === type
                  ? 'bg-indigo-700 border-indigo-500 text-white'
                  : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-500'
              }`}
            >
              {type === 'all' ? 'All' : TYPE_LABELS[type]}
              {type !== 'all' && (
                <span className="ml-1.5 text-gray-400">
                  {entries.filter((e) => e.entryType === type).length}
                </span>
              )}
            </button>
          ))}
        </div>
        <div className="flex gap-2 items-center">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded bg-gray-800 border border-gray-700 px-2 py-1 text-xs text-gray-300 focus:outline-none"
          >
            <option value="all">All statuses</option>
            <option value="proposed">Proposed</option>
            <option value="canon">Canon</option>
            <option value="disputed">Disputed</option>
            <option value="retconned">Retconned</option>
          </select>
          {canAdd && (
            <button
              onClick={() => setShowAddForm((prev) => !prev)}
              className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-500"
            >
              + Add Entry
            </button>
          )}
        </div>
      </div>

      {/* Add form */}
      {showAddForm && canAdd && (
        <div className="rounded-xl border border-indigo-700 bg-gray-900 p-5 space-y-4">
          <h3 className="text-sm font-semibold text-indigo-300">New Canon Entry</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Type</label>
              <select
                value={addForm.entryType}
                onChange={(e) => setAddForm((f) => ({ ...f, entryType: e.target.value as typeof ENTRY_TYPES[number] }))}
                className="w-full rounded bg-gray-800 border border-gray-700 px-2 py-1.5 text-sm text-gray-100 focus:outline-none"
              >
                {ENTRY_TYPES.map((t) => (
                  <option key={t} value={t}>{TYPE_LABELS[t]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Source Work ID (optional)</label>
              <input
                type="text"
                value={addForm.sourceWorkId}
                onChange={(e) => setAddForm((f) => ({ ...f, sourceWorkId: e.target.value }))}
                placeholder="work ID"
                className="w-full rounded bg-gray-800 border border-gray-700 px-2 py-1.5 text-sm text-gray-100 placeholder-gray-500 focus:outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Title</label>
            <input
              type="text"
              value={addForm.title}
              onChange={(e) => setAddForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="e.g., The Fold collapses every 1,000 years"
              className="w-full rounded bg-gray-800 border border-gray-700 px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Content</label>
            <textarea
              value={addForm.content}
              onChange={(e) => setAddForm((f) => ({ ...f, content: e.target.value }))}
              placeholder="Detailed description of this canon fact…"
              rows={4}
              className="w-full rounded bg-gray-800 border border-gray-700 px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none resize-none"
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleAdd}
              disabled={adding || !addForm.title.trim() || !addForm.content.trim()}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
            >
              {adding ? 'Adding…' : 'Add to Canon'}
            </button>
            <button
              onClick={() => setShowAddForm(false)}
              className="text-sm text-gray-400 hover:text-gray-200 px-2"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Canon entries — grouped by type */}
      {filtered.length === 0 ? (
        <p className="text-gray-500 text-center py-12 text-sm">No canon entries yet.</p>
      ) : filter === 'all' ? (
        <div className="space-y-8">
          {ENTRY_TYPES.map((type) => {
            const items = grouped[type]
            if (!items || items.length === 0) return null
            return (
              <section key={type}>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">
                  {TYPE_LABELS[type]}
                </h3>
                <CanonEntryList entries={items} expanded={expanded} onExpand={setExpanded} />
              </section>
            )
          })}
        </div>
      ) : (
        <CanonEntryList entries={filtered} expanded={expanded} onExpand={setExpanded} />
      )}
    </div>
  )
}

function CanonEntryList({
  entries,
  expanded,
  onExpand,
}: {
  entries: CanonEntry[]
  expanded: string | null
  onExpand: (id: string | null) => void
}) {
  return (
    <div className="space-y-3">
      {entries.map((entry) => (
        <div
          key={entry.id}
          className={`rounded-lg border bg-gray-900 overflow-hidden transition-all ${
            TYPE_COLORS[entry.entryType] ?? 'border-gray-700'
          }`}
        >
          <button
            className="w-full text-left px-4 py-3 flex items-start gap-3"
            onClick={() => onExpand(expanded === entry.id ? null : entry.id)}
          >
            <span className={`text-xs mt-0.5 font-medium ${STATUS_COLORS[entry.status] ?? 'text-gray-400'}`}>
              {entry.status}
            </span>
            <span className="flex-1 text-sm font-medium text-gray-100">{entry.title}</span>
            <span className="text-gray-500 text-xs ml-2">{expanded === entry.id ? '▲' : '▼'}</span>
          </button>
          {expanded === entry.id && (
            <div className="px-4 pb-4 text-sm text-gray-300 border-t border-gray-800 pt-3">
              <p className="leading-relaxed">{entry.content}</p>
              {entry.sourceWorkId && (
                <p className="mt-2 text-xs text-gray-500">Source work: {entry.sourceWorkId}</p>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
