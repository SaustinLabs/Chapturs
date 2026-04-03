'use client'

import { useState } from 'react'
import Modal from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'

interface YouTubeChannelConfigProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: any) => void
  initialData?: any
}

/**
 * YouTubeChannelConfig - v0.2
 * Configuration modal for YouTubeChannelBlock
 */
export default function YouTubeChannelConfig({
  isOpen,
  onClose,
  onSave,
  initialData
}: YouTubeChannelConfigProps) {
  const { toast } = useToast()
  const [channelHandle, setChannelHandle] = useState(initialData?.channelHandle || '')
  const [channelName, setChannelName] = useState(initialData?.channelName || '')
  const [channelImage, setChannelImage] = useState(initialData?.channelImage || '')
  const [description, setDescription] = useState(initialData?.description || '')

  const handleSave = () => {
    if (!channelHandle.trim()) {
      toast.warning('Please enter a channel handle or ID')
      return
    }

    onSave({
      channelHandle: channelHandle.trim(),
      channelName: channelName.trim() || undefined,
      channelImage: channelImage.trim() || undefined,
      description: description.trim() || undefined
    })
    onClose()
  }

  // Extract handle from URL if pasted
  const handleHandleChange = (value: string) => {
    let handle = value.trim()
    
    // If it's a full URL, extract the handle
    if (handle.includes('youtube.com/@')) {
      const match = handle.match(/@([^/?]+)/)
      if (match) handle = '@' + match[1]
    } else if (handle.includes('youtube.com/channel/')) {
      const match = handle.match(/channel\/([^/?]+)/)
      if (match) handle = match[1]
    }
    
    // Ensure @ prefix for handles
    if (handle && !handle.startsWith('@') && !handle.startsWith('UC')) {
      handle = '@' + handle
    }
    
    setChannelHandle(handle)
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Configure YouTube Channel" size="md">
      <div className="space-y-4">
        {/* Channel Handle/ID */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Channel Handle or ID *
            <span className="text-xs text-gray-500 ml-2">
              (@yourhandle or channel ID)
            </span>
          </label>
          <input
            type="text"
            value={channelHandle}
            onChange={(e) => handleHandleChange(e.target.value)}
            className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-gray-100 focus:border-red-500 focus:outline-none"
            placeholder="@yourchannel or UCxxxxxxxxxx"
          />
          {channelHandle && (
            <p className="text-xs text-green-400 mt-1">
              {channelHandle.startsWith('@') 
                ? `youtube.com/${channelHandle}`
                : `youtube.com/channel/${channelHandle}`
              }
            </p>
          )}
        </div>

        {/* Channel Name */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Channel Name (optional)
          </label>
          <input
            type="text"
            value={channelName}
            onChange={(e) => setChannelName(e.target.value)}
            className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-gray-100 focus:border-red-500 focus:outline-none"
            placeholder="Your Channel Name"
          />
        </div>

        {/* Channel Image */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Channel Image URL (optional)
          </label>
          <input
            type="url"
            value={channelImage}
            onChange={(e) => setChannelImage(e.target.value)}
            className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-gray-100 focus:border-red-500 focus:outline-none"
            placeholder="https://..."
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Description (optional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-gray-100 focus:border-red-500 focus:outline-none resize-none"
            placeholder="What's your channel about?"
          />
        </div>

        {/* Note about live data */}
        <div className="bg-red-900/20 border border-red-700 rounded-lg p-3">
          <p className="text-xs text-red-300">
            💡 <strong>Note:</strong> Subscriber count and latest videos will be fetched automatically from YouTube API!
          </p>
        </div>

        {/* Preview */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Preview
          </label>
          <div className="p-4 rounded-lg bg-gradient-to-br from-red-600 to-red-800 text-white">
            <div className="flex items-center gap-3 mb-3">
              {channelImage ? (
                <img src={channelImage} alt={channelName || channelHandle} className="w-16 h-16 rounded-full" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center">
                  <span className="text-3xl">▶️</span>
                </div>
              )}
              <div className="flex-1">
                <h4 className="font-bold text-lg">{channelName || channelHandle || 'Channel Name'}</h4>
                <p className="text-sm text-white/80">{channelHandle || '@channel'}</p>
              </div>
            </div>
            {description && (
              <p className="text-sm text-white/90 mb-3 line-clamp-2">{description}</p>
            )}
            <div className="flex items-center justify-between pt-3 border-t border-white/20">
              <span className="text-sm text-white/70">Subscribe on YouTube</span>
              <span>→</span>
            </div>
          </div>
        </div>

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
            className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-medium transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </Modal>
  )
}
