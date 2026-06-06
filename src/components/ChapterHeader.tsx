'use client'

import { ListBulletIcon, MinusIcon, PlusIcon, CogIcon } from '@heroicons/react/24/outline'
import ReportButton from '@/components/ReportButton'
import ChapterTranslationBanner from '@/components/ChapterTranslationBanner'

interface ChapterHeaderProps {
  storyId: string
  chapterId: string
  workTitle: string
  chapterNumber: number | null | undefined
  chapterTitle: string
  targetLanguage: string
  detectedLanguage: string
  translationId: string | null
  translationRating: number | null
  fontSize: string
  showChapterList: boolean
  onBack: () => void
  onScrollMode: () => void
  onToggleChapterList: () => void
  onShiftFontSize: (direction: -1 | 1) => void
  onOpenSettings: () => void
  onRevertToOriginal: () => void
  onSuggestionSubmit: (text: string) => Promise<void>
}

export default function ChapterHeader({
  storyId, chapterId, workTitle, chapterNumber, chapterTitle,
  targetLanguage, detectedLanguage, translationId, translationRating,
  fontSize, showChapterList,
  onBack, onScrollMode, onToggleChapterList, onShiftFontSize, onOpenSettings,
  onRevertToOriginal, onSuggestionSubmit,
}: ChapterHeaderProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6 mt-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBack}
            className="text-blue-500 hover:text-blue-600 text-sm font-medium"
          >
            ← Back
          </button>
          <div className="h-4 border-l border-gray-300 dark:border-gray-600"></div>
          <button
            onClick={onScrollMode}
            className="flex items-center space-x-1.5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            title="Read all chapters in one continuous page"
          >
            <span className="text-sm">📜 Scroll</span>
          </button>
          <div className="h-4 border-l border-gray-300 dark:border-gray-600"></div>
          <button
            onClick={onToggleChapterList}
            className="flex items-center space-x-1.5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          >
            <ListBulletIcon className="w-4 h-4" />
            <span className="text-sm">Chapters</span>
          </button>
        </div>
        <div className="flex items-center gap-1">
          <ReportButton targetType="section" targetId={chapterId} className="mr-1" />
          <button
            type="button"
            onClick={() => onShiftFontSize(-1)}
            className="p-1.5 rounded-md border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            aria-label="Decrease font size"
          >
            <MinusIcon className="w-3.5 h-3.5" />
          </button>
          <span className="text-[11px] text-gray-500 dark:text-gray-400 w-10 text-center capitalize">
            {fontSize}
          </span>
          <button
            type="button"
            onClick={() => onShiftFontSize(1)}
            className="p-1.5 rounded-md border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            aria-label="Increase font size"
          >
            <PlusIcon className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onOpenSettings}
            className="ml-1 p-1.5 rounded-md border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hidden md:inline-flex"
            aria-label="Display settings"
            title="Display settings"
          >
            <CogIcon className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {workTitle}
        </h1>
        <h2 className="text-xl text-gray-700 dark:text-gray-300">
          Chapter {chapterNumber}: {chapterTitle}
        </h2>
      </div>

      <ChapterTranslationBanner
        targetLanguage={targetLanguage}
        detectedLanguage={detectedLanguage}
        translationId={translationId}
        translationRating={translationRating}
        onRevertToOriginal={onRevertToOriginal}
        onSuggestionSubmit={onSuggestionSubmit}
      />
    </div>
  )
}
