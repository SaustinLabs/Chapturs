'use client'

import { useState, useRef, useMemo, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

// All searchable tags — platform genres + popular tropes a reader might type
const ALL_TAGS = [
  // Core platform genres (wired into feed algorithm)
  'Fantasy', 'Romance', 'Science Fiction', 'Mystery', 'Thriller', 'Horror',
  'Adventure', 'Comedy', 'Drama', 'Historical', 'LitRPG', 'Isekai',
  // Tropes & subgenres
  'Magic Academy', 'Chosen One', 'Vampires', 'Werewolves', 'Dragons',
  'Post-Apocalyptic', 'Dystopian', 'Time Travel', 'Superheroes', 'Zombies',
  'Cultivation', 'Reincarnation', 'Kingdom Building', 'Demon Lord', 'Harem',
  'Space Opera', 'Cyberpunk', 'Steampunk', 'Slice of Life', 'Psychological',
  'Coming of Age', 'Dark Fantasy', 'Progression Fantasy', 'Cozy Fantasy',
  'Survival', 'Time Loop', 'Dungeon',
]

// Hardcoded tropes for popular series — keyed by lowercase substring of title
const BOOK_TROPE_MAP: [string, string[]][] = [
  ['harry potter',      ['Magic Academy', 'Chosen One', 'Coming of Age', 'Fantasy']],
  ['percy jackson',     ['Chosen One', 'Adventure', 'Coming of Age', 'Fantasy']],
  ['lord of the rings', ['Fantasy', 'Adventure', 'Dark Fantasy', 'Kingdom Building']],
  ['hobbit',            ['Fantasy', 'Adventure', 'Coming of Age']],
  ['overlord',          ['Isekai', 'Demon Lord', 'LitRPG', 'Fantasy']],
  ['re:zero',           ['Isekai', 'Dark Fantasy', 'Time Loop', 'Fantasy']],
  ['sword art online',  ['Isekai', 'LitRPG', 'Science Fiction']],
  ['no game no life',   ['Isekai', 'LitRPG', 'Comedy']],
  ['konosuba',          ['Isekai', 'Comedy', 'Fantasy']],
  ['attack on titan',   ['Dark Fantasy', 'Survival', 'Psychological']],
  ['game of thrones',   ['Dark Fantasy', 'Fantasy', 'Kingdom Building']],
  ['a song of ice',     ['Dark Fantasy', 'Fantasy', 'Kingdom Building']],
  ['name of the wind',  ['Magic Academy', 'Coming of Age', 'Fantasy']],
  ['kingkiller',        ['Magic Academy', 'Coming of Age', 'Fantasy']],
  ['cradle',            ['Progression Fantasy', 'Fantasy', 'Cultivation']],
  ['dungeon crawler',   ['LitRPG', 'Progression Fantasy', 'Comedy', 'Survival', 'Dungeon']],
  ['mistborn',          ['Fantasy', 'Dark Fantasy', 'Kingdom Building']],
  ['stormlight',        ['Fantasy', 'Dark Fantasy', 'Kingdom Building']],
  ['way of kings',      ['Fantasy', 'Dark Fantasy', 'Kingdom Building']],
  ['twilight',          ['Romance', 'Vampires', 'Fantasy']],
  ['hunger games',      ['Dystopian', 'Survival', 'Coming of Age']],
  ['divergent',         ['Dystopian', 'Coming of Age', 'Science Fiction']],
  ['maze runner',       ['Dystopian', 'Survival', 'Science Fiction']],
  ['ready player one',  ['LitRPG', 'Science Fiction', 'Cyberpunk']],
  ['dune',              ['Science Fiction', 'Space Opera', 'Kingdom Building']],
  ["ender's game",      ['Science Fiction', 'Coming of Age']],
  ['enders game',       ['Science Fiction', 'Coming of Age']],
  ['wandering inn',     ['Isekai', 'LitRPG', 'Fantasy']],
  ['mother of learning',['Magic Academy', 'Time Loop', 'Fantasy', 'Progression Fantasy']],
  ['worm',              ['Superheroes', 'Dark Fantasy', 'Psychological']],
  ['a court of thorns', ['Fantasy', 'Romance', 'Dark Fantasy']],
  ['throne of glass',   ['Fantasy', 'Adventure', 'Dark Fantasy']],
  ['vampire diaries',   ['Vampires', 'Romance', 'Horror']],
  ['interview with the vampire', ['Vampires', 'Horror', 'Dark Fantasy']],
  ['dracula',           ['Vampires', 'Horror']],
  ['witcher',           ['Dark Fantasy', 'Fantasy', 'Adventure']],
  ['coiling dragon',    ['Cultivation', 'Progression Fantasy', 'Fantasy']],
]

function getTropesForTitle(title: string): string[] {
  const lower = title.toLowerCase()
  for (const [key, tropes] of BOOK_TROPE_MAP) {
    if (lower.includes(key)) return tropes
  }
  return []
}

type BookResult = {
  googleId: string
  title: string
  authors: string[]
  cover: string | null
  genres: string[]
}

export default function OnboardingForm() {
  const { update } = useSession()
  const router = useRouter()

  const [step, setStep] = useState<1 | 2>(1)

  // Step 1 — username
  const [username, setUsername] = useState('')
  const [usernameState, setUsernameState] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle')
  const [usernameError, setUsernameError] = useState<string | null>(null)

  // Step 2 — taste discovery
  const [query, setQuery] = useState('')
  const [bookResults, setBookResults] = useState<BookResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set())
  const [isSubmitting, setIsSubmitting] = useState(false)

  const checkTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Tags from ALL_TAGS that match the current query (client-side, instant)
  const matchingTags = useMemo(() => {
    if (!query.trim()) return []
    const q = query.toLowerCase()
    return ALL_TAGS.filter(t => t.toLowerCase().includes(q) && !selectedTags.has(t))
  }, [query, selectedTags])

  // Close dropdown when clicking outside
  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current && !inputRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [])

  // ── Username ────────────────────────────────────────────

  const validateUsername = (value: string): string | null => {
    if (!value) return null
    if (value.length < 3) return 'Must be at least 3 characters'
    if (value.length > 20) return 'Must be less than 20 characters'
    if (!/^[a-zA-Z0-9_]+$/.test(value)) return 'Only letters, numbers, and underscores'
    if (/^[0-9]/.test(value)) return 'Cannot start with a number'
    return null
  }

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setUsername(value)
    setUsernameState('idle')
    setUsernameError(null)
    if (checkTimeoutRef.current) clearTimeout(checkTimeoutRef.current)
    if (!value) return
    const err = validateUsername(value)
    if (err) { setUsernameError(err); setUsernameState('invalid'); return }
    checkTimeoutRef.current = setTimeout(async () => {
      setUsernameState('checking')
      try {
        const res = await fetch(`/api/auth/check-username?username=${encodeURIComponent(value)}`)
        const data = await res.json()
        if (data.available) {
          setUsernameState('available')
        } else {
          setUsernameState('taken')
          setUsernameError('Username already taken')
        }
      } catch {
        setUsernameState('idle')
      }
    }, 500)
  }

  // ── Taste search ────────────────────────────────────────

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setQuery(value)
    setDropdownOpen(true)
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
    if (!value.trim()) { setBookResults([]); return }

    // Debounce the network call, tag matching is instant above
    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearching(true)
      try {
        const res = await fetch(`/api/onboarding/book-search?q=${encodeURIComponent(value)}`)
        const data = await res.json()
        setBookResults(data.books ?? [])
      } catch {
        setBookResults([])
      } finally {
        setIsSearching(false)
      }
    }, 350)
  }

  const addTag = (tag: string) => {
    setSelectedTags(prev => new Set([...prev, tag]))
    setQuery('')
    setBookResults([])
    setDropdownOpen(false)
    inputRef.current?.focus()
  }

  const addBook = (book: BookResult) => {
    // Merge Google Books genres + hardcoded tropes into selected tags
    const tropes = getTropesForTitle(book.title)
    const newTags = [...new Set([...book.genres, ...tropes])]
    if (newTags.length > 0) {
      setSelectedTags(prev => {
        const next = new Set(prev)
        newTags.forEach(t => next.add(t))
        return next
      })
    }
    setQuery('')
    setBookResults([])
    setDropdownOpen(false)
    inputRef.current?.focus()
  }

  const removeTag = (tag: string) => {
    setSelectedTags(prev => { const next = new Set(prev); next.delete(tag); return next })
  }

  // ── Actions ─────────────────────────────────────────────

  const handleNext = () => {
    if (!username) { setUsernameError('Please choose a username'); return }
    if (usernameState === 'taken' || usernameState === 'invalid') return
    setStep(2)
  }

  const completeOnboarding = async () => {
    setIsSubmitting(true)
    try {
      await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username || undefined, genres: [...selectedTags] }),
      })
    } catch { /* non-fatal */ }
    await update({ hasSetUsername: true })
    router.push('/')
  }

  const skipAll = async () => {
    await update({ hasSetUsername: true })
    router.push('/')
  }

  const showDropdown = dropdownOpen && query.trim().length > 0 &&
    (matchingTags.length > 0 || bookResults.length > 0 || isSearching)

  // ── UI ───────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center px-4 py-12">
      <div className="mb-8">
        <span className="text-3xl font-bold text-white tracking-tight">Chapturs</span>
      </div>

      {/* Progress */}
      <div className="flex gap-2 mb-10">
        <div className={`h-1 w-16 rounded-full transition-colors duration-300 ${step >= 1 ? 'bg-blue-500' : 'bg-gray-700'}`} />
        <div className={`h-1 w-16 rounded-full transition-colors duration-300 ${step >= 2 ? 'bg-blue-500' : 'bg-gray-700'}`} />
      </div>

      <div className="w-full max-w-md">

        {/* ── Step 1: Username ── */}
        {step === 1 && (
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">Choose your username</h1>
            <p className="text-gray-400 text-sm mb-6">
              This is how you&apos;ll appear to other readers and creators.
            </p>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 select-none">@</span>
              <input
                className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-8 pr-10 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="yourname"
                value={username}
                onChange={handleUsernameChange}
                maxLength={20}
                autoFocus
                autoComplete="off"
                spellCheck={false}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {usernameState === 'checking' && <div className="h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />}
                {usernameState === 'available' && <span className="text-green-400 font-bold">✓</span>}
                {(usernameState === 'taken' || usernameState === 'invalid') && <span className="text-red-400 font-bold">✗</span>}
              </div>
            </div>
            {usernameError && <p className="text-red-400 text-sm mt-2">{usernameError}</p>}
            {usernameState === 'available' && !usernameError && <p className="text-green-400 text-sm mt-2">✓ Available!</p>}
            <p className="text-gray-600 text-xs mt-2">3–20 characters, letters, numbers and underscores only.</p>
            <button
              onClick={handleNext}
              disabled={!username || usernameState === 'taken' || usernameState === 'invalid' || usernameState === 'checking'}
              className="w-full mt-6 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-colors"
            >
              Continue →
            </button>
            <button onClick={skipAll} className="w-full mt-3 text-gray-600 hover:text-gray-400 text-sm py-2 transition-colors">
              Skip for now
            </button>
          </div>
        )}

        {/* ── Step 2: Taste ── */}
        {step === 2 && (
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">What do you love?</h1>
            <p className="text-gray-400 text-sm mb-5">
              Type a book, series, or trope — we&apos;ll tune your feed around it. Books you search will automatically add their genres and related tropes.
            </p>

            {/* Unified search box */}
            <div className="relative mb-4">
              <input
                ref={inputRef}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="Harry Potter, Isekai, Magic Academy, Vampires…"
                value={query}
                onChange={handleSearchChange}
                onFocus={() => { if (query.trim()) setDropdownOpen(true) }}
                autoFocus
                autoComplete="off"
              />
              {isSearching && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              )}

              {/* Dropdown */}
              {showDropdown && (
                <div
                  ref={dropdownRef}
                  className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl z-50 overflow-hidden"
                  style={{ maxHeight: '320px', overflowY: 'auto' }}
                >
                  {/* Genre/trope tag matches */}
                  {matchingTags.length > 0 && (
                    <div className="p-2">
                      <p className="text-xs text-gray-500 uppercase tracking-wider font-medium px-1 mb-1.5">Genres &amp; Tropes</p>
                      <div className="flex flex-wrap gap-1.5">
                        {matchingTags.map(tag => (
                          <button
                            key={tag}
                            onMouseDown={e => { e.preventDefault(); addTag(tag) }}
                            className="px-2.5 py-1 bg-gray-700 hover:bg-blue-600 border border-gray-600 hover:border-blue-500 text-gray-200 hover:text-white rounded-full text-sm transition-all"
                          >
                            + {tag}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Divider */}
                  {matchingTags.length > 0 && (bookResults.length > 0 || isSearching) && (
                    <div className="border-t border-gray-700 mx-2" />
                  )}

                  {/* Book results */}
                  {bookResults.length > 0 && (
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wider font-medium px-3 pt-2 pb-1">Books &amp; Series</p>
                      {bookResults.map(book => {
                        const preview = [...new Set([...book.genres, ...getTropesForTitle(book.title)])]
                        return (
                          <button
                            key={book.googleId}
                            onMouseDown={e => { e.preventDefault(); addBook(book) }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-700/60 transition-colors text-left border-b border-gray-700/30 last:border-0"
                          >
                            {book.cover ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={book.cover} alt="" className="rounded flex-shrink-0 object-cover w-9 h-[52px]" />
                            ) : (
                              <div className="w-9 h-[52px] bg-gray-700 rounded flex-shrink-0 flex items-center justify-center">
                                <span className="text-gray-500 text-xs">?</span>
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="text-white text-sm font-medium leading-tight truncate">{book.title}</p>
                              {book.authors.length > 0 && (
                                <p className="text-gray-400 text-xs truncate mt-0.5">{book.authors.slice(0, 2).join(', ')}</p>
                              )}
                              {preview.length > 0 && (
                                <div className="flex gap-1 mt-1 flex-wrap">
                                  {preview.slice(0, 4).map(g => (
                                    <span key={g} className="text-xs text-blue-400 bg-blue-950/60 px-1.5 py-0.5 rounded">{g}</span>
                                  ))}
                                  {preview.length > 4 && <span className="text-xs text-gray-500">+{preview.length - 4}</span>}
                                </div>
                              )}
                            </div>
                            <span className="text-blue-500 text-xs flex-shrink-0 font-medium">add</span>
                          </button>
                        )
                      })}
                    </div>
                  )}

                  {/* Loading state when no results yet */}
                  {isSearching && bookResults.length === 0 && matchingTags.length === 0 && (
                    <p className="px-4 py-4 text-gray-500 text-sm text-center">Searching books…</p>
                  )}

                  {/* No results state */}
                  {!isSearching && bookResults.length === 0 && matchingTags.length === 0 && (
                    <p className="px-4 py-4 text-gray-500 text-sm text-center">No matches — try a different search</p>
                  )}
                </div>
              )}
            </div>

            {/* Selected tags */}
            {selectedTags.size > 0 ? (
              <div className="mb-6">
                <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-2">Your interests</p>
                <div className="flex flex-wrap gap-2">
                  {[...selectedTags].map(tag => (
                    <div key={tag} className="flex items-center gap-1 bg-blue-900/30 border border-blue-700/50 rounded-full pl-3 pr-2 py-1">
                      <span className="text-blue-200 text-sm">{tag}</span>
                      <button
                        onClick={() => removeTag(tag)}
                        className="text-blue-500 hover:text-white text-sm leading-none ml-0.5 transition-colors"
                        aria-label={`Remove ${tag}`}
                      >×</button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mb-6">
                <p className="text-gray-600 text-sm">
                  Try:{' '}
                  {['Fantasy', 'Isekai', 'LitRPG', 'Vampires', 'Cyberpunk'].map((t, i) => (
                    <span key={t}>
                      {i > 0 && <span className="text-gray-700">, </span>}
                      <button onClick={() => addTag(t)} className="text-gray-500 hover:text-gray-300 underline">{t}</button>
                    </span>
                  ))}
                </p>
              </div>
            )}

            <button
              onClick={completeOnboarding}
              disabled={isSubmitting || selectedTags.size === 0}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-colors"
            >
              {isSubmitting ? 'Setting up your feed…' : 'Start Reading →'}
            </button>

            <button
              onClick={skipAll}
              className="w-full mt-3 text-gray-600 hover:text-gray-400 text-sm py-2 transition-colors"
            >
              Skip, show me everything
            </button>
          </div>
        )}

      </div>
    </div>
  )
}
