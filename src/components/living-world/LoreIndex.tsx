'use client'

import { useState } from 'react'

interface CanonEntry {
  id: string
  entryType: string
  title: string
  content: string
  status: string
  sourceWork?: { id: string; title: string } | null
}

interface CanonCharacter {
  id: string
  name: string
  aliases?: string | null
  description?: string | null
  traits?: string | null
  status: string
}

interface Props {
  worldId: string
  canonEntries: CanonEntry[]
  characters: CanonCharacter[]
}

const ENTRY_TYPE_ICONS: Record<string, string> = {
  fact: '📖',
  event: '⚡',
  location: '🗺️',
  rule: '⚖️',
  character_fact: '👤',
}

export default function LoreIndex({ worldId: _worldId, canonEntries, characters }: Props) {
  const [activeTab, setActiveTab] = useState<'entries' | 'characters'>('entries')
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [expanded, setExpanded] = useState<string | null>(null)

  const entryTypes = [...new Set(canonEntries.map((e) => e.entryType))].sort()

  const filteredEntries = canonEntries.filter((e) => {
    if (typeFilter !== 'all' && e.entryType !== typeFilter) return false
    if (search && !e.title.toLowerCase().includes(search.toLowerCase()) && !e.content.toLowerCase().includes(search.toLowerCase())) return false
    return e.status !== 'retconned'
  })

  const filteredCharacters = characters.filter((c) => {
    if (!search) return true
    return (
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.description ?? '').toLowerCase().includes(search.toLowerCase())
    )
  })

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-white">Lore Index</h2>
      </div>

      {/* Search + filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search lore…"
          className="flex-1 min-w-40 rounded-lg bg-gray-800 border border-gray-700 px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <div className="flex rounded-lg overflow-hidden border border-gray-700">
          <button
            onClick={() => setActiveTab('entries')}
            className={`px-4 py-2 text-sm transition-colors ${activeTab === 'entries' ? 'bg-indigo-700 text-white' : 'bg-gray-800 text-gray-400 hover:text-gray-200'}`}
          >
            Entries ({canonEntries.length})
          </button>
          <button
            onClick={() => setActiveTab('characters')}
            className={`px-4 py-2 text-sm transition-colors ${activeTab === 'characters' ? 'bg-indigo-700 text-white' : 'bg-gray-800 text-gray-400 hover:text-gray-200'}`}
          >
            Characters ({characters.length})
          </button>
        </div>
      </div>

      {activeTab === 'entries' && (
        <>
          {/* Type filter */}
          {entryTypes.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              <button
                onClick={() => setTypeFilter('all')}
                className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${typeFilter === 'all' ? 'bg-indigo-700 border-indigo-500 text-white' : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500'}`}
              >
                All
              </button>
              {entryTypes.map((type) => (
                <button
                  key={type}
                  onClick={() => setTypeFilter(type)}
                  className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${typeFilter === type ? 'bg-indigo-700 border-indigo-500 text-white' : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500'}`}
                >
                  {ENTRY_TYPE_ICONS[type] ?? '📄'} {type}
                </button>
              ))}
            </div>
          )}

          {filteredEntries.length === 0 ? (
            <p className="text-gray-500 text-sm py-8 text-center">No lore entries found.</p>
          ) : (
            <div className="space-y-2">
              {filteredEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="rounded-lg border border-gray-800 bg-gray-900 overflow-hidden"
                >
                  <button
                    onClick={() => setExpanded(expanded === entry.id ? null : entry.id)}
                    className="w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-gray-800 transition-colors"
                  >
                    <span className="text-lg">{ENTRY_TYPE_ICONS[entry.entryType] ?? '📄'}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-100 line-clamp-1">{entry.title}</p>
                      {!expanded || expanded !== entry.id ? (
                        <p className="text-xs text-gray-400 line-clamp-1 mt-0.5">{entry.content}</p>
                      ) : null}
                    </div>
                    <span className="text-gray-600 text-xs ml-2 flex-shrink-0">
                      {expanded === entry.id ? '▲' : '▼'}
                    </span>
                  </button>
                  {expanded === entry.id && (
                    <div className="px-4 pb-4 border-t border-gray-800 pt-3">
                      <p className="text-sm text-gray-300 leading-relaxed">{entry.content}</p>
                      {entry.sourceWork && (
                        <a
                          href={`/story/${entry.sourceWork.id}`}
                          className="mt-2 inline-block text-xs text-indigo-400 hover:text-indigo-300"
                        >
                          Source: {entry.sourceWork.title} →
                        </a>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === 'characters' && (
        <>
          {filteredCharacters.length === 0 ? (
            <p className="text-gray-500 text-sm py-8 text-center">No characters found.</p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCharacters.map((char) => {
                let aliases: string[] = []
                let traits: string[] = []
                try { aliases = JSON.parse(char.aliases ?? '[]') } catch {}
                try { traits = JSON.parse(char.traits ?? '[]') } catch {}

                return (
                  <div key={char.id} className="rounded-xl border border-gray-800 bg-gray-900 p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-semibold text-gray-100">{char.name}</h3>
                      <span className={`text-xs rounded-full px-2 py-0.5 ${
                        char.status === 'active' ? 'bg-green-900 text-green-300' :
                        char.status === 'deceased' ? 'bg-gray-800 text-gray-500' :
                        'bg-yellow-900 text-yellow-300'
                      }`}>
                        {char.status}
                      </span>
                    </div>
                    {aliases.length > 0 && (
                      <p className="text-xs text-gray-500 mb-2">Also known as: {aliases.join(', ')}</p>
                    )}
                    {char.description && (
                      <p className="text-sm text-gray-400 line-clamp-3">{char.description}</p>
                    )}
                    {traits.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {traits.slice(0, 4).map((trait) => (
                          <span key={trait} className="rounded-full bg-gray-800 px-2 py-0.5 text-xs text-gray-400">
                            {trait}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}
    </section>
  )
}
