'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import AppLayout from '@/components/AppLayout'
import ChapterBlockRenderer from '@/components/ChapterBlockRenderer'
import ChapterTopBar from '@/components/ChapterTopBar'
import StickyAudioScrubber from '@/components/StickyAudioScrubber'
import WorkRatingSystem from '@/components/WorkRatingSystem'
import { Work, Section } from '@/types'
import DataService from '@/lib/api/DataService'
import { 
  ChevronLeftIcon,
  ChevronRightIcon,
  ListBulletIcon,
} from '@heroicons/react/24/outline'

export default function ChapterPage() {
  const params = useParams()
  const router = useRouter()
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
  const [loading, setLoading] = useState(true)

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
              // Fetch chapter-aware glossary definitions
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
      </div>
    </AppLayout>
  )
}
