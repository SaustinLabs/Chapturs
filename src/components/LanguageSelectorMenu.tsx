'use client'

import { useState, useEffect } from 'react'

interface LanguageSelectorMenuProps {
  workId: string
  chapterId: string
  onClose: () => void
  onLanguageSelect: (languageCode: string) => void
  currentLanguage: string
}

export default function LanguageSelectorMenu({
  workId,
  chapterId,
  onClose,
  onLanguageSelect,
  currentLanguage,
}: LanguageSelectorMenuProps) {
  const [loading, setLoading] = useState(false)

  // Hardcoded list of supported languages
  const supportedLanguages = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Español' },
    { code: 'fr', name: 'Français' },
    { code: 'de', name: 'Deutsch' },
    { code: 'ja', name: '日本語' },
    { code: 'zh', name: '中文' },
  ]

  return (
    <div className="absolute left-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 max-h-[400px] overflow-y-auto z-50">
      {/* Header */}
      <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Select Language
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Language List */}
      <div className="p-2">
        {loading ? (
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="space-y-1">
            {supportedLanguages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => onLanguageSelect(lang.code)}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center justify-between ${
                  currentLanguage === lang.code
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                <span>{lang.name}</span>
                {currentLanguage === lang.code && (
                  <span className="text-xs">✓</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 p-3">
        <button
          onClick={() => {
            // Could open translation submission form
          }}
          className="w-full text-sm text-blue-500 hover:text-blue-600 font-medium text-center"
        >
          + Suggest a Language
        </button>
      </div>
    </div>
  )
}
