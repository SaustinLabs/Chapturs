'use client'

import { useState } from 'react'
import Modal from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'

interface TwitchChannelConfigProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: any) => void
  initialData?: any
}

/**
 * TwitchChannelConfig - v0.2
 * Configuration modal for TwitchChannelBlock
 */
export default function TwitchChannelConfig({
  isOpen,
  onClose,
  onSave,
  initialData
}: TwitchChannelConfigProps) {
  const { toast } = useToast()
  const [channelName, setChannelName] = useState(initialData?.channelName || '')
  const [displayName, setDisplayName] = useState(initialData?.displayName || '')
  const [profileImage, setProfileImage] = useState(initialData?.profileImage || '')

  const handleSave = () => {
    if (!channelName.trim()) {
      toast.warning('Please enter a channel name')
      return
    }

    onSave({
      channelName: channelName.trim(),
      displayName: displayName.trim() || channelName.trim(),
      profileImage: profileImage.trim() || undefined
    })
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Configure Twitch Channel" size="md">
      <div className="space-y-4">
        {/* Channel Name */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Twitch Username *
            <span className="text-xs text-gray-500 ml-2">
              (your twitch.tv/username)
            </span>
          </label>
          <input
            type="text"
            value={channelName}
            onChange={(e) => setChannelName(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
            className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-gray-100 focus:border-blue-500 focus:outline-none"
            placeholder="yourname"
          />
          {channelName && (
            <p className="text-xs text-green-400 mt-1">
              Channel: twitch.tv/{channelName}
            </p>
          )}
        </div>

        {/* Display Name */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Display Name (optional)
          </label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-gray-100 focus:border-blue-500 focus:outline-none"
            placeholder="Your Display Name"
          />
          <p className="text-xs text-gray-500 mt-1">
            Leave empty to use username
          </p>
        </div>

        {/* Profile Image */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Profile Image URL (optional)
          </label>
          <input
            type="url"
            value={profileImage}
            onChange={(e) => setProfileImage(e.target.value)}
            className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-gray-100 focus:border-blue-500 focus:outline-none"
            placeholder="https://..."
          />
        </div>

        {/* Note about live data */}
        <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-3">
          <p className="text-xs text-blue-300">
            💡 <strong>Note:</strong> Live status, stream title, viewer count, and game will be fetched automatically from Twitch when you're streaming!
          </p>
        </div>

        {/* Preview */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Preview (Offline State)
          </label>
          <div className="p-4 rounded-lg bg-gradient-to-br from-[#9146FF] to-[#772CE8] text-white">
            <div className="flex items-center gap-3 mb-3">
              {profileImage ? (
                <img src={profileImage} alt={displayName || channelName} className="w-12 h-12 rounded-full" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                  <span className="text-2xl">🎮</span>
                </div>
              )}
              <div className="flex-1">
                <h4 className="font-bold text-sm">{displayName || channelName || 'Channel Name'}</h4>
                <p className="text-xs text-white/70">twitch.tv/{channelName || 'username'}</p>
              </div>
            </div>
            <div className="text-center py-4 text-white/60 text-sm">
              Channel is offline
            </div>
            <div className="flex items-center justify-between text-xs text-white/70">
              <span>Watch on Twitch</span>
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
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </Modal>
  )
}
