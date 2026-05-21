'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

// ── Types ────────────────────────────────────────────────────────────────────

export interface ReaderCharacter {
  id: string
  name: string
  aliases?: string[]
  allowUserSubmissions?: boolean
  workId?: string
  [key: string]: any
}

export interface ReaderGlossaryTerm {
  id?: string
  term: string
  definition: string
  category?: string
  firstMentionedChapter?: number
}

interface ChapterReaderContextValue {
  glossaryTerms: ReaderGlossaryTerm[]
  characters: ReaderCharacter[]
  setGlossaryTerms: (terms: ReaderGlossaryTerm[]) => void
  setCharacters: (chars: ReaderCharacter[]) => void
}

// ── Context ──────────────────────────────────────────────────────────────────

const ChapterReaderContext = createContext<ChapterReaderContextValue | null>(null)

export function ChapterReaderProvider({ children }: { children: ReactNode }) {
  const [glossaryTerms, setGlossaryTerms] = useState<ReaderGlossaryTerm[]>([])
  const [characters, setCharacters] = useState<ReaderCharacter[]>([])

  const setTerms = useCallback((terms: ReaderGlossaryTerm[]) => {
    setGlossaryTerms(terms)
  }, [])

  const setChars = useCallback((chars: ReaderCharacter[]) => {
    setCharacters(chars)
  }, [])

  return (
    <ChapterReaderContext.Provider value={{ glossaryTerms, characters, setGlossaryTerms: setTerms, setCharacters: setChars }}>
      {children}
    </ChapterReaderContext.Provider>
  )
}

export function useChapterReader(): ChapterReaderContextValue {
  const ctx = useContext(ChapterReaderContext)
  if (!ctx) {
    // Fallback for components rendered outside the provider (e.g. SSR, testing)
    return { glossaryTerms: [], characters: [], setGlossaryTerms: () => {}, setCharacters: () => {} }
  }
  return ctx
}
