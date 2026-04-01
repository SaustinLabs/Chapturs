'use client'

import { useState } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { useToast } from '@/components/ui/Toast'

interface TranslationSubmissionFormProps {
  workId: string
  chapterId: string
  onClose: () => void
  onSuccess: () => void
}

export default function TranslationSubmissionForm({
  workId,
  chapterId,
  onClose,
  onSuccess,
}: TranslationSubmissionFormProps) {
  const [languageCode, setLanguageCode] = useState('es')
  const [translatedTitle, setTranslatedTitle] = useState('')
  const [translatedContent, setTranslatedContent] = useState('')
  const [translationNotes, setTranslationNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!translatedTitle || !translatedContent) {
      setError('Title and content are required')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      // Parse content as JSON if it's a string
      let content = translatedContent
      try {
        content = JSON.parse(translatedContent)
      } catch (e) {
        // If not valid JSON, wrap in array format expected by Chapt
        content = [
          {
            type: 'paragraph',
            content: translatedContent,
          },
        ]
      }

      const response = await fetch('/api/translations/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workId,
          chapterId,
          languageCode,
          translatedTitle,
          translatedContent: content,
          translationNotes,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        toast.success(data.translation?.message || 'Translation submitted successfully.')
        onSuccess()
        onClose()
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to submit translation')
      }
    } catch (error) {
      console.error('Failed to submit translation:', error)
      setError('Failed to submit translation. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const supportedLanguages = [
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'ja', name: 'Japanese' },
    { code: 'ko', name: 'Korean' },
    { code: 'zh-CN', name: 'Chinese (Simplified)' },
    { code: 'zh-TW', name: 'Chinese (Traditional)' },
    { code: 'pt', name: 'Portuguese' },
    { code: 'ru', name: 'Russian' },
    { code: 'ar', name: 'Arabic' },
    { code: 'hi', name: 'Hindi' },
    { code: 'it', name: 'Italian' },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Submit Translation (Tier 3)
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Provide a professional translation of this chapter
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Language Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Target Language *
            </label>
            <select
              value={languageCode}
              onChange={(e) => setLanguageCode(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              {supportedLanguages.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.name}
                </option>
              ))}
            </select>
          </div>

          {/* Translated Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Translated Chapter Title *
            </label>
            <input
              type="text"
              value={translatedTitle}
              onChange={(e) => setTranslatedTitle(e.target.value)}
              placeholder="Enter chapter title in target language"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* Translated Content */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Translated Content *
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
              Paste your translated chapter content. You can use plain text or JSON format (Chapt structure).
            </p>
            <textarea
              value={translatedContent}
              onChange={(e) => setTranslatedContent(e.target.value)}
              placeholder="Paste your translation here..."
              rows={15}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
              required
            />
          </div>

          {/* Translation Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Translation Notes (Optional)
            </label>
            <textarea
              value={translationNotes}
              onChange={(e) => setTranslationNotes(e.target.value)}
              placeholder="Add notes about your translation approach, challenges, or style choices..."
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
              💡 Translation Guidelines
            </h3>
            <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
              <li>• Your translation will appear immediately in the language selector</li>
              <li>• Readers will rate your work on Readability, Comprehension, and Polish</li>
              <li>• High-quality translations may be set as default by the system</li>
              <li>• You may earn revenue share if the creator has enabled monetization</li>
            </ul>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-6 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !translatedTitle || !translatedContent}
              className="px-6 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Translation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
