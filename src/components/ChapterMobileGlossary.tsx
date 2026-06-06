'use client'

import { useState } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'

interface ReaderCharacter {
  id: string
  name: string
  aliases?: string[]
  [key: string]: any
}

interface ReaderGlossaryTerm {
  id?: string
  term: string
  definition: string
  category?: string
}

interface ChapterMobileGlossaryProps {
  show: boolean
  onClose: () => void
  characters: ReaderCharacter[]
  glossaryTerms: ReaderGlossaryTerm[]
  onCharacterSelect?: (character: ReaderCharacter) => void
}

export default function ChapterMobileGlossary({
  show,
  onClose,
  characters,
  glossaryTerms,
  onCharacterSelect,
}: ChapterMobileGlossaryProps) {
  const [tab, setTab] = useState<'characters' | 'terms'>('characters')
  const [query, setQuery] = useState('')

  if (!show) return null

  const filteredCharacters = characters.filter((c) => {
    if (!query.trim()) return true
    const q = query.toLowerCase()
    return c.name?.toLowerCase().includes(q) || (c.aliases || []).some((a: string) => a.toLowerCase().includes(q))
  })

  const filteredTerms = glossaryTerms.filter((t) => {
    if (!query.trim()) return true
    const q = query.toLowerCase()
    return t.term?.toLowerCase().includes(q) || t.definition?.toLowerCase().includes(q) || t.category?.toLowerCase().includes(q)
  })

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-800 rounded-t-2xl max-h-[70vh] flex flex-col shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Story Glossary</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
            <XMarkIcon className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setTab('characters')}
            className={`flex-1 py-2 text-sm font-medium ${
              tab === 'characters'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Characters
          </button>
          <button
            onClick={() => setTab('terms')}
            className={`flex-1 py-2 text-sm font-medium ${
              tab === 'terms'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Glossary
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search ${tab}...`}
            className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          {tab === 'characters' && (
            <div className="space-y-2">
              {filteredCharacters.length === 0 && (
                <p className="text-sm text-gray-400 py-4 text-center">No characters found</p>
              )}
              {filteredCharacters.map((char) => (
                <button
                  key={char.id}
                  onClick={() => onCharacterSelect?.(char)}
                  className="w-full text-left p-3 rounded border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                >
                  <div className="font-medium text-gray-900 dark:text-white">{char.name}</div>
                  {(char.aliases as string[])?.length > 0 && (
                    <div className="text-xs text-gray-500 mt-0.5">
                      AKA: {(char.aliases as string[]).join(', ')}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
          {tab === 'terms' && (
            <div className="space-y-3">
              {filteredTerms.length === 0 && (
                <p className="text-sm text-gray-400 py-4 text-center">No terms found</p>
              )}
              {filteredTerms.map((term) => (
                <div key={term.id || term.term} className="p-3 rounded border border-gray-200 dark:border-gray-700">
                  <div className="font-medium text-gray-900 dark:text-white">{term.term}</div>
                  {term.category && (
                    <span className="inline-block text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 mt-1">
                      {term.category}
                    </span>
                  )}
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">{term.definition}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
