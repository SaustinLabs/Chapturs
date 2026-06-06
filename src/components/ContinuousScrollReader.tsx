'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import ChapterBlockRenderer from '@/components/ChapterBlockRenderer'
import ChapterTopBar from '@/components/ChapterTopBar'
import ChapterTranslationBanner from '@/components/ChapterTranslationBanner'
import ChapterMobileGlossary from '@/components/ChapterMobileGlossary'
import ChapterReaderSettings, { ReaderSettings, DEFAULT_READER_SETTINGS } from '@/components/ChapterReaderSettings'
import CommentSection from '@/components/CommentSection'
import AdSlot from '@/components/ads/AdSlot'
import ChapterReactionBar from '@/components/ChapterReactionBar'
import { useToast } from '@/components/ui/Toast'
import { useSession } from 'next-auth/react'
import { Section, Work } from '@/types'
import DataService from '@/lib/api/DataService'

// ── Types ────────────────────────────────────────────────────────────────────

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

interface ContinuousScrollReaderProps {
  storyId: string
  initialChapterId: string
  work: Work
  allSections: Section[]
  initialSection: Section
  initialGlossary: ReaderGlossaryTerm[]
  initialCharacters: ReaderCharacter[]
  onTogglePaginated: () => void
}

// ── Component ────────────────────────────────────────────────────────────────

