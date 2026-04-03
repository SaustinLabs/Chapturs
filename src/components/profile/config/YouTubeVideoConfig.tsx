'use client'

import { useState } from 'react'
import Modal from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'

interface YouTubeVideoConfigProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: any) => void
  initialData?: any
}

/**
 * YouTubeVideoConfig - v0.1.5
 * Configuration modal for YouTubeVideoBlock
 */
export default function YouTubeVideoConfig({
  isOpen,
  onClose,
  onSave,
  initialData
}: YouTubeVideoConfigProps) {
  const { toast } = useToast()
  const [videoUrl, setVideoUrl] = useState(initialData?.videoUrl || '')
  const [title, setTitle] = useState(initialData?.title || '')
  const [description, setDescription] = useState(initialData?.description || '')

  // Extract video ID from YouTube URL
  const extractVideoId = (url: string) => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
      /youtube\.com\/embed\/([^&\n?#]+)/
    ]
    
    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match) return match[1]
    }
    return null
  }

  const videoId = extractVideoId(videoUrl)

  const handleSave = () => {
    if (!videoId) {
      toast.warning('Please enter a valid YouTube URL')
      return
    }

    onSave({
      videoUrl,
      videoId,
      title: title.trim(),
      description: description.trim()
    })
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Configure YouTube Video" size="lg">
      <div className="space-y-4">
        {/* Video URL */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            YouTube Video URL
          </label>
          <input
            type="url"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-gray-100 focus:border-blue-500 focus:outline-none"
            placeholder="https://www.youtube.com/watch?v=..."
          />
          {videoId && (
            <p className="text-xs text-green-400 mt-1">
              ✓ Valid video ID: {videoId}
            </p>
          )}
          {videoUrl && !videoId && (
            <p className="text-xs text-red-400 mt-1">
              Invalid YouTube URL
            </p>
          )}
        </div>

        {/* Optional Title */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Title (optional)
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-gray-100 focus:border-blue-500 focus:outline-none"
            placeholder="Give your video a custom title..."
          />
        </div>

        {/* Optional Description */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Description (optional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-gray-100 focus:border-blue-500 focus:outline-none"
            rows={3}
            placeholder="Describe what this video is about..."
          />
        </div>

        {/* Preview */}
        {videoId && (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Preview
            </label>
            <div className="aspect-video bg-gray-900 border border-gray-700 rounded-lg overflow-hidden">
              <iframe
                src={`https://www.youtube.com/embed/${videoId}`}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!videoId}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 rounded-lg text-sm font-medium transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </Modal>
  )
}
