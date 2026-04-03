'use client'

import { useState, useEffect } from 'react'
import Modal from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'

interface SupportBlockConfigProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: any) => void
  initialData?: any
}

interface SecondaryLinkForm {
  title: string
  url: string
  icon?: string
}

/**
 * SupportBlockConfig - v0.1
 * Configuration modal for SupportBlock
 */
export default function SupportBlockConfig({
  isOpen,
  onClose,
  onSave,
  initialData
}: SupportBlockConfigProps) {
  const { toast } = useToast()
  const [chaptursUrl, setChaptursUrl] = useState<string>(initialData?.chaptursUrl || '')
  // Autofill Chapturs support URL if user is the author
  useEffect(() => {
    if (!chaptursUrl && typeof window !== 'undefined') {
      // Try to get username from global context or API
  const username = (window as any).__chaptursUsername || null
      if (username) {
        setChaptursUrl(`https://chapturs.com/support/${username}`)
      }
    }
  }, [chaptursUrl])
  const [title, setTitle] = useState<string>(initialData?.title || 'Support My Work')
  const [subtitle, setSubtitle] = useState<string>(initialData?.subtitle || 'Your support helps me create more chapters, faster.')
  const [buttonLabel, setButtonLabel] = useState<string>(initialData?.buttonLabel || 'Support on Chapturs')
  const [accentColor, setAccentColor] = useState<string>(initialData?.accentColor || '#ec4899')
  const [backgroundImage, setBackgroundImage] = useState<string>(initialData?.backgroundImage || '')
  const [secondaryLinks, setSecondaryLinks] = useState<SecondaryLinkForm[]>(initialData?.secondaryLinks || [])

  const addSecondary = () => {
    setSecondaryLinks((prev) => [...prev, { title: '', url: '', icon: '' }])
  }

  const updateSecondary = (idx: number, field: keyof SecondaryLinkForm, value: string) => {
    setSecondaryLinks((prev) => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item))
  }

  const removeSecondary = (idx: number) => {
    setSecondaryLinks((prev) => prev.filter((_, i) => i !== idx))
  }

  const handleSave = () => {
    if (!chaptursUrl.trim()) {
      toast.warning('Please enter your Chapturs support URL')
      return
    }
    try {
      new URL(chaptursUrl)
    } catch {
      toast.warning('Please enter a valid Chapturs URL (include https://)')
      return
    }

    const cleanedSecondaries = secondaryLinks
      .filter((s) => s.title.trim() && s.url.trim())
      .map((s) => ({
        title: s.title.trim(),
        url: s.url.trim(),
        icon: s.icon?.trim() || undefined
      }))

    onSave({
      chaptursUrl: chaptursUrl.trim(),
      title: title.trim(),
      subtitle: subtitle.trim(),
      buttonLabel: buttonLabel.trim(),
      accentColor: accentColor || '#ec4899',
      backgroundImage: backgroundImage.trim() || undefined,
      secondaryLinks: cleanedSecondaries
    })
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Configure Support Block" size="md">
      <div className="space-y-4">
        {/* Primary Chapturs URL (autofilled if possible) */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Chapturs Support URL *
          </label>
          <input
            type="url"
            value={chaptursUrl}
            onChange={(e) => setChaptursUrl(e.target.value)}
            className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-gray-100 focus:border-blue-500 focus:outline-none"
            placeholder="https://chapturs.com/support/yourname"
            disabled={!!chaptursUrl}
          />
          <p className="text-xs text-gray-500 mt-1">
            This is your Chapturs support link. External links (Patreon, Ko-fi, etc.) are optional and de-emphasized.
          </p>
        </div>

        {/* Title and Subtitle */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-gray-100 focus:border-blue-500 focus:outline-none"
              placeholder="Support My Work"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Button Label</label>
            <input
              type="text"
              value={buttonLabel}
              onChange={(e) => setButtonLabel(e.target.value)}
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-gray-100 focus:border-blue-500 focus:outline-none"
              placeholder="Support on Chapturs"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Subtitle</label>
          <input
            type="text"
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-gray-100 focus:border-blue-500 focus:outline-none"
            placeholder="Your support helps me create more chapters, faster."
          />
        </div>

        {/* Accent and Background */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Accent Color</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={accentColor}
                onChange={(e) => setAccentColor(e.target.value)}
                className="w-16 h-10 bg-gray-900 border border-gray-700 rounded-lg cursor-pointer"
              />
              <input
                type="text"
                value={accentColor}
                onChange={(e) => setAccentColor(e.target.value)}
                className="flex-1 px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-gray-100 focus:border-blue-500 focus:outline-none"
                placeholder="#ec4899"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Background Image (for tall 2×)</label>
            <input
              type="url"
              value={backgroundImage}
              onChange={(e) => setBackgroundImage(e.target.value)}
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-gray-100 focus:border-blue-500 focus:outline-none"
              placeholder="https://... (optional)"
            />
          </div>
        </div>

        {/* Secondary Links */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-300">Secondary Links (Patreon, Ko‑fi, ...)</label>
            <button
              onClick={addSecondary}
              className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 rounded"
            >
              Add
            </button>
          </div>
          <div className="space-y-2">
            {secondaryLinks.length === 0 && (
              <p className="text-xs text-gray-500">No secondary links added</p>
            )}
            {secondaryLinks.map((link, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                <input
                  type="text"
                  value={link.title}
                  onChange={(e) => updateSecondary(idx, 'title', e.target.value)}
                  className="col-span-4 px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-gray-100 focus:border-blue-500 focus:outline-none"
                  placeholder="Title (Patreon)"
                />
                <input
                  type="url"
                  value={link.url}
                  onChange={(e) => updateSecondary(idx, 'url', e.target.value)}
                  className="col-span-7 px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-gray-100 focus:border-blue-500 focus:outline-none"
                  placeholder="https://..."
                />
                <input
                  type="text"
                  value={link.icon}
                  onChange={(e) => updateSecondary(idx, 'icon', e.target.value)}
                  className="col-span-1 px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-gray-100 focus:border-blue-500 focus:outline-none text-center"
                  placeholder="☕"
                  maxLength={2}
                />
                <div className="col-span-12 flex justify-end">
                  <button
                    onClick={() => removeSecondary(idx)}
                    className="px-2 py-1 text-xs bg-red-600 hover:bg-red-700 rounded"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
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