export default function ContinuousScrollReader({
  storyId,
  initialChapterId,
  work,
  allSections,
  initialSection,
  initialGlossary,
  initialCharacters,
  onTogglePaginated,
}: ContinuousScrollReaderProps) {
  const router = useRouter()
  const { data: session } = useSession()
  const { toast } = useToast()

  // ── Reader settings ──────────────────────────────────────────────────────
  const [settings, setSettings] = useState<ReaderSettings>(DEFAULT_READER_SETTINGS)
  const [showSettingsDrawer, setShowSettingsDrawer] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem('reader-settings-v1')
      if (stored) setSettings((prev) => ({ ...prev, ...JSON.parse(stored) }))
    } catch {}
  }, [])

  useEffect(() => {
    try { localStorage.setItem('reader-settings-v1', JSON.stringify(settings)) } catch {}
  }, [settings])

  // ── Loaded sections ──────────────────────────────────────────────────────
  const initialIndex = allSections.findIndex((s) => s.id === initialChapterId)
  const [loadedSections, setLoadedSections] = useState<(Section | null)[]>(() => {
    // Pre-fill with nulls, set initial section
    const arr = allSections.map(() => null as Section | null)
    if (initialIndex >= 0) arr[initialIndex] = initialSection
    return arr
  })

  // ── Social state ─────────────────────────────────────────────────────────
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [isLiked, setIsLiked] = useState(false)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [showComments, setShowComments] = useState(false)

  useEffect(() => {
    if (!work) return
    Promise.all([
      fetch(`/api/likes?workId=${storyId}`).then((r) => r.ok ? r.json() : null).catch(() => null),
      fetch(`/api/bookmarks?workId=${storyId}`).then((r) => r.ok ? r.json() : null).catch(() => null),
      work.authorId ? fetch(`/api/subscriptions?authorId=${work.authorId}`).then((r) => r.ok ? r.json() : null).catch(() => null) : null,
    ]).then(([like, bookmark, sub]) => {
      if (like?.data?.liked !== undefined) setIsLiked(like.data.liked)
      else if (like?.liked !== undefined) setIsLiked(like.liked)
      if (bookmark?.data?.bookmarked !== undefined) setIsBookmarked(bookmark.data.bookmarked)
      else if (bookmark?.bookmarked !== undefined) setIsBookmarked(bookmark.bookmarked)
      if (sub?.data?.subscribed !== undefined) setIsSubscribed(sub.data.subscribed)
      else if (sub?.subscribed !== undefined) setIsSubscribed(sub.subscribed)
    }).catch(() => {})
  }, [storyId, work])

  // ── Translation ──────────────────────────────────────────────────────────
  const [targetLanguage, setTargetLanguage] = useState('en')
  const [detectedLanguage, setDetectedLanguage] = useState('en')
  const [translationId, setTranslationId] = useState<string | null>(null)
  const [translationRating, setTranslationRating] = useState<number | null>(null)
  const [translatedSections, setTranslatedSections] = useState<Map<number, { title: string; content: any[] }>>(new Map())

  useEffect(() => {
    const SUPPORTED = ['es', 'fr', 'de', 'ja', 'zh', 'pt', 'ko', 'it', 'ru', 'ar']
    fetch('/api/user/profile')
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.preferredLanguage && SUPPORTED.includes(data.preferredLanguage)) {
          setTargetLanguage(data.preferredLanguage)
          setDetectedLanguage(data.preferredLanguage)
        } else {
          const browser = (navigator.language || '').split('-')[0].toLowerCase()
          if (SUPPORTED.includes(browser)) { setTargetLanguage(browser); setDetectedLanguage(browser) }
        }
      })
      .catch(() => {
        const browser = (navigator.language || '').split('-')[0].toLowerCase()
        if (SUPPORTED.includes(browser)) { setTargetLanguage(browser); setDetectedLanguage(browser) }
      })
  }, [])

  // ── Mobile glossary ──────────────────────────────────────────────────────
  const [showMobileGlossary, setShowMobileGlossary] = useState(false)
  const [selectedCharacterProfile, setSelectedCharacterProfile] = useState<ReaderCharacter | null>(null)

  // ── Infinite scroll with Intersection Observer ───────────────────────────
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  const loadingRef = useRef(false)
  const [currentVisibleIndex, setCurrentVisibleIndex] = useState(Math.max(0, initialIndex))

  const loadSection = useCallback(async (index: number) => {
    if (index < 0 || index >= allSections.length) return
    if (loadedSections[index] !== null) return // Already loaded
    if (loadingRef.current) return

    loadingRef.current = true
    try {
      const sec = allSections[index]
      const res = await fetch(`/api/works/${storyId}/sections/${sec.id}`)
      if (res.ok) {
        const data = await res.json()
        const full = data.section || data
        setLoadedSections((prev) => {
          const next = [...prev]
          next[index] = full
          return next
        })
      }
    } catch (err) {
      console.error('Failed to load section:', err)
    } finally {
      loadingRef.current = false
    }
  }, [allSections, loadedSections, storyId])

  // Preload adjacent sections
  useEffect(() => {
    loadSection(initialIndex - 1)
    loadSection(initialIndex + 1)
  }, [initialIndex, loadSection])

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          // Load next unloaded section
          const nextUnloaded = loadedSections.findIndex((s, i) => s === null && i > 0)
          if (nextUnloaded >= 0) loadSection(nextUnloaded)
        }
      },
      { rootMargin: '600px' } // Start loading 600px before reaching sentinel
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [loadedSections, loadSection])

  // Track visible chapter for URL update
  useEffect(() => {
    const chapterElements = document.querySelectorAll('[data-chapter-index]')
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .map((e) => parseInt((e.target as HTMLElement).dataset.chapterIndex || '0'))
          .sort((a, b) => a - b)
        if (visible.length > 0) {
          setCurrentVisibleIndex(visible[0])
        }
      },
      { threshold: 0.3 }
    )

    chapterElements.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [loadedSections])

  // Update URL when visible chapter changes (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      const sec = allSections[currentVisibleIndex]
      if (sec) {
        router.replace(`/story/${storyId}/chapter/${sec.id}?mode=scroll`, { scroll: false })
      }
    }, 500)
    return () => clearTimeout(timer)
  }, [currentVisibleIndex, allSections, storyId, router])

  // ── Font size helpers ────────────────────────────────────────────────────
  const getFontSizeClass = () => {
    switch (settings.fontSize) {
      case 'small': return 'text-sm'
      case 'large': return 'text-lg'
      case 'xl': return 'text-xl'
      default: return 'text-base'
    }
  }

  const getThemeColors = () => {
    if (settings.theme === 'paper') return 'bg-amber-50 text-amber-950'
    if (settings.theme === 'night') return 'bg-slate-950 text-slate-100'
    return 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100'
  }

  const getLineHeightStyle = () => ({
    lineHeight: settings.lineHeight,
    fontFamily: settings.fontFamily,
  })

  // ── Render ───────────────────────────────────────────────────────────────
  const loadedCount = loadedSections.filter((s) => s !== null).length
  const allLoaded = loadedCount >= allSections.length

  return (
    <div className="min-h-screen">
      {/* Top bar */}
      <ChapterTopBar
        workId={storyId}
        chapterId={allSections[currentVisibleIndex]?.id || initialChapterId}
        isBookmarked={isBookmarked}
        isLiked={isLiked}
        isSubscribed={isSubscribed}
        onBookmark={async () => {
          const next = !isBookmarked; setIsBookmarked(next)
          try {
            const res = await fetch('/api/bookmarks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ workId: storyId }) })
            const data = await res.json()
            if (data?.data?.bookmarked !== undefined) setIsBookmarked(data.data.bookmarked)
          } catch { setIsBookmarked(!next) }
        }}
        onLike={async () => {
          const next = !isLiked; setIsLiked(next)
          try {
            const res = await fetch('/api/likes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ workId: storyId }) })
            const data = await res.json()
            if (data?.data?.liked !== undefined) setIsLiked(data.data.liked)
          } catch { setIsLiked(!next) }
        }}
        onSubscribe={async () => {
          if (!work?.authorId) return
          const next = !isSubscribed; setIsSubscribed(next)
          try {
            const res = await fetch('/api/subscriptions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ authorId: work.authorId }) })
            const data = await res.json()
            if (data?.data?.subscribed !== undefined) setIsSubscribed(data.data.subscribed)
          } catch { setIsSubscribed(!next) }
        }}
        audioEnabled={false}
        onAudioToggle={() => {}}
        targetLanguage={targetLanguage}
        onTargetLanguageChange={setTargetLanguage}
        onOpenSettings={() => setShowSettingsDrawer(true)}
        onOpenGlossary={() => setShowMobileGlossary(true)}
      />

      {/* Settings drawer */}
      {showSettingsDrawer && (
        <ChapterReaderSettings
          settings={settings}
          onChange={setSettings}
          onClose={() => setShowSettingsDrawer(false)}
        />
      )}

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4">
        {/* Mode toggle */}
        <div className="flex items-center justify-between py-3 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            📜 Continuous scroll
          </span>
          <button
            onClick={onTogglePaginated}
            className="text-blue-500 hover:text-blue-600 underline"
          >
            Switch to paginated
          </button>
        </div>

        {allSections.map((sec, index) => {
          const section = loadedSections[index]
          const isVisible = index >= currentVisibleIndex - 2 && index <= currentVisibleIndex + 5

          return (
            <div key={sec.id} data-chapter-index={index}>
              {/* Chapter separator */}
              <div className="py-6 border-t border-gray-200 dark:border-gray-700">
                <div className="text-center">
                  <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Chapter {sec.chapterNumber || index + 1}
                  </span>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-1">
                    {section?.title || sec.title || `Chapter ${sec.chapterNumber || index + 1}`}
                  </h2>
                </div>
              </div>

              {/* Chapter content */}
              <div className={`${getThemeColors()} rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6`}>
                {section ? (
                  <div style={getLineHeightStyle()} className={`${getFontSizeClass()} reader-content prose dark:prose-invert max-w-none`}>
                    {section.content && Array.isArray(section.content) ? (
                      section.content.map((block: any, bi: number) => (
                        <ChapterBlockRenderer {...({key: bi, block, glossaryTerms: initialGlossary, characters: initialCharacters} as any)} />
                      ))
                    ) : (
                      <p className="text-gray-500 italic">This chapter has no content yet.</p>
                    )}
                  </div>
                ) : (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500" />
                  </div>
                )}
              </div>

              {/* Ad slot every 3 chapters */}
              {(index + 1) % 3 === 0 && index < allSections.length - 1 && (
                <div className="mb-6">
                  <AdSlot placement="inline" maturityRating={work.maturityRating as any} />
                </div>
              )}
            </div>
          )
        })}

        {/* Sentinel for infinite loading */}
        {!allLoaded && (
          <div ref={sentinelRef} className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500" />
          </div>
        )}

        {/* End of story */}
        {allLoaded && (
          <div className="text-center py-12 border-t border-gray-200 dark:border-gray-700">
            <p className="text-gray-400 text-sm mb-2">You&apos;ve reached the end</p>
            <ChapterReactionBar {...({workId: storyId, chapterId: allSections[allSections.length - 1]?.id || initialChapterId} as any)} />
          </div>
        )}

        {/* Comments */}
        <div className="mt-8 mb-16">
          <button
            onClick={() => setShowComments(!showComments)}
            className="text-sm text-blue-500 hover:text-blue-600 underline mb-4"
          >
            {showComments ? 'Hide Comments' : 'Show Comments'}
          </button>
          {showComments && (
            <CommentSection
              workId={storyId}
              sectionId={allSections[currentVisibleIndex]?.id || initialChapterId}
              canComment={false}
            />
          )}
        </div>
      </div>

      {/* Mobile glossary */}
      <ChapterMobileGlossary
        show={showMobileGlossary}
        onClose={() => setShowMobileGlossary(false)}
        characters={initialCharacters}
        glossaryTerms={initialGlossary}
        onCharacterSelect={(char) => setSelectedCharacterProfile(char)}
      />
    </div>
  )
}
