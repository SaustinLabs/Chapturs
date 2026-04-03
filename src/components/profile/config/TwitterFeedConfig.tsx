'use client'

import { useState } from 'react'
import Modal from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'

interface TwitterFeedConfigProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: any) => void
  initialData?: any
}

/**
 * TwitterFeedConfig - v0.2
 * Configuration modal for TwitterFeedBlock
 */
export default function TwitterFeedConfig({
  isOpen,
  onClose,
  onSave,
  initialData
}: TwitterFeedConfigProps) {
  const { toast } = useToast()
  const [twitterHandle, setTwitterHandle] = useState(initialData?.twitterHandle || '')
  const [displayName, setDisplayName] = useState(initialData?.displayName || '')
  const [profileImage, setProfileImage] = useState(initialData?.profileImage || '')
  const [bio, setBio] = useState(initialData?.bio || '')

  const handleSave = () => {
    if (!twitterHandle.trim()) {
      toast.warning('Please enter a Twitter/X handle')
      return
    }

    onSave({
      twitterHandle: twitterHandle.trim(),
      displayName: displayName.trim() || undefined,
      profileImage: profileImage.trim() || undefined,
      bio: bio.trim() || undefined
    })
    onClose()
  }

  // Clean handle input
  const handleHandleChange = (value: string) => {
    let handle = value.trim()
    
    // Remove @ if present
    handle = handle.replace(/^@/, '')
    
    // Extract from URL if pasted
    if (handle.includes('twitter.com/') || handle.includes('x.com/')) {
      const match = handle.match(/(?:twitter|x)\.com\/([^/?]+)/)
      if (match) handle = match[1]
    }
    
    // Only allow valid characters
    handle = handle.replace(/[^a-zA-Z0-9_]/g, '')
    
    setTwitterHandle(handle)
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Configure Twitter/X Feed" size="md">
      <div className="space-y-4">
        {/* Twitter Handle */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Twitter/X Handle *
            <span className="text-xs text-gray-500 ml-2">
              (without @)
            </span>
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">@</span>
            <input
              type="text"
              value={twitterHandle}
              onChange={(e) => handleHandleChange(e.target.value)}
              className="w-full pl-8 pr-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-gray-100 focus:border-blue-500 focus:outline-none"
              placeholder="yourusername"
            />
          </div>
          {twitterHandle && (
            <p className="text-xs text-green-400 mt-1">
              Profile: x.com/{twitterHandle}
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

        {/* Bio */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Bio (optional)
          </label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={2}
            className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-gray-100 focus:border-blue-500 focus:outline-none resize-none"
            placeholder="A short bio..."
            maxLength={160}
          />
          <p className="text-xs text-gray-500 text-right">{bio.length}/160</p>
        </div>

        {/* Note about live data */}
        <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-3">
          <p className="text-xs text-blue-300">
            💡 <strong>Note:</strong> Recent tweets and follower count will be fetched automatically from Twitter/X!
          </p>
        </div>

        {/* Preview */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Preview
          </label>
          <div className="p-4 rounded-lg bg-black border border-gray-700 text-white">
            <div className="flex items-start gap-3 mb-3">
              {profileImage ? (
                <img src={profileImage} alt={displayName || twitterHandle} className="w-12 h-12 rounded-full" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center">
                  <span className="text-xl">🐦</span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <h4 className="font-bold text-sm truncate">{displayName || twitterHandle || 'Display Name'}</h4>
                </div>
                <p className="text-sm text-gray-500">@{twitterHandle || 'username'}</p>
              </div>
            </div>
            {bio && (
              <p className="text-sm text-gray-300 mb-3">{bio}</p>
            )}
            <div className="pt-3 border-t border-gray-800 text-center">
              <p className="text-xs text-gray-500">Recent tweets will appear here</p>
            </div>
            <div className="flex items-center justify-between pt-3 mt-3 border-t border-gray-800 text-sm text-blue-400">
              <span>Follow on X</span>
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
