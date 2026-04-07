'use client'

import { useState, useRef, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

const PLATFORM_GENRES = [
  'Fantasy', 'Romance', 'Science Fiction', 'Mystery', 'Thriller',
  'Horror', 'Adventure', 'Comedy', 'Drama', 'Historical', 'LitRPG', 'Isekai',
]

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

  // Step 1: username
  const [username, setUsername] = useState('')
  const [usernameState, setUsernameState] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle')
  const [usernameError, setUsernameError] = useState<string | null>(null)

  // Step 2: taste discovery
  const [bookQuery, setBookQuery] = useState('')
  const [bookResults, setBookResults] = useState<BookResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [likedBooks, setLikedBooks] = useState<BookResult[]>([])
  const [selectedGenres, setSelectedGenres] = useState<Set<string>>(new Set())
  const [isSubmitting, setIsSubmitting] = useState(false)

  const checkTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const derivedGenres = useMemo(() => {
    const s = new Set<string>()
    likedBooks.forEach(b => b.genres.forEach(g => s.add(g)))
    return s
  }, [likedBooks])

  const allSelectedGenres = useMemo(() => {
    const combined = new Set(derivedGenres)
    selectedGenres.forEach(g => combined.add(g))
    return combined
  }, [derivedGenres, selectedGenres])

  // ── Helpers ──────────────────────────────────────────────

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

    const validationError = validateUsername(value)
    if (validationError) {
      setUsernameError(validationError)
      setUsernameState('invalid')
      return
    }

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

  const handleBookSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value
    setBookQuery(q)
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
    if (!q.trim()) { setBookResults([]); return }

    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearching(true)
      try {
        const res = await fetch(`/api/onboarding/book-search?q=${encodeURIComponent(q)}`)
        const data = await res.json()
        setBookResults(data.books ?? [])
      } catch {
        setBookResults([])
      } finally {
        setIsSearching(false)
      }
    }, 400)
  }

  const addBook = (book: BookResult) => {
    if (likedBooks.find(b => b.googleId === book.googleId)) return
    setLikedBooks(prev => [...prev, book])
    setBookQuery('')
    setBookResults([])
  }

  const removeBook = (id: string) => setLikedBooks(prev => prev.filter(b => b.googleId !== id))

  const toggleGenre = (genre: string) => {
    setSelectedGenres(prev => {
      const next = new Set(prev)
      if (next.has(genre)) next.delete(genre)
      else next.add(genre)
      return next
    })
  }

  const handleNext = () => {
    if (!username) {
      setUsernameError('Please choose a username')
      return
    }
    if (usernameState === 'taken' || usernameState === 'invalid') return
    setStep(2)
  }

  const completeOnboarding = async (skipGenres = false) => {
    setIsSubmitting(true)
    try {
      await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username || undefined,
          genres: skipGenres ? [] : [...allSelectedGenres],
        }),
      })
    } catch {
      // Non-fatal
    }

    // Refresh JWT so middleware sees hasSetUsername: true
    await update({ hasSetUsername: true })
    router.push('/')
  }

  const handleSkip = async () => {
    await update({ hasSetUsername: true })
    router.push('/')
  }

  // ── UI ───────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center px-4 py-12">
      {/* Logo */}
      <div className="mb-8">
        <span className="text-3xl font-bold text-white tracking-tight">Chapturs</span>
      </div>

      {/* Progress indicators */}
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
                {usernameState === 'checking' && (
                  <div className="h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                )}
                {usernameState === 'available' && (
                  <span className="text-green-400 text-base font-bold">✓</span>
                )}
                {(usernameState === 'taken' || usernameState === 'invalid') && (
                  <span className="text-red-400 text-base font-bold">✗</span>
                )}
              </div>
            </div>

            {usernameError && <p className="text-red-400 text-sm mt-2">{usernameError}</p>}
            {usernameState === 'available' && !usernameError && (
              <p className="text-green-400 text-sm mt-2">✓ Available!</p>
            )}
            <p className="text-gray-600 text-xs mt-2">3–20 characters, letters, numbers and underscores only.</p>

            <button
              onClick={handleNext}
              disabled={!username || usernameState === 'taken' || usernameState === 'invalid' || usernameState === 'checking'}
              className="w-full mt-6 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-colors"
            >
              Continue →
            </button>

            <button
              onClick={handleSkip}
              className="w-full mt-3 text-gray-600 hover:text-gray-400 text-sm py-2 transition-colors"
            >
              Skip for now
            </button>
          </div>
        )}

        {/* ── Step 2: Book taste ── */}
        {step === 2 && (
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">What do you love to read?</h1>
            <p className="text-gray-400 text-sm mb-6">
              We&apos;ll use this to personalise your feed. Search any book, manga, or light novel you&apos;ve enjoyed — even if it&apos;s not on Chapturs.
            </p>

            {/* Book search */}
            <div className="mb-5">
              <label className="block text-xs text-gray-500 uppercase tracking-wider font-medium mb-2">
                Search any title
              </label>
              <div className="relative">
                <input
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="Harry Potter, Re:Zero, Cradle, Overlord…"
                  value={bookQuery}
                  onChange={handleBookSearch}
                  autoFocus
                  autoComplete="off"
                />
                {isSearching && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                )}
              </div>

              {bookResults.length > 0 && (
                <div className="mt-1 bg-gray-800 border border-gray-700 rounded-lg overflow-hidden shadow-xl">
                  {bookResults.map(book => (
                    <button
                      key={book.googleId}
                      onClick={() => addBook(book)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-700/60 transition-colors text-left border-b border-gray-700/50 last:border-0"
                    >
                      {book.cover ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={book.cover}
                          alt=""
                          width={28}
                          height={42}
                          className="rounded object-cover flex-shrink-0 w-7 h-10"
                        />
                      ) : (
                        <div className="w-7 h-10 bg-gray-700 rounded flex-shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p className="text-white text-sm font-medium leading-tight truncate">{book.title}</p>
                        {book.authors.length > 0 && (
                          <p className="text-gray-400 text-xs truncate">{book.authors.slice(0, 2).join(', ')}</p>
                        )}
                        {book.genres.length > 0 && (
                          <div className="flex gap-1 mt-0.5 flex-wrap">
                            {book.genres.slice(0, 3).map(g => (
                              <span key={g} className="text-xs text-blue-400">{g}</span>
                            ))}
                          </div>
                        )}
                      </div>
                      <span className="ml-auto text-gray-500 text-lg flex-shrink-0">+</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Liked books */}
            {likedBooks.length > 0 && (
              <div className="mb-5">
                <label className="block text-xs text-gray-500 uppercase tracking-wider font-medium mb-2">
                  Your picks
                </label>
                <div className="flex flex-wrap gap-2">
                  {likedBooks.map(book => (
                    <div
                      key={book.googleId}
                      className="flex items-center gap-1.5 bg-blue-900/30 border border-blue-700/50 rounded-full pl-3 pr-2 py-1"
                    >
                      <span className="text-blue-200 text-sm max-w-[140px] truncate">{book.title}</span>
                      <button
                        onClick={() => removeBook(book.googleId)}
                        className="text-blue-500 hover:text-white text-base leading-none ml-0.5 transition-colors"
                        aria-label={`Remove ${book.title}`}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
                {derivedGenres.size > 0 && (
                  <p className="text-xs text-gray-500 mt-2">
                    Detected:{' '}
                    {[...derivedGenres].map((g, i) => (
                      <span key={g}>
                        {i > 0 && <span className="text-gray-700">, </span>}
                        <span className="text-blue-400 font-medium">{g}</span>
                      </span>
                    ))}
                  </p>
                )}
              </div>
            )}

            {/* Genre pills */}
            <div className="mb-6">
              <label className="block text-xs text-gray-500 uppercase tracking-wider font-medium mb-2">
                {likedBooks.length > 0 ? 'Add more genres' : 'Or pick genres directly'}
              </label>
              <div className="flex flex-wrap gap-2">
                {PLATFORM_GENRES.map(genre => {
                  const isDerived = derivedGenres.has(genre)
                  const isSelected = selectedGenres.has(genre)
                  return (
                    <button
                      key={genre}
                      onClick={() => toggleGenre(genre)}
                      disabled={isDerived}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                        isDerived
                          ? 'bg-blue-600/25 border-blue-500/60 text-blue-200 cursor-default'
                          : isSelected
                            ? 'bg-blue-600 border-blue-500 text-white shadow-md'
                            : 'bg-gray-800 border-gray-600 text-gray-300 hover:border-gray-400 hover:text-white'
                      }`}
                    >
                      {isDerived && <span className="mr-1 text-blue-400">✓</span>}
                      {genre}
                    </button>
                  )
                })}
              </div>
            </div>

            <button
              onClick={() => completeOnboarding(false)}
              disabled={isSubmitting}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-semibold py-3 rounded-lg transition-colors"
            >
              {isSubmitting ? 'Setting up your feed…' : 'Start Reading →'}
            </button>

            <button
              onClick={() => completeOnboarding(true)}
              className="w-full mt-3 text-gray-600 hover:text-gray-400 text-sm py-2 transition-colors"
            >
              Skip genres, go to feed
            </button>
          </div>
        )}

      </div>
    </div>
  )
}
