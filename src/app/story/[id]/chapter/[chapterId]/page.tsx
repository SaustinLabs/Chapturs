'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import AppLayout from '@/components/AppLayout'
import ChapterBlockRenderer from '@/components/ChapterBlockRenderer'
import ChapterTopBar from '@/components/ChapterTopBar'
import StickyAudioScrubber from '@/components/StickyAudioScrubber'
import WorkRatingSystem from '@/components/WorkRatingSystem'
import CommentSection from '@/components/CommentSection'
import SelectionActionToolbar from '@/components/SelectionActionToolbar'
import ImageUpload from '@/components/upload/ImageUpload'
import CharacterProfileViewModal from '@/components/CharacterProfileViewModal'
import { Work, Section } from '@/types'
import DataService from '@/lib/api/DataService'
import { useSession } from 'next-auth/react'
import { 
  ChevronLeftIcon,
  ChevronRightIcon,
  ListBulletIcon,
  MinusIcon,
  PlusIcon,
} from '@heroicons/react/24/outline'
import { MessageSquare, Send, Sparkles } from 'lucide-react'

interface ReaderCharacter {
  id: string
  name: string
  aliases?: string[]
  allowUserSubmissions?: boolean
  workId?: string
  [key: string]: any
}

interface ReaderGlossaryTerm {
  id?: string
  term: string
  definition: string
  category?: string
  firstMentionedChapter?: number
}

