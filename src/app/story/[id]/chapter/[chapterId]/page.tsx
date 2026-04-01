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
import CharacterProfileViewModal from '@/components/CharacterProfileViewModal'
import { Work, Section } from '@/types'
import DataService from '@/lib/api/DataService'
import { useSession } from 'next-auth/react'
import { 
  ChevronLeftIcon,
  ChevronRightIcon,
  ListBulletIcon,
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
  const [selectedText, setSelectedText] = useState('')
  const [selectionPosition, setSelectionPosition] = useState({ top: 0, left: 0 })
  const [selectedCharacter, setSelectedCharacter] = useState<ReaderCharacter | null>(null)
  const [fanArtCharacterOptions, setFanArtCharacterOptions] = useState<ReaderCharacter[]>([])
  const [showQuickComment, setShowQuickComment] = useState(false)
  const [quickCommentText, setQuickCommentText] = useState('')
  const [quickCommentError, setQuickCommentError] = useState('')
  const [submittingQuickComment, setSubmittingQuickComment] = useState(false)
  const [commentsRefreshKey, setCommentsRefreshKey] = useState(0)
  const selectionRangeRef = useRef<Range | null>(null)

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
    if (loading || !section) return
    if (window.location.hash !== '#comments') return

    const timeout = setTimeout(() => {
      const commentsEl = document.getElementById('comments')
      commentsEl?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 60)

    return () => clearTimeout(timeout)
  }, [loading, section])

  const clearSelection = () => {
    selectionRangeRef.current = null
    setSelectedText('')
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
      setSelectedCharacter({ ...matched, workId: matched.workId || storyId })
      return
    }

    const fuzzy = getFuzzyCharacterMatches()
    if (fuzzy.length === 1) {
      setSelectedCharacter({ ...fuzzy[0], workId: fuzzy[0].workId || storyId })
      return
    }

    if (fuzzy.length > 1) {
      setFanArtCharacterOptions(fuzzy)
      return
    }

    alert('No matching character found in this chapter selection. Try selecting the exact character name.')
  }

  const navigateToSection = (newIndex: number) => {
    if (newIndex >= 0 && newIndex < allSections.length) {
      const newSection = allSections[newIndex]
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

      <div className="max-w-4xl mx-auto">
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
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 mb-6">
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
                requestAnimationFrame(restoreSelectionHighlight)
              },
              variant: 'primary'
            },
            {
              id: 'fan-art',
              label: 'Submit Art',
              icon: <Sparkles size={14} />,
              onClick: handleFanArtIntent,
              variant: 'primary',
              className: 'bg-emerald-600 hover:bg-emerald-700 border border-emerald-600'
            }
          ]}
          onClose={clearSelection}
        />

        {showQuickComment && Boolean(selectedText) && (
          <div
            className="fixed z-[60] w-[min(380px,90vw)] bg-white border border-gray-200 rounded-lg shadow-xl p-3"
            style={{ top: selectionPosition.top + 46, left: selectionPosition.left }}
          >
            <div className="text-xs text-gray-500 mb-2 line-clamp-2">"{selectedText}"</div>
            <textarea
              value={quickCommentText}
              onChange={(event) => setQuickCommentText(event.target.value)}
              placeholder="Write your comment..."
              rows={4}
              maxLength={5000}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="mt-1 text-[11px] text-gray-500">{quickCommentText.length}/5000</div>
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
                className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800"
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

        {selectedCharacter && (
          <CharacterProfileViewModal
            character={selectedCharacter}
            isOpen={Boolean(selectedCharacter)}
            onClose={() => setSelectedCharacter(null)}
          />
        )}

        {fanArtCharacterOptions.length > 0 && (
          <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white rounded-lg shadow-xl border border-gray-200 p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-base font-semibold text-gray-900">Choose Character</h3>
                  <p className="text-sm text-gray-600">Select who this fan art is for.</p>
                </div>
                <button
                  onClick={() => setFanArtCharacterOptions([])}
                  className="p-1 text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-2">
                {fanArtCharacterOptions.map((character) => (
                  <button
                    key={character.id}
                    onClick={() => {
                      setSelectedCharacter({ ...character, workId: character.workId || storyId })
                      setFanArtCharacterOptions([])
                    }}
                    className="w-full text-left px-3 py-2 rounded border border-gray-200 hover:bg-gray-50"
                  >
                    <div className="font-medium text-gray-900">{character.name}</div>
                    {character.aliases && character.aliases.length > 0 && (
                      <div className="text-xs text-gray-500">aka {character.aliases.slice(0, 3).join(', ')}</div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
