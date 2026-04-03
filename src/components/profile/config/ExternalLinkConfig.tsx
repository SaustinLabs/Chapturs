'use client'

import { useState } from 'react'
import Modal from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'

interface ExternalLinkConfigProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: any) => void
  initialData?: any
}

/**
 * ExternalLinkConfig - v0.1.5
 * Configuration modal for ExternalLinkBlock
 * For Patreon, Ko-fi, personal websites, etc.
 */
export default function ExternalLinkConfig({
  isOpen,
  onClose,
  onSave,
  initialData
}: ExternalLinkConfigProps) {
  const { toast } = useToast()
  const [url, setUrl] = useState(initialData?.url || '')
  const [title, setTitle] = useState(initialData?.title || '')
  const [description, setDescription] = useState(initialData?.description || '')
  const [icon, setIcon] = useState(initialData?.icon || '🔗')
  const [backgroundColor, setBackgroundColor] = useState(initialData?.backgroundColor || '')

  // Suggested icons for common platforms
  const suggestedIcons = [
    { icon: '💰', label: 'Patreon' },
    { icon: '☕', label: 'Ko-fi' },
    { icon: '🌐', label: 'Website' },
    { icon: '✉️', label: 'Email' },
    { icon: '🔗', label: 'Generic Link' },
    { icon: '📧', label: 'Newsletter' },
    { icon: '🛒', label: 'Shop' },
    { icon: '🎨', label: 'Portfolio' }
  ]

  const handleSave = () => {
    if (!url.trim()) {
      toast.warning('Please enter a URL')
      return
    }
    if (!title.trim()) {
      toast.warning('Please enter a title')
      return
    }

    try {
      new URL(url) // Validate URL
    } catch {
      toast.warning('Please enter a valid URL (include https://)')
      return
    }

    onSave({
      url: url.trim(),
      title: title.trim(),
      description: description.trim(),
      icon,
      backgroundColor: backgroundColor || undefined
    })
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Configure External Link" size="md">
      <div className="space-y-4">
        {/* URL */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Link URL *
          </label>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-gray-100 focus:border-blue-500 focus:outline-none"
            placeholder="https://patreon.com/yourname"
          />
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Title *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-gray-100 focus:border-blue-500 focus:outline-none"
            placeholder="Support me on Patreon"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Description (optional)
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-gray-100 focus:border-blue-500 focus:outline-none"
            placeholder="Get exclusive content and early access"
          />
        </div>

        {/* Icon Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Icon
          </label>
          <div className="grid grid-cols-4 gap-2 mb-2">
            {suggestedIcons.map(({ icon: suggIcon, label }) => (
              <button
                key={suggIcon}
                onClick={() => setIcon(suggIcon)}
                className={`p-3 rounded-lg border-2 transition-all ${
                  icon === suggIcon
                    ? 'border-blue-500 bg-blue-900/30'
                    : 'border-gray-700 hover:border-gray-600 bg-gray-900'
                }`}
                title={label}
              >
                <span className="text-2xl">{suggIcon}</span>
              </button>
            ))}
          </div>
          <input
            type="text"
            value={icon}
            onChange={(e) => setIcon(e.target.value)}
            className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-gray-100 focus:border-blue-500 focus:outline-none text-center text-2xl"
            placeholder="🔗"
            maxLength={2}
          />
        </div>

        {/* Background Color */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Background Color (optional)
          </label>
          <div className="flex gap-2">
            <input
              type="color"
              value={backgroundColor || '#1f2937'}
              onChange={(e) => setBackgroundColor(e.target.value)}
              className="w-16 h-10 bg-gray-900 border border-gray-700 rounded-lg cursor-pointer"
            />
            <input
              type="text"
              value={backgroundColor}
              onChange={(e) => setBackgroundColor(e.target.value)}
              className="flex-1 px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-gray-100 focus:border-blue-500 focus:outline-none"
              placeholder="#1f2937 or leave empty"
            />
          </div>
        </div>

        {/* Preview */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Preview
          </label>
          <div 
            className="p-4 rounded-lg border border-gray-700"
            style={{ backgroundColor: backgroundColor || '#1f2937' }}
          >
            <div className="flex items-center gap-3">
              <span className="text-3xl">{icon}</span>
              <div>
                <h4 className="font-semibold text-gray-100 text-sm">{title || 'Your Title'}</h4>
                {description && (
                  <p className="text-xs text-gray-400">{description}</p>
                )}
              </div>
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
