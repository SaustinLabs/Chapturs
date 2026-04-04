'use client'

import { useState } from 'react'
import { 
  GlobeAltIcon,
  SpeakerWaveIcon,
  HeartIcon as HeartOutline,
  BookmarkIcon as BookmarkOutline,
  EllipsisHorizontalIcon,
} from '@heroicons/react/24/outline'
import {
  HeartIcon as HeartSolid,
  BookmarkIcon as BookmarkSolid,
} from '@heroicons/react/24/solid'
import LanguageSelectorMenu from './LanguageSelectorMenu'
import AudiobookSelectorMenu from './AudiobookSelectorMenu'
import TranslationSubmissionForm from './TranslationSubmissionForm'
import AudiobookSubmissionForm from './AudiobookSubmissionForm'
import { Tooltip } from '@/components/ui/Tooltip'

interface ChapterTopBarProps {
  workId: string
  chapterId: string
  isBookmarked: boolean
  isLiked: boolean
  isSubscribed: boolean
  onBookmark: () => void
  onLike: () => void
  onSubscribe: () => void
  audioEnabled: boolean
  onAudioToggle: () => void
  targetLanguage: string
  onTargetLanguageChange: (lang: string) => void
  onOpenSettings?: () => void
}

export default function ChapterTopBar({
  workId,
  chapterId,
  isBookmarked,
  isLiked,
  isSubscribed,
  onBookmark,
  onLike,
  onSubscribe,
  audioEnabled,
  onAudioToggle,
  targetLanguage,
  onTargetLanguageChange,
  onOpenSettings,
}: ChapterTopBarProps) {
  const [showLanguageMenu, setShowLanguageMenu] = useState(false)
  const [showAudiobookMenu, setShowAudiobookMenu] = useState(false)
  const [showMoreMenu, setShowMoreMenu] = useState(false)
  const [showTranslationForm, setShowTranslationForm] = useState(false)
  const [showAudiobookForm, setShowAudiobookForm] = useState(false)

  return (
    <div className="sticky top-0 z-40 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Left section: Language & Audio */}
          <div className="flex items-center space-x-2">
            {/* Language Selector */}
            <div className="relative">
              <Tooltip content="Read this chapter in another language. Community translators submit translations with the author's approval." side="bottom">
              <button
                onClick={() => {
                  setShowLanguageMenu(!showLanguageMenu)
                  setShowAudiobookMenu(false)
                  setShowMoreMenu(false)
                }}
                className={`flex items-center gap-1 px-2 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                  targetLanguage && targetLanguage !== 'en'
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-gray-500 dark:text-gray-400'
                }`}
                title={`Language: ${targetLanguage?.toUpperCase() || 'EN'}`}
              >
                <GlobeAltIcon className="w-5 h-5" />
                <span className="text-[11px] font-semibold uppercase tracking-wide">
                  {targetLanguage?.toUpperCase() || 'EN'}
                </span>
              </button>
              </Tooltip>

              {showLanguageMenu && (
                <LanguageSelectorMenu
                  workId={workId}
                  chapterId={chapterId}
                  onClose={() => setShowLanguageMenu(false)}
                  onLanguageSelect={(language) => {
                    onTargetLanguageChange(language)
                    setShowLanguageMenu(false)
                  }}
                />
              )}
            </div>

            {/* Audio Toggle */}
            <div className="relative">
              <Tooltip content="Listen to a fan-narrated audiobook of this chapter. Authors can approve reader-submitted recordings." side="bottom">
              <button
                onClick={() => {
                  setShowAudiobookMenu(!showAudiobookMenu)
                  setShowLanguageMenu(false)
                  setShowMoreMenu(false)
                }}
                className={`relative p-2 rounded-lg transition-colors ${
                  audioEnabled
                    ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
                title={`Audio: ${audioEnabled ? 'On' : 'Off'}`}
              >
                <SpeakerWaveIcon className="w-5 h-5" />
                {audioEnabled && (
                  <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-blue-500" />
                )}
              </button>
              </Tooltip>

              {showAudiobookMenu && (
                <AudiobookSelectorMenu
                  workId={workId}
                  chapterId={chapterId}
                  onClose={() => setShowAudiobookMenu(false)}
                  onAudiobookSelect={(audiobookId) => {
                    if (!audioEnabled) {
                      onAudioToggle()
                    }
                    setShowAudiobookMenu(false)
                  }}
                />
              )}
            </div>
          </div>

          {/* Right section: Subscribe, Bookmark, Like, More */}
          <div className="flex items-center space-x-2">
            {/* Subscribe */}
            <Tooltip content="Get notified when new chapters drop. Subscriptions also help the author understand their readership." side="bottom">
            <button
              onClick={onSubscribe}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                isSubscribed
                  ? 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
            >
              {isSubscribed ? 'Subscribed' : 'Subscribe'}
            </button>
            </Tooltip>

            {/* Bookmark */}
            <Tooltip content="Save to your private reading list. Bookmarks are never visible to the author." side="bottom">
            <button
              onClick={onBookmark}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="Bookmark"
            >
              {isBookmarked ? (
                <BookmarkSolid className="w-5 h-5 text-blue-500" />
              ) : (
                <BookmarkOutline className="w-5 h-5 text-gray-400" />
              )}
            </button>
            </Tooltip>

            {/* Like */}
            <Tooltip content="Show the author you love their work. Likes also help surface this story to new readers." side="bottom">
            <button
              onClick={onLike}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="Like"
            >
              {isLiked ? (
                <HeartSolid className="w-5 h-5 text-red-500" />
              ) : (
                <HeartOutline className="w-5 h-5 text-gray-400" />
              )}
            </button>
            </Tooltip>

            {/* More Menu */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowMoreMenu(!showMoreMenu)
                  setShowLanguageMenu(false)
                  setShowAudiobookMenu(false)
                }}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title="More options"
              >
                <EllipsisHorizontalIcon className="w-5 h-5 text-gray-400" />
              </button>

              {showMoreMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50">
                  <button
                    onClick={() => {
                      setShowTranslationForm(true)
                      setShowMoreMenu(false)
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    title="Translate a chapter and earn a share of its ad revenue once the author approves your submission."
                  >
                    📝 Submit Translation
                  </button>
                  <button
                    onClick={() => {
                      setShowAudiobookForm(true)
                      setShowMoreMenu(false)
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    title="Record a narration and submit it for the author's approval. Earn a share of ad revenue from your approved recording."
                  >
                    🎙️ Submit Audiobook
                  </button>
                  <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>
                  <button
                    onClick={() => {
                      setShowMoreMenu(false)
                      if (onOpenSettings) onOpenSettings()
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    ⚙️ Reading Settings
                  </button>
                  <button className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                    🚩 Report Issue
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Submission Forms */}
      {showTranslationForm && (
        <TranslationSubmissionForm
          workId={workId}
          chapterId={chapterId}
          onClose={() => setShowTranslationForm(false)}
          onSuccess={() => {
            // Refresh translations
          }}
        />
      )}

      {showAudiobookForm && (
        <AudiobookSubmissionForm
          workId={workId}
          chapterId={chapterId}
          onClose={() => setShowAudiobookForm(false)}
          onSuccess={() => {
            // Refresh audiobooks
          }}
        />
      )}
    </div>
  )
}