export default function ChapterPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const storyId = params?.id as string
  const chapterId = params?.chapterId as string
  
  const [work, setWork] = useState<Work | null>(null)
  const [section, setSection] = useState<Section | null>(null)
  const [allSections, setAllSections] = useState<Section[]>([])
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0)
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [isLiked, setIsLiked] = useState(false)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [audioEnabled, setAudioEnabled] = useState(false)
  const [currentAudiobookId, setCurrentAudiobookId] = useState<string | null>(null)
  const [currentNarratorName, setCurrentNarratorName] = useState('Official AI Voice')
  const [showChapterList, setShowChapterList] = useState(false)
  const [readingSettings, setReadingSettings] = useState({
    fontSize: 'medium',
    fontFamily: 'Inter',
    lineHeight: 1.7,
    theme: 'auto'
  })
  const [targetLanguage, setTargetLanguage] = useState('en')
  const [baseSection, setBaseSection] = useState<Section | null>(null)
  const [loading, setLoading] = useState(true)
  const [characters, setCharacters] = useState<ReaderCharacter[]>([])
  const [glossaryTerms, setGlossaryTerms] = useState<ReaderGlossaryTerm[]>([])
  const [selectedText, setSelectedText] = useState('')
  const [selectionPosition, setSelectionPosition] = useState({ top: 0, left: 0 })
  const [fanArtCharacterOptions, setFanArtCharacterOptions] = useState<ReaderCharacter[]>([])
  const [showQuickComment, setShowQuickComment] = useState(false)
  const [quickCommentText, setQuickCommentText] = useState('')
  const [quickCommentError, setQuickCommentError] = useState('')
  const [submittingQuickComment, setSubmittingQuickComment] = useState(false)
  const [showFanArtUploadModal, setShowFanArtUploadModal] = useState(false)
  const [fanArtTargetCharacterId, setFanArtTargetCharacterId] = useState<string | null>(null)
  const [fanArtTargetCharacterName, setFanArtTargetCharacterName] = useState('')
  const [fanArtSubmission, setFanArtSubmission] = useState({
    imageUrl: '',
    artistName: '',
    artistLink: '',
    artistHandle: '',
    notes: ''
  })
  const [fanArtSubmitError, setFanArtSubmitError] = useState('')
  const [fanArtSubmitting, setFanArtSubmitting] = useState(false)
  const [commentsRefreshKey, setCommentsRefreshKey] = useState(0)
  const [selectionRects, setSelectionRects] = useState<Array<{ top: number; left: number; width: number; height: number }>>([])
  const [readingProgress, setReadingProgress] = useState(0)
  const [showMobileGlossary, setShowMobileGlossary] = useState(false)
  const [mobileGlossaryTab, setMobileGlossaryTab] = useState<'characters' | 'terms'>('characters')
  const [mobileGlossaryQuery, setMobileGlossaryQuery] = useState('')
  const [focusedTerm, setFocusedTerm] = useState('')
  const [selectedCharacterProfile, setSelectedCharacterProfile] = useState<ReaderCharacter | null>(null)
  const [swipeHint, setSwipeHint] = useState('')
  const [showMiniMap, setShowMiniMap] = useState(false)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  const [showOnboardingHint, setShowOnboardingHint] = useState(false)
  const selectionRangeRef = useRef<Range | null>(null)
  const chapterContentRef = useRef<HTMLDivElement | null>(null)
  const swipeStartRef = useRef<{ x: number; y: number; t: number } | null>(null)
  const blockSwipeRef = useRef(false)
  const glossarySheetRef = useRef<HTMLDivElement | null>(null)
  const glossaryDragStartRef = useRef<{ y: number; t: number } | null>(null)

  const updateSelectionOverlay = () => {
    if (!selectionRangeRef.current) {
      setSelectionRects([])
      return
    }

    const rects = Array.from(selectionRangeRef.current.getClientRects())
      .filter((rect) => rect.width > 0 && rect.height > 0)
      .map((rect) => ({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      }))

    setSelectionRects(rects)
  }

  const triggerHaptic = (pattern: number | number[] = 10) => {
    if (prefersReducedMotion) return
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(pattern)
      }
    } catch {
      // Ignore unsupported haptic calls.
    }
  }

  useEffect(() => {
    if (typeof window === 'undefined') return
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const apply = () => setPrefersReducedMotion(media.matches)
    apply()
    media.addEventListener('change', apply)
    return () => media.removeEventListener('change', apply)
  }, [])

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)

        // Fetch work data
        const workData = await DataService.getWork(storyId)
        if (workData) {
          setWork(workData)

          // Fetch all sections for this work
          const response = await fetch(`/api/works/${storyId}/sections`)
          if (response.ok) {
            const responseData = await response.json()
            // Extract sections array from wrapped response
            const sectionsArray = responseData.sections || responseData || []
            setAllSections(sectionsArray)

            // Find the current section
            const foundSection = sectionsArray.find((s: Section) => s.id === chapterId)
            if (foundSection) {
              // Store original section as base for translations
              setBaseSection(foundSection)
              setSection(foundSection)
              // rest...
              const chapterNum = foundSection.chapterNumber || 1
              try {
                const glossaryRes = await fetch(`/api/works/${storyId}/glossary?chapter=${chapterNum}`)
                if (glossaryRes.ok) {
                  const glossaryData = await glossaryRes.json()
                  const entries = glossaryData?.entries || []
                  setGlossaryTerms(entries)
                  try { (window as any).__CURRENT_GLOSSARY_TERMS__ = entries } catch (e) {}
                }
              } catch (e) {
                console.error('Failed to load glossary:', e)
              }
              
              // Fetch chapter-aware character profiles
              try {
                const charactersRes = await fetch(`/api/works/${storyId}/characters?chapter=${chapterNum}`)
                if (charactersRes.ok) {
                  const charactersData = await charactersRes.json()
                  const characters = charactersData?.characters || []
                  setCharacters(characters)
                  try { (window as any).__CURRENT_CHARACTERS__ = characters } catch (e) {}
                }
              } catch (e) {
                console.error('Failed to load characters:', e)
              }
              
              console.log('Found section:', foundSection)
              console.log('Section content type:', typeof foundSection.content)
              console.log('Section content:', foundSection.content)
              
              // Parse content if it's a string
              if (typeof foundSection.content === 'string') {
                try {
                  foundSection.content = JSON.parse(foundSection.content)
                  console.log('Parsed content:', foundSection.content)
                } catch (error) {
                  console.error('Failed to parse section content:', error)
                }
              }
              
              console.log('Final content is array?', Array.isArray(foundSection.content))
              setSection(foundSection)
              const index = sectionsArray.findIndex((s: Section) => s.id === chapterId)
              setCurrentSectionIndex(index)

              try {
                window.localStorage.setItem(`reader-last-chapter-${storyId}`, foundSection.id)
              } catch (error) {
                console.error('Failed to save last read chapter:', error)
              }

              // Track view
              try {
                fetch(`/api/works/${storyId}/view`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ sectionId: chapterId })
                })
              } catch (e) {
                console.error('Failed to track view:', e)
              }
            }
          }
        }
      } catch (error) {
        console.error('Failed to load chapter data:', error)
      } finally {
        setLoading(false)
      }
    }

    if (storyId && chapterId) {
      loadData()
    }
  }, [storyId, chapterId])

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem('reader-settings-v1')
      if (!stored) return
      const parsed = JSON.parse(stored)
      setReadingSettings((prev) => ({
        ...prev,
        fontSize: parsed?.fontSize || prev.fontSize,
        lineHeight: typeof parsed?.lineHeight === 'number' ? parsed.lineHeight : prev.lineHeight,
        theme: parsed?.theme || prev.theme,
      }))
    } catch (error) {
      console.error('Failed to restore reader settings:', error)
    }
  }, [])

  useEffect(() => {
    try {
      window.localStorage.setItem(
        'reader-settings-v1',
        JSON.stringify({
          fontSize: readingSettings.fontSize,
          lineHeight: readingSettings.lineHeight,
          theme: readingSettings.theme,
        })
      )
    } catch (error) {
      console.error('Failed to store reader settings:', error)
    }
  }, [readingSettings])

  // Fetch translated content when targetLanguage changes
  useEffect(() => {
    if (!baseSection || !storyId || !chapterId) return

    if (targetLanguage === 'en') {
      setSection(baseSection)
      return
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)

    const fetchTranslation = async () => {
      try {
        const res = await fetch(`/api/chapter/${storyId}/${chapterId}/content?lang=${targetLanguage}`, {
          signal: controller.signal,
        })
        if (res.ok) {
          const data = await res.json()
          if (data.title && data.content && Array.isArray(data.content) && data.content.length > 0) {
            setSection(prev => ({
              ...baseSection,
              title: data.title,
              content: data.content
            }))
          } else {
            console.log('No translation content available')
          }
        } else {
          console.error('Translation fetch failed:', res.status)
        }
      } catch (e) {
        if (e.name === 'AbortError') {
          console.error('Translation fetch timed out after 5 seconds')
        } else {
          console.error('Translation fetch error:', e)
        }
      } finally {
        clearTimeout(timeoutId)
      }
    }

    fetchTranslation()

    return () => {
      clearTimeout(timeoutId)
      controller.abort()
    }
  }, [targetLanguage, baseSection, storyId, chapterId])

  useEffect(() => {
    const handleTextSelection = () => {
      const selection = window.getSelection()
      if (!selection || selection.isCollapsed || !selection.toString().trim()) {
        return
      }

      const selectedString = selection.toString().trim()
      const range = selection.getRangeAt(0)
      selectionRangeRef.current = range.cloneRange()
      const rect = range.getBoundingClientRect()

      setSelectedText(selectedString)
      setSelectionPosition({
        top: rect.bottom + window.scrollY + 10,
        left: rect.left + window.scrollX
      })
      updateSelectionOverlay()

      requestAnimationFrame(() => {
        const activeSelection = window.getSelection()
        if (!activeSelection || !selectionRangeRef.current) return
        activeSelection.removeAllRanges()
        activeSelection.addRange(selectionRangeRef.current)
      })
    }

    globalThis.document.addEventListener('mouseup', handleTextSelection)
    globalThis.document.addEventListener('touchend', handleTextSelection)

    return () => {
      globalThis.document.removeEventListener('mouseup', handleTextSelection)
      globalThis.document.removeEventListener('touchend', handleTextSelection)
    }
  }, [])

  useEffect(() => {
    if (!selectedText || !selectionRangeRef.current) return

    // Re-apply native selection after component rerenders so highlight remains visible.
    requestAnimationFrame(() => {
      restoreSelectionHighlight()
      updateSelectionOverlay()
    })
  }, [selectedText, selectionPosition, showQuickComment])

  useEffect(() => {
    if (!selectedText) return

    const handleViewportChange = () => {
      updateSelectionOverlay()
    }

    window.addEventListener('scroll', handleViewportChange, true)
    window.addEventListener('resize', handleViewportChange)

    return () => {
      window.removeEventListener('scroll', handleViewportChange, true)
      window.removeEventListener('resize', handleViewportChange)
    }
  }, [selectedText])

  useEffect(() => {
    const calculateProgress = () => {
      if (!chapterContentRef.current) return

      const rect = chapterContentRef.current.getBoundingClientRect()
      const viewportHeight = window.innerHeight
      const totalScrollable = rect.height + viewportHeight
      if (totalScrollable <= 0) {
        setReadingProgress(0)
        return
      }

      const travelled = viewportHeight - rect.top
      const nextProgress = Math.min(100, Math.max(0, (travelled / totalScrollable) * 100))
      setReadingProgress(nextProgress)
    }

    calculateProgress()
    window.addEventListener('scroll', calculateProgress, true)
    window.addEventListener('resize', calculateProgress)

    return () => {
      window.removeEventListener('scroll', calculateProgress, true)
      window.removeEventListener('resize', calculateProgress)
    }
  }, [section?.id])

  useEffect(() => {
    if (loading || !section) return
    if (window.location.hash !== '#comments') return

    const timeout = setTimeout(() => {
      const commentsEl = document.getElementById('comments')
      commentsEl?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 60)

    return () => clearTimeout(timeout)
  }, [loading, section])

  useEffect(() => {
    const handleOpenGlossaryEvent = (event: Event) => {
      const customEvent = event as CustomEvent
      const detail = customEvent?.detail || {}
      setShowMobileGlossary(true)
      triggerHaptic([10, 30, 10])

      if (detail.type === 'term') {
        setMobileGlossaryTab('terms')
        if (detail.term) {
          setFocusedTerm(detail.term)
          setMobileGlossaryQuery(detail.term)
        }
      } else {
        setMobileGlossaryTab('characters')
        if (detail.characterName) {
          setMobileGlossaryQuery(detail.characterName)
        }
      }
    }

    window.addEventListener('reader-open-mobile-glossary', handleOpenGlossaryEvent as EventListener)
    return () => {
      window.removeEventListener('reader-open-mobile-glossary', handleOpenGlossaryEvent as EventListener)
    }
  }, [])

  useEffect(() => {
    const isSwipeBlocked = () => {
      return (
        showChapterList ||
        showQuickComment ||
        showFanArtUploadModal ||
        showMobileGlossary ||
        fanArtCharacterOptions.length > 0 ||
        Boolean(selectedCharacterProfile)
      )
    }

    const shouldIgnoreTarget = (target: EventTarget | null) => {
      if (!(target instanceof HTMLElement)) return false
      const interactive = target.closest('input, textarea, button, a, select, [role="button"], [contenteditable="true"]')
      return Boolean(interactive)
    }

    const handleTouchStart = (event: TouchEvent) => {
      if (event.touches.length !== 1) return
      if (window.innerWidth >= 1024) return

      const touch = event.touches[0]
      swipeStartRef.current = { x: touch.clientX, y: touch.clientY, t: Date.now() }
      blockSwipeRef.current = shouldIgnoreTarget(event.target) || isSwipeBlocked()
    }

    const handleTouchEnd = (event: TouchEvent) => {
      if (!swipeStartRef.current || blockSwipeRef.current) {
        swipeStartRef.current = null
        blockSwipeRef.current = false
        return
      }

      if (event.changedTouches.length !== 1) return

      const touch = event.changedTouches[0]
      const dx = touch.clientX - swipeStartRef.current.x
      const dy = touch.clientY - swipeStartRef.current.y
      const dt = Date.now() - swipeStartRef.current.t

      swipeStartRef.current = null

      if (dt > 700) return
      if (Math.abs(dx) < 72) return
      if (Math.abs(dx) < Math.abs(dy) * 1.4) return

      if (dx < 0) {
        if (currentSectionIndex < allSections.length - 1) {
          triggerHaptic(12)
          goToNext()
        } else {
          setSwipeHint('You are on the last chapter')
          triggerHaptic([8, 30, 8])
        }
        return
      }

      if (dx > 0) {
        if (currentSectionIndex > 0) {
          triggerHaptic(12)
          goToPrevious()
        } else {
          setSwipeHint('You are on the first chapter')
          triggerHaptic([8, 30, 8])
        }
      }
    }

    window.addEventListener('touchstart', handleTouchStart, { passive: true })
    window.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      window.removeEventListener('touchstart', handleTouchStart)
      window.removeEventListener('touchend', handleTouchEnd)
    }
  }, [
    allSections.length,
    currentSectionIndex,
    fanArtCharacterOptions.length,
    selectedCharacterProfile,
    showChapterList,
    showFanArtUploadModal,
    showMobileGlossary,
    showQuickComment,
  ])

  useEffect(() => {
    if (!swipeHint) return
    const timeout = setTimeout(() => setSwipeHint(''), 1500)
    return () => clearTimeout(timeout)
  }, [swipeHint])

  useEffect(() => {
    if (loading || !section) return
    try {
      const seen = window.localStorage.getItem('reader-onboarding-v1')
      if (!seen) {
        const timeout = setTimeout(() => setShowOnboardingHint(true), 900)
        return () => clearTimeout(timeout)
      }
    } catch {
      // ignore storage errors
    }
  }, [loading, section])

  const dismissOnboarding = () => {
    setShowOnboardingHint(false)
    try { window.localStorage.setItem('reader-onboarding-v1', '1') } catch {}
  }

  const clearSelection = () => {
    selectionRangeRef.current = null
    setSelectedText('')
    setSelectionRects([])
    setShowQuickComment(false)
    setQuickCommentError('')
  }

  const restoreSelectionHighlight = () => {
    const activeSelection = window.getSelection()
    if (!activeSelection || !selectionRangeRef.current) return
    activeSelection.removeAllRanges()
    activeSelection.addRange(selectionRangeRef.current)
  }

  const submitQuickComment = async () => {
    const content = quickCommentText.trim()
    if (!content) {
      setQuickCommentError('Please write a comment first.')
      return
    }

    if (!session?.user?.id) {
      setQuickCommentError('Please sign in to comment.')
      return
    }

    setSubmittingQuickComment(true)
    setQuickCommentError('')

    try {
      const quotedPrefix = selectedText ? `"${selectedText}"\n\n` : ''
      const response = await fetch(`/api/works/${storyId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sectionId: chapterId,
          content: `${quotedPrefix}${content}`
        })
      })

      const data = await response.json()
      if (!response.ok) {
        setQuickCommentError(data?.error || 'Failed to post comment.')
        return
      }

      setShowQuickComment(false)
      setQuickCommentText('')
      setSelectedText('')
      setCommentsRefreshKey((value) => value + 1)
    } catch (error) {
      console.error('Failed to submit quick comment:', error)
      setQuickCommentError('Failed to post comment. Please try again.')
    } finally {
      setSubmittingQuickComment(false)
    }
  }

  const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim()

  const openFanArtUploadModal = (characterName: string, characterId?: string) => {
    setFanArtTargetCharacterName(characterName)
    setFanArtTargetCharacterId(characterId || null)
    setFanArtSubmitError('')
    setFanArtSubmission({
      imageUrl: '',
      artistName: '',
      artistLink: '',
      artistHandle: '',
      notes: ''
    })
    setShowFanArtUploadModal(true)
  }

  const submitFanArt = async () => {
    if (!session?.user?.id) {
      setFanArtSubmitError('Please sign in to submit fan art.')
      return
    }

    if (!fanArtSubmission.imageUrl || !fanArtSubmission.artistName.trim()) {
      setFanArtSubmitError('Image and artist name are required.')
      return
    }

    if (!fanArtTargetCharacterName.trim() && !fanArtTargetCharacterId) {
      setFanArtSubmitError('Character name is required.')
      return
    }

    setFanArtSubmitting(true)
    setFanArtSubmitError('')

    try {
      const response = await fetch(`/api/works/${storyId}/fanart`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sectionId: chapterId,
          selectedText,
          characterId: fanArtTargetCharacterId,
          characterName: fanArtTargetCharacterName.trim(),
          ...fanArtSubmission
        })
      })

      const data = await response.json()
      if (!response.ok) {
        setFanArtSubmitError(data?.error || 'Failed to submit fan art.')
        return
      }

      setShowFanArtUploadModal(false)
      setFanArtCharacterOptions([])
      clearSelection()
      alert(data?.message || 'Fan art submitted. The author will review it.')
    } catch (error) {
      console.error('Fan art submission failed:', error)
      setFanArtSubmitError('Failed to submit fan art. Please try again.')
    } finally {
      setFanArtSubmitting(false)
    }
  }

  const resolveCharacterFromSelection = () => {
    const selected = normalize(selectedText)
    if (!selected) return null

    return (
      characters.find((char) => {
        const directMatch = normalize(char.name || '') === selected
        const aliasMatch = Array.isArray(char.aliases)
          ? char.aliases.some((alias) => normalize(alias) === selected)
          : false
        return directMatch || aliasMatch
      }) || null
    )
  }

  const getFuzzyCharacterMatches = () => {
    const selected = normalize(selectedText)
    if (!selected) return []
    const selectedTokens = selected.split(/\s+/).filter(Boolean)

    return characters
      .map((char) => {
        const candidateNames = [char.name, ...(char.aliases || [])].filter(Boolean)
        const bestScore = candidateNames.reduce((score, rawCandidate) => {
          const candidate = normalize(rawCandidate)
          if (!candidate) return score

          if (candidate === selected) return Math.max(score, 1)
          if (candidate.includes(selected) || selected.includes(candidate)) return Math.max(score, 0.78)

          const candidateTokens = candidate.split(/\s+/).filter(Boolean)
          const overlap = selectedTokens.filter((token) => candidateTokens.includes(token)).length
          if (overlap > 0) {
            const tokenScore = overlap / Math.max(selectedTokens.length, candidateTokens.length)
            return Math.max(score, tokenScore * 0.72)
          }

          return score
        }, 0)

        return { char, score: bestScore }
      })
      .filter((entry) => entry.score >= 0.55)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map((entry) => entry.char)
  }

  const handleFanArtIntent = () => {
    const matched = resolveCharacterFromSelection()
    if (matched) {
      openFanArtUploadModal(matched.name, matched.id)
      return
    }

    const fuzzy = getFuzzyCharacterMatches()
    if (fuzzy.length === 1) {
      openFanArtUploadModal(fuzzy[0].name, fuzzy[0].id)
      return
    }

    if (fuzzy.length > 1) {
      setFanArtCharacterOptions(fuzzy)
      return
    }

    if (selectedText.trim()) {
      openFanArtUploadModal(selectedText.trim())
      return
    }

    alert('No matching character found in this chapter selection. Try selecting the exact character name.')
  }

  const navigateToSection = (newIndex: number) => {
    if (newIndex >= 0 && newIndex < allSections.length) {
      const newSection = allSections[newIndex]
      triggerHaptic(14)
      router.push(`/story/${storyId}/chapter/${newSection.id}`)
    }
  }

  const goToPrevious = () => {
    navigateToSection(currentSectionIndex - 1)
  }

  const goToNext = () => {
    navigateToSection(currentSectionIndex + 1)
  }

  const getFontSizeClass = () => {
    switch (readingSettings.fontSize) {
      case 'small': return 'text-sm'
      case 'large': return 'text-lg'
      case 'xl': return 'text-xl'
      default: return 'text-base'
    }
  }

  const getLineHeightStyle = () => ({
    lineHeight: readingSettings.lineHeight
  })

  const shiftFontSize = (direction: -1 | 1) => {
    const options = ['small', 'medium', 'large', 'xl'] as const
    const currentIndex = options.indexOf(readingSettings.fontSize as (typeof options)[number])
    const safeIndex = currentIndex === -1 ? 1 : currentIndex
    const nextIndex = Math.max(0, Math.min(options.length - 1, safeIndex + direction))

    setReadingSettings((prev) => ({
      ...prev,
      fontSize: options[nextIndex]
    }))
    triggerHaptic(8)
  }

  const jumpToChapterPercent = (percent: number) => {
    if (!chapterContentRef.current) return
    const rect = chapterContentRef.current.getBoundingClientRect()
    const chapterTop = window.scrollY + rect.top
    const target = chapterTop + chapterContentRef.current.offsetHeight * percent - 90
    window.scrollTo({ top: Math.max(0, target), behavior: 'smooth' })
    setSwipeHint(`Jumped to ${Math.round(percent * 100)}%`)
    triggerHaptic([8, 24, 8])
  }

  const filteredCharacters = characters.filter((character) => {
    if (!mobileGlossaryQuery.trim()) return true
    const query = mobileGlossaryQuery.toLowerCase()
    return (
      character.name?.toLowerCase().includes(query) ||
      (character.aliases || []).some((alias) => alias.toLowerCase().includes(query))
    )
  })

  const filteredTerms = glossaryTerms.filter((term) => {
    if (!mobileGlossaryQuery.trim()) return true
    const query = mobileGlossaryQuery.toLowerCase()
    return (
      term.term?.toLowerCase().includes(query) ||
      term.definition?.toLowerCase().includes(query) ||
      term.category?.toLowerCase().includes(query)
    )
  })

  if (!work || !section) {
    return (
      <AppLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      {/* Fan Content Top Bar */}
      <ChapterTopBar
        workId={storyId}
        chapterId={chapterId}
        isBookmarked={isBookmarked}
        isLiked={isLiked}
        isSubscribed={isSubscribed}
        onBookmark={() => setIsBookmarked(!isBookmarked)}
        onLike={() => setIsLiked(!isLiked)}
        onSubscribe={() => setIsSubscribed(!isSubscribed)}
        audioEnabled={audioEnabled}
        onAudioToggle={() => setAudioEnabled(!audioEnabled)}
        targetLanguage={targetLanguage}
        onTargetLanguageChange={setTargetLanguage}
      />

      {/* Sticky Audio Scrubber (shown when audio is enabled) */}
      {audioEnabled && currentAudiobookId && (
        <StickyAudioScrubber
          audiobookId={currentAudiobookId}
          workId={storyId}
          chapterId={chapterId}
          narratorName={currentNarratorName}
          onMinimize={() => setAudioEnabled(false)}
          onNarratorChange={() => {
            // This would open the audiobook selector menu
            // For now, just a placeholder
          }}
        />
      )}

      <div className="max-w-4xl mx-auto pb-28 md:pb-0">
        <div className="sticky top-[64px] z-20 mb-4 mt-4 px-2">
          <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] uppercase tracking-wide text-gray-500 dark:text-gray-400">Reading Progress</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                  Chapter {section.chapterNumber}: {section.title}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => shiftFontSize(-1)}
                  className="p-1.5 rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                  aria-label="Decrease font size"
                >
                  <MinusIcon className="w-4 h-4" />
                </button>
                <span className="text-xs text-gray-600 dark:text-gray-300 w-10 text-center capitalize">
                  {readingSettings.fontSize}
                </span>
                <button
                  type="button"
                  onClick={() => shiftFontSize(1)}
                  className="p-1.5 rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                  aria-label="Increase font size"
                >
                  <PlusIcon className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="mt-2">
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-200"
                  style={{ width: `${readingProgress}%` }}
                />
              </div>
              <div className="mt-1 text-[11px] text-gray-600 dark:text-gray-400 text-right">
                {Math.round(readingProgress)}%
              </div>
            </div>
          </div>
        </div>

        {selectionRects.length > 0 && (
          <div className="pointer-events-none fixed inset-0 z-30">
            {selectionRects.map((rect, index) => (
              <div
                key={`selection-rect-${index}`}
                className="absolute rounded-sm"
                style={{
                  top: rect.top,
                  left: rect.left,
                  width: rect.width,
                  height: rect.height,
                  background: 'rgba(59, 130, 246, 0.22)',
                  boxShadow: 'inset 0 -2px 0 rgba(37, 99, 235, 0.65)'
                }}
              />
            ))}
          </div>
        )}

        {/* Chapter Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6 mt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => window.location.href = `/story/${storyId}`}
                className="text-blue-500 hover:text-blue-600 text-sm font-medium"
              >
                ← Back to Story
              </button>
              <div className="h-4 border-l border-gray-300 dark:border-gray-600"></div>
              <button
                onClick={() => setShowChapterList(!showChapterList)}
                className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                <ListBulletIcon className="w-5 h-5" />
                <span className="text-sm">Chapters</span>
              </button>
            </div>
          </div>

          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {work.title}
            </h1>
            <h2 className="text-xl text-gray-700 dark:text-gray-300">
              Chapter {section.chapterNumber}: {section.title}
            </h2>
          </div>
        </div>

        {/* Chapter List Dropdown */}
        {showChapterList && (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 mb-6 max-h-96 overflow-y-auto">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white">All Chapters</h3>
            </div>
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {allSections.map((sec, index) => (
                <button
                  key={sec.id}
                  onClick={() => {
                    setShowChapterList(false)
                    navigateToSection(index)
                  }}
                  className={`w-full text-left p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                    sec.id === section.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                  }`}
                >
                  <div className="font-medium text-gray-900 dark:text-white">
                    Chapter {sec.chapterNumber}: {sec.title}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {sec.wordCount} words • {sec.publishedAt ? new Date(sec.publishedAt).toLocaleDateString() : 'Draft'}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Chapter Content */}
        <div ref={chapterContentRef} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 mb-6">
          <div
            className={`${getFontSizeClass()} text-gray-900 dark:text-gray-100`}
            style={getLineHeightStyle()}
          >
            <ChapterBlockRenderer 
              content={Array.isArray(section.content) ? section.content : []}
            />
          </div>
        </div>

        {/* Navigation Footer */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <button
              onClick={goToPrevious}
              disabled={currentSectionIndex === 0}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeftIcon className="w-5 h-5" />
              <span>Previous</span>
            </button>

            <div className="text-center">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Chapter {currentSectionIndex + 1} of {allSections.length}
              </div>
              <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                {section.wordCount} words
              </div>
            </div>

            <button
              onClick={goToNext}
              disabled={currentSectionIndex === allSections.length - 1}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              <span>Next</span>
              <ChevronRightIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4 mb-12 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentSectionIndex + 1) / allSections.length) * 100}%` }}
          ></div>
        </div>

        {/* Rating Section */}
        <div className="max-w-2xl mx-auto mt-12 mb-24">
          <WorkRatingSystem workId={storyId} />
        </div>

        <div id="comments" className="max-w-2xl mx-auto mt-12 mb-24 scroll-mt-24">
          <CommentSection
            key={`chapter-comments-${commentsRefreshKey}`}
            workId={storyId}
            sectionId={chapterId}
            canComment={Boolean(session?.user?.id)}
            currentUserId={session?.user?.id}
          />
        </div>

        <SelectionActionToolbar
          visible={Boolean(selectedText)}
          position={selectionPosition}
          actions={[
            {
              id: 'comment',
              label: 'Comment',
              icon: <MessageSquare size={14} />,
              onClick: () => {
                if (!session?.user?.id) {
                  const commentsEl = document.getElementById('comments')
                  if (commentsEl) {
                    window.history.replaceState(null, '', '#comments')
                    commentsEl.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  }
                  return
                }

                setQuickCommentError('')
                setShowQuickComment(true)
                triggerHaptic(10)
                requestAnimationFrame(restoreSelectionHighlight)
              },
              variant: 'primary'
            },
            {
              id: 'fan-art',
              label: 'Submit Art',
              icon: <Sparkles size={14} />,
              onClick: () => {
                triggerHaptic(10)
                handleFanArtIntent()
              },
              variant: 'primary',
              className: 'bg-emerald-600 hover:bg-emerald-700 border border-emerald-600'
            }
          ]}
          onClose={clearSelection}
        />

        {showQuickComment && Boolean(selectedText) && (
          <div
            className="fixed z-[60] w-[min(380px,90vw)] bg-white border border-gray-300 rounded-lg shadow-xl p-3 text-gray-900"
            style={{ top: selectionPosition.top + 46, left: selectionPosition.left }}
          >
            <div className="text-xs text-gray-700 mb-2 line-clamp-2">"{selectedText}"</div>
            <textarea
              value={quickCommentText}
              onChange={(event) => setQuickCommentText(event.target.value)}
              placeholder="Write your comment..."
              rows={4}
              maxLength={5000}
              className="w-full px-3 py-2 text-sm text-gray-900 placeholder:text-gray-500 bg-white border border-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="mt-1 text-[11px] text-gray-600">{quickCommentText.length}/5000</div>
            {quickCommentError && (
              <div className="mt-1 text-xs text-red-600">{quickCommentError}</div>
            )}
            <div className="mt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  setShowQuickComment(false)
                  setQuickCommentError('')
                }}
                className="px-3 py-1.5 text-sm text-gray-700 hover:text-gray-900"
              >
                Cancel
              </button>
              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={submitQuickComment}
                disabled={submittingQuickComment || !quickCommentText.trim()}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send size={14} />
                {submittingQuickComment ? 'Posting...' : 'Post'}
              </button>
            </div>
          </div>
        )}

        <div className="md:hidden fixed bottom-[max(0.75rem,env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 z-40 w-[min(94vw,420px)]">
          <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur border border-gray-200 dark:border-gray-700 rounded-2xl shadow-lg px-3 py-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                setShowChapterList((value) => !value)
                triggerHaptic(10)
              }}
              className="px-3 py-2 text-xs font-semibold text-gray-700 dark:text-gray-200"
            >
              Chapters
            </button>
            <button
              type="button"
              onClick={() => {
                setMobileGlossaryTab('characters')
                setShowMobileGlossary(true)
                triggerHaptic(10)
              }}
              className="px-3 py-2 text-xs font-semibold text-blue-700 dark:text-blue-300"
            >
              Glossary
            </button>
            <button
              type="button"
              onClick={() => {
                const commentsEl = document.getElementById('comments')
                commentsEl?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                triggerHaptic(10)
              }}
              className="px-3 py-2 text-xs font-semibold text-gray-700 dark:text-gray-200"
            >
              Comments
            </button>
            <button
              type="button"
              onClick={() => {
                setShowMiniMap((value) => !value)
                triggerHaptic(10)
              }}
              className="px-3 py-2 text-xs font-semibold text-gray-700 dark:text-gray-200"
            >
              Jump
            </button>
          </div>
        </div>

        {showMiniMap && (
          <div className="reader-sheet-rise md:hidden fixed bottom-20 right-3 z-[60] bg-white/95 dark:bg-gray-900/95 backdrop-blur border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg p-2">
            <div className="text-[10px] text-gray-500 dark:text-gray-400 px-1 pb-1">Chapter Jump</div>
            <div className="flex items-center gap-1">
              {[0.25, 0.5, 0.75, 1].map((percent) => (
                <button
                  key={percent}
                  type="button"
                  onClick={() => jumpToChapterPercent(percent)}
                  className="px-2 py-1 text-[11px] rounded-md bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200"
                >
                  {Math.round(percent * 100)}%
                </button>
              ))}
            </div>
          </div>
        )}

        {swipeHint && (
          <div className="md:hidden fixed top-24 left-1/2 -translate-x-1/2 z-[70] px-3 py-2 rounded-lg bg-gray-900 text-white text-xs shadow-lg">
            {swipeHint}
          </div>
        )}

        {showMobileGlossary && (
          <div
            className="fixed inset-0 z-[75] bg-black/55 flex items-end md:items-center justify-center"
            onClick={() => {
              setShowMobileGlossary(false)
              setFocusedTerm('')
              setMobileGlossaryQuery('')
            }}
          >
            <div
              ref={glossarySheetRef}
              className="reader-sheet-rise w-full md:max-w-2xl bg-white dark:bg-gray-900 rounded-t-2xl md:rounded-2xl border border-gray-200 dark:border-gray-700 shadow-2xl max-h-[85vh] overflow-hidden"
              onClick={(event) => event.stopPropagation()}
              onTouchStart={(event) => {
                if (event.touches.length !== 1) return
                glossaryDragStartRef.current = { y: event.touches[0].clientY, t: Date.now() }
              }}
              onTouchEnd={(event) => {
                if (!glossaryDragStartRef.current || event.changedTouches.length !== 1) return
                const dy = event.changedTouches[0].clientY - glossaryDragStartRef.current.y
                const dt = Date.now() - glossaryDragStartRef.current.t
                glossaryDragStartRef.current = null
                if (dy > 72 && dt < 500) {
                  setShowMobileGlossary(false)
                  setFocusedTerm('')
                  setMobileGlossaryQuery('')
                  triggerHaptic([8, 20, 8])
                }
              }}
            >
              <div className="py-2 flex justify-center">
                <div className="w-10 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600" />
              </div>
              <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Story Glossary</h3>
                <button
                  type="button"
                  onClick={() => {
                    setShowMobileGlossary(false)
                    setFocusedTerm('')
                    setMobileGlossaryQuery('')
                  }}
                  className="px-2 py-1 text-xs text-gray-600 dark:text-gray-300"
                >
                  Close
                </button>
              </div>

              <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => {
                      setMobileGlossaryTab('characters')
                      triggerHaptic(8)
                    }}
                    className={`transition-colors px-3 py-2 rounded-lg text-xs font-semibold ${
                      mobileGlossaryTab === 'characters'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    Characters ({characters.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileGlossaryTab('terms')
                      triggerHaptic(8)
                    }}
                    className={`transition-colors px-3 py-2 rounded-lg text-xs font-semibold ${
                      mobileGlossaryTab === 'terms'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    Terms ({glossaryTerms.length})
                  </button>
                </div>

                <input
                  type="text"
                  value={mobileGlossaryQuery}
                  onChange={(event) => setMobileGlossaryQuery(event.target.value)}
                  placeholder={mobileGlossaryTab === 'characters' ? 'Search characters...' : 'Search terms...'}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>

              <div className="overflow-y-auto p-4 space-y-3">
                {mobileGlossaryTab === 'characters' ? (
                  filteredCharacters.length > 0 ? (
                    filteredCharacters.map((character) => (
                      <button
                        key={character.id}
                        type="button"
                        onClick={() => setSelectedCharacterProfile(character)}
                        className="w-full text-left rounded-xl border border-gray-200 dark:border-gray-700 p-3 bg-gray-50 dark:bg-gray-800"
                      >
                        <div className="text-sm font-semibold text-gray-900 dark:text-white">{character.name}</div>
                        {character.quickGlance && (
                          <div className="text-xs mt-1 text-gray-600 dark:text-gray-300 line-clamp-2">{character.quickGlance}</div>
                        )}
                        {character.aliases && character.aliases.length > 0 && (
                          <div className="text-[11px] mt-1 text-gray-500 dark:text-gray-400">aka {character.aliases.slice(0, 3).join(', ')}</div>
                        )}
                      </button>
                    ))
                  ) : (
                    <div className="text-sm text-gray-500 dark:text-gray-400">No matching characters.</div>
                  )
                ) : filteredTerms.length > 0 ? (
                  filteredTerms.map((term) => (
                    <div
                      key={term.id || term.term}
                      className={`rounded-xl border p-3 ${
                        focusedTerm && focusedTerm.toLowerCase() === term.term.toLowerCase()
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800'
                      }`}
                    >
                      <div className="text-sm font-semibold text-gray-900 dark:text-white">{term.term}</div>
                      <div className="text-xs mt-1 text-gray-700 dark:text-gray-300">{term.definition}</div>
                      {term.category && (
                        <div className="text-[11px] mt-2 text-gray-500 dark:text-gray-400">Category: {term.category}</div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-gray-500 dark:text-gray-400">No matching glossary terms.</div>
                )}
              </div>
            </div>
          </div>
        )}

        {showOnboardingHint && (
          <div
            className="md:hidden fixed inset-0 z-[95] bg-black/75 flex flex-col items-center justify-center px-8 text-center"
            onClick={dismissOnboarding}
          >
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-sm shadow-2xl space-y-4">
              <h3 className="text-base font-bold text-gray-900 dark:text-white">Reader Controls</h3>
              <div className="space-y-3 text-left">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">👈👉</span>
                  <span className="text-sm text-gray-700 dark:text-gray-300">Swipe left/right to jump between chapters</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">👆</span>
                  <span className="text-sm text-gray-700 dark:text-gray-300">Tap highlighted names to view character profiles</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🤏</span>
                  <span className="text-sm text-gray-700 dark:text-gray-300">Pinch on a name to open the full glossary</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">⬇️</span>
                  <span className="text-sm text-gray-700 dark:text-gray-300">Swipe down on glossary to dismiss it</span>
                </div>
              </div>
              <button
                type="button"
                onClick={dismissOnboarding}
                className="w-full py-2.5 mt-2 rounded-xl bg-blue-600 text-white text-sm font-semibold"
              >
                Got it!
              </button>
            </div>
          </div>
        )}

        {selectedCharacterProfile && (
          <CharacterProfileViewModal
            character={selectedCharacterProfile as any}
            isOpen={Boolean(selectedCharacterProfile)}
            onClose={() => setSelectedCharacterProfile(null)}
          />
        )}

        {fanArtCharacterOptions.length > 0 && (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-lg shadow-xl border border-gray-300 p-4 text-gray-900">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-base font-semibold text-gray-900">Choose Character</h3>
                  <p className="text-sm text-gray-700">Select who this fan art is for.</p>
                </div>
                <button
                  onClick={() => setFanArtCharacterOptions([])}
                  className="p-1 text-gray-500 hover:text-gray-800"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-2">
                {fanArtCharacterOptions.map((character) => (
                  <button
                    key={character.id}
                    onClick={() => {
                      openFanArtUploadModal(character.name, character.id)
                      setFanArtCharacterOptions([])
                    }}
                    className="w-full text-left px-3 py-2 rounded border border-gray-300 hover:bg-gray-50"
                  >
                    <div className="font-medium text-gray-900">{character.name}</div>
                    {character.aliases && character.aliases.length > 0 && (
                      <div className="text-xs text-gray-700">aka {character.aliases.slice(0, 3).join(', ')}</div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {showFanArtUploadModal && (
          <div className="fixed inset-0 z-[70] bg-black/50 flex items-center justify-center p-4">
            <div className="w-full max-w-lg bg-white rounded-lg shadow-xl border border-gray-300 p-4 text-gray-900 max-h-[90vh] overflow-y-auto">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-base font-semibold text-gray-900">Submit Fan Art</h3>
                  <p className="text-sm text-gray-700">Submit now. The author can review and confirm character details later.</p>
                </div>
                <button
                  onClick={() => setShowFanArtUploadModal(false)}
                  className="p-1 text-gray-500 hover:text-gray-800"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-1">Character Name</label>
                  <input
                    type="text"
                    value={fanArtTargetCharacterName}
                    onChange={(event) => setFanArtTargetCharacterName(event.target.value)}
                    className="w-full px-3 py-2 text-sm text-gray-900 border border-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Character name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-1">Fan Art Image</label>
                  <ImageUpload
                    entityType="fanart"
                    entityId={fanArtTargetCharacterId || chapterId}
                    currentImage={fanArtSubmission.imageUrl}
                    onUploadComplete={(image) => {
                      setFanArtSubmission((prev) => ({ ...prev, imageUrl: image.urls.optimized }))
                    }}
                    onUploadError={(error) => {
                      console.error('Fan art upload error:', error)
                      setFanArtSubmitError(`Image upload failed: ${error}`)
                    }}
                    label="Upload Fan Art"
                    hint="Any size, 1200px recommended. Max 8MB."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-1">Artist Name</label>
                  <input
                    type="text"
                    value={fanArtSubmission.artistName}
                    onChange={(event) => setFanArtSubmission((prev) => ({ ...prev, artistName: event.target.value }))}
                    className="w-full px-3 py-2 text-sm text-gray-900 border border-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Your name or handle"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-1">Artist Link (Optional)</label>
                  <input
                    type="url"
                    value={fanArtSubmission.artistLink}
                    onChange={(event) => setFanArtSubmission((prev) => ({ ...prev, artistLink: event.target.value }))}
                    className="w-full px-3 py-2 text-sm text-gray-900 border border-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="https://your-portfolio.example"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-800 mb-1">Notes (Optional)</label>
                  <textarea
                    rows={3}
                    value={fanArtSubmission.notes}
                    onChange={(event) => setFanArtSubmission((prev) => ({ ...prev, notes: event.target.value }))}
                    className="w-full px-3 py-2 text-sm text-gray-900 border border-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Any context for the author"
                  />
                </div>

                {fanArtSubmitError && <div className="text-sm text-red-600">{fanArtSubmitError}</div>}

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    onClick={() => setShowFanArtUploadModal(false)}
                    className="px-3 py-1.5 text-sm text-gray-700 hover:text-gray-900"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={submitFanArt}
                    disabled={fanArtSubmitting}
                    className="px-3 py-1.5 text-sm bg-emerald-600 text-white rounded hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {fanArtSubmitting ? 'Submitting...' : 'Submit Art'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
