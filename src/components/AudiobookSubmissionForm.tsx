'use client'

import { useState, useRef } from 'react'
import { XMarkIcon, CloudArrowUpIcon } from '@heroicons/react/24/outline'
import { useToast } from '@/components/ui/Toast'

interface AudiobookSubmissionFormProps {
  workId: string
  chapterId: string
  onClose: () => void
  onSuccess: () => void
}

export default function AudiobookSubmissionForm({
  workId,
  chapterId,
  onClose,
  onSuccess,
}: AudiobookSubmissionFormProps) {
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [durationSeconds, setDurationSeconds] = useState(0)
  const { toast } = useToast()
  const [narratorNotes, setNarratorNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('audio/')) {
      setError('Please select a valid audio file')
      return
    }

    // Validate file size (max 500MB)
    const maxSize = 500 * 1024 * 1024 // 500MB
    if (file.size > maxSize) {
      setError('File size must be less than 500MB')
      return
    }

    setAudioFile(file)
    setError(null)

    // Load audio to get duration
    const url = URL.createObjectURL(file)
    const audio = new Audio(url)
    audio.addEventListener('loadedmetadata', () => {
      setDurationSeconds(Math.floor(audio.duration))
      URL.revokeObjectURL(url)
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!audioFile) {
      setError('Please select an audio file')
      return
    }

    if (durationSeconds === 0) {
      setError('Could not determine audio duration')
      return
    }

    setIsSubmitting(true)
    setError(null)
    setUploadProgress(0)

    try {
      const formData = new FormData()
      formData.append('workId', workId)
      formData.append('chapterId', chapterId)
      formData.append('audioFile', audioFile)
      formData.append('durationSeconds', durationSeconds.toString())
      if (narratorNotes) {
        formData.append('narratorNotes', narratorNotes)
      }

      const response = await fetch('/api/audiobooks/submit', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        toast.success(data.audiobook.message)
        onSuccess()
        onClose()
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to submit audiobook')
      }
    } catch (error) {
      console.error('Failed to submit audiobook:', error)
      setError('Failed to submit audiobook. Please try again.')
    } finally {
      setIsSubmitting(false)
      setUploadProgress(0)
    }
  }

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs
        .toString()
        .padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Submit Audiobook (Tier 3)
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Upload your professional narration of this chapter
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

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Audio File *
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                audioFile
                  ? 'border-green-300 dark:border-green-600 bg-green-50 dark:bg-green-900/20'
                  : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <CloudArrowUpIcon className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              {audioFile ? (
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                    {audioFile.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formatFileSize(audioFile.size)} • {formatDuration(durationSeconds)}
                  </p>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setAudioFile(null)
                      setDurationSeconds(0)
                    }}
                    className="mt-2 text-xs text-red-500 hover:text-red-600"
                  >
                    Remove file
                  </button>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-1">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    MP3, WAV, M4A, or other audio formats (max 500MB)
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Duration Display */}
          {durationSeconds > 0 && (
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Duration:
                </span>
                <span className="text-sm text-gray-900 dark:text-white">
                  {formatDuration(durationSeconds)}
                </span>
              </div>
            </div>
          )}

          {/* Narrator Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Narrator Notes (Optional)
            </label>
            <textarea
              value={narratorNotes}
              onChange={(e) => setNarratorNotes(e.target.value)}
              placeholder="Add notes about your recording setup, accent, character voice choices, etc..."
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Upload Progress */}
          {isSubmitting && uploadProgress > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Uploading...
                </span>
                <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                  {uploadProgress}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Info Box */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
              💡 Audiobook Guidelines
            </h3>
            <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
              <li>• Your audiobook will appear immediately in the narrator selector</li>
              <li>• Ensure good audio quality (clear, minimal background noise)</li>
              <li>• Readers will rate your narration on clarity, pacing, and production quality</li>
              <li>• You may earn revenue share if the creator has enabled monetization</li>
              <li>• Use a consistent style across chapters for the best experience</li>
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
              disabled={isSubmitting || !audioFile || durationSeconds === 0}
              className="px-6 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Uploading...' : 'Submit Audiobook'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
