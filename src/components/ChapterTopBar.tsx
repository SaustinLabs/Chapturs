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
              <button
                onClick={() => {
                  setShowLanguageMenu(!showLanguageMenu)
                  setShowAudiobookMenu(false)
                  setShowMoreMenu(false)
                }}
                className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <GlobeAltIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {targetLanguage}
                </span>
                <svg
                  className="w-4 h-4 text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {showLanguageMenu && (
                <LanguageSelectorMenu
                  workId={workId}
                  chapterId={chapterId}
                  onClose={() => setShowLanguageMenu(false)}
                  onLanguageSelect={(language) => {
                    setSelectedLanguage(language)
                    setShowLanguageMenu(false)
                  }}
                />
              )}
            </div>

            {/* Audio Toggle */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowAudiobookMenu(!showAudiobookMenu)
                  setShowLanguageMenu(false)
                  setShowMoreMenu(false)
                }}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                  audioEnabled
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <SpeakerWaveIcon
                  className={`w-5 h-5 ${
                    audioEnabled
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-gray-600 dark:text-gray-400'
                  }`}
                />
                <span className="text-sm font-medium">
                  Audio: {audioEnabled ? 'On' : 'Off'}
                </span>
              </button>

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
            <button
              onClick={onSubscribe}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isSubscribed
                  ? 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
            >
              {isSubscribed ? '💬 Subscribed' : '💬 Subscribe'}
            </button>

            {/* Bookmark */}
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

            {/* Like */}
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
                  >
                    📝 Submit Translation
                  </button>
                  <button
                    onClick={() => {
                      setShowAudiobookForm(true)
                      setShowMoreMenu(false)
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    🎙️ Submit Audiobook
                  </button>
                  <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>
                  <button className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
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
