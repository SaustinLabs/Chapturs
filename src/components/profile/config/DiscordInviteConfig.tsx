'use client'

import { useState } from 'react'
import Modal from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'

interface DiscordInviteConfigProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: any) => void
  initialData?: any
}

/**
 * DiscordInviteConfig - v0.2
 * Configuration modal for DiscordInviteBlock
 */
export default function DiscordInviteConfig({
  isOpen,
  onClose,
  onSave,
  initialData
}: DiscordInviteConfigProps) {
  const { toast } = useToast()
  const [serverName, setServerName] = useState(initialData?.serverName || '')
  const [inviteCode, setInviteCode] = useState(initialData?.inviteCode || '')
  const [description, setDescription] = useState(initialData?.description || '')
  const [serverIcon, setServerIcon] = useState(initialData?.serverIcon || '')
  const [memberCount, setMemberCount] = useState(initialData?.memberCount || '')
  const [onlineCount, setOnlineCount] = useState(initialData?.onlineCount || '')

  const handleSave = () => {
    if (!serverName.trim()) {
      toast.warning('Please enter a server name')
      return
    }
    if (!inviteCode.trim()) {
      toast.warning('Please enter an invite code')
      return
    }

    onSave({
      serverName: serverName.trim(),
      inviteCode: inviteCode.trim(),
      description: description.trim() || undefined,
      serverIcon: serverIcon.trim() || undefined,
      memberCount: memberCount ? parseInt(memberCount) : undefined,
      onlineCount: onlineCount ? parseInt(onlineCount) : undefined
    })
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Configure Discord Invite" size="md">
      <div className="space-y-4">
        {/* Server Name */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Server Name *
          </label>
          <input
            type="text"
            value={serverName}
            onChange={(e) => setServerName(e.target.value)}
            className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-gray-100 focus:border-blue-500 focus:outline-none"
            placeholder="My Awesome Community"
          />
        </div>

        {/* Invite Code */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Invite Code *
            <span className="text-xs text-gray-500 ml-2">
              (e.g., "abcd1234" from discord.gg/abcd1234)
            </span>
          </label>
          <input
            type="text"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
            className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-gray-100 focus:border-blue-500 focus:outline-none"
            placeholder="abcd1234"
          />
          {inviteCode && (
            <p className="text-xs text-green-400 mt-1">
              Link: discord.gg/{inviteCode}
            </p>
          )}
        </div>

        {/* Server Icon URL */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Server Icon URL (optional)
          </label>
          <input
            type="url"
            value={serverIcon}
            onChange={(e) => setServerIcon(e.target.value)}
            className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-gray-100 focus:border-blue-500 focus:outline-none"
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
            className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-gray-100 focus:border-blue-500 focus:outline-none"
            rows={3}
            placeholder="Join our community for updates, discussions, and more!"
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Members (optional)
            </label>
            <input
              type="number"
              value={memberCount}
              onChange={(e) => setMemberCount(e.target.value)}
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-gray-100 focus:border-blue-500 focus:outline-none"
              placeholder="1000"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Online (optional)
            </label>
            <input
              type="number"
              value={onlineCount}
              onChange={(e) => setOnlineCount(e.target.value)}
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-gray-100 focus:border-blue-500 focus:outline-none"
              placeholder="250"
            />
          </div>
        </div>

        {/* Preview */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Preview
          </label>
          <div className="p-4 rounded-lg bg-gradient-to-br from-[#5865F2] to-[#4752C4] text-white">
            <div className="flex items-center gap-3 mb-2">
              {serverIcon ? (
                <img src={serverIcon} alt={serverName} className="w-12 h-12 rounded-full" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                  <span className="text-2xl">💬</span>
                </div>
              )}
              <div className="flex-1">
                <h4 className="font-bold text-sm">{serverName || 'Server Name'}</h4>
                {(memberCount || onlineCount) && (
                  <div className="flex gap-2 text-xs">
                    {onlineCount && <span>🟢 {parseInt(onlineCount).toLocaleString()} online</span>}
                    {memberCount && <span>⚪ {parseInt(memberCount).toLocaleString()} members</span>}
                  </div>
                )}
              </div>
            </div>
            {description && (
              <p className="text-xs text-white/80 mb-2">{description}</p>
            )}
            <button className="w-full bg-white text-[#5865F2] font-semibold py-2 rounded-md text-sm">
              Join Server
            </button>
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
