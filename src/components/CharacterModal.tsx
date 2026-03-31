'use client'

import { useState } from 'react'
import { X, Loader2 } from 'lucide-react'
import { measureTextRows } from '@/hooks/usePretext'

interface CharacterProfile {
  id?: string
  name: string
  role?: string
  imageUrl?: string
  quickGlance?: string
  physicalDescription?: string
  personality?: string
  backstory?: string
  motivations?: string
  characterArc?: string
  aliases?: string
  firstAppearance?: number
  allowUserSubmissions: boolean
}

interface CharacterModalProps {
  workId: string
  character?: CharacterProfile | null
  onClose: () => void
  onSuccess: () => void
}

export default function CharacterModal({ workId, character, onClose, onSuccess }: CharacterModalProps) {
  const [formData, setFormData] = useState({
    name: character?.name || '',
    role: character?.role || '',
    imageUrl: character?.imageUrl || '',
    quickGlance: character?.quickGlance || '',
    physicalDescription: character?.physicalDescription || '',
    personality: character?.personality || '',
    backstory: character?.backstory || '',
    motivations: character?.motivations || '',
    characterArc: character?.characterArc || '',
    aliases: character?.aliases || '',
    firstAppearance: character?.firstAppearance?.toString() || '',
    allowUserSubmissions: character?.allowUserSubmissions ?? true
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const textareaRows = {
    quickGlance: measureTextRows(formData.quickGlance, '14px Inter', 680, 20, { whiteSpace: 'pre-wrap' }, 2, 6),
    physicalDescription: measureTextRows(formData.physicalDescription, '14px Inter', 680, 20, { whiteSpace: 'pre-wrap' }, 3, 10),
    personality: measureTextRows(formData.personality, '14px Inter', 680, 20, { whiteSpace: 'pre-wrap' }, 3, 10),
    backstory: measureTextRows(formData.backstory, '14px Inter', 680, 20, { whiteSpace: 'pre-wrap' }, 3, 12),
    motivations: measureTextRows(formData.motivations, '14px Inter', 680, 20, { whiteSpace: 'pre-wrap' }, 3, 10),
    characterArc: measureTextRows(formData.characterArc, '14px Inter', 680, 20, { whiteSpace: 'pre-wrap' }, 3, 12)
  }

  const isEditing = !!character?.id

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const payload = {
        name: formData.name.trim(),
        role: formData.role.trim() || undefined,
        imageUrl: formData.imageUrl.trim() || undefined,
        quickGlance: formData.quickGlance.trim() || undefined,
        physicalDescription: formData.physicalDescription.trim() || undefined,
        personality: formData.personality.trim() || undefined,
        backstory: formData.backstory.trim() || undefined,
        motivations: formData.motivations.trim() || undefined,
        characterArc: formData.characterArc.trim() || undefined,
        aliases: formData.aliases.trim() || undefined,
        firstAppearance: formData.firstAppearance ? parseInt(formData.firstAppearance) : undefined,
        allowUserSubmissions: formData.allowUserSubmissions
      }

      const url = isEditing 
        ? `/api/works/${workId}/characters/${character.id}`
        : `/api/works/${workId}/characters`

      const res = await fetch(url, {
        method: isEditing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to save character')
      }

      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full p-6 my-8 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 sticky top-0 bg-white dark:bg-gray-800 pb-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {isEditing ? 'Edit Character Profile' : 'Add New Character'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Basic Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Character Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Sarah Chen"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Role */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Role <span className="text-gray-500 text-xs">(optional)</span>
                </label>
                <input
                  type="text"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  placeholder="e.g., Protagonist, Antagonist, Supporting"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Aliases */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Aliases / Other Names <span className="text-gray-500 text-xs">(optional)</span>
              </label>
              <input
                type="text"
                value={formData.aliases}
                onChange={(e) => setFormData({ ...formData, aliases: e.target.value })}
                placeholder="e.g., The Shadow, Phantom Thief"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Image URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Character Image URL <span className="text-gray-500 text-xs">(optional)</span>
              </label>
              <input
                type="url"
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                placeholder="https://example.com/character.jpg"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Paste an image URL or upload to an image hosting service
              </p>
            </div>

            {/* First Appearance */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                First Appearance (Chapter) <span className="text-gray-500 text-xs">(optional)</span>
              </label>
              <input
                type="number"
                min="1"
                value={formData.firstAppearance}
                onChange={(e) => setFormData({ ...formData, firstAppearance: e.target.value })}
                placeholder="e.g., 1"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Character Details Section */}
          <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Character Details</h3>

            {/* Quick Glance */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Quick Glance <span className="text-gray-500 text-xs">(max 500 chars)</span>
              </label>
              <textarea
                value={formData.quickGlance}
                onChange={(e) => setFormData({ ...formData, quickGlance: e.target.value.slice(0, 500) })}
                placeholder="A brief description shown on hover (e.g., 'A mysterious wanderer with a dark past')"
                rows={textareaRows.quickGlance}
                maxLength={500}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 resize-none"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {formData.quickGlance.length}/500 characters
              </p>
            </div>

            {/* Physical Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Physical Description <span className="text-gray-500 text-xs">(optional)</span>
              </label>
              <textarea
                value={formData.physicalDescription}
                onChange={(e) => setFormData({ ...formData, physicalDescription: e.target.value })}
                placeholder="Describe their appearance, height, build, distinctive features..."
                rows={textareaRows.physicalDescription}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            {/* Personality */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Personality <span className="text-gray-500 text-xs">(optional)</span>
              </label>
              <textarea
                value={formData.personality}
                onChange={(e) => setFormData({ ...formData, personality: e.target.value })}
                placeholder="Describe their personality traits, quirks, behavior patterns..."
                rows={textareaRows.personality}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            {/* Backstory */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Backstory <span className="text-gray-500 text-xs">(optional)</span>
              </label>
              <textarea
                value={formData.backstory}
                onChange={(e) => setFormData({ ...formData, backstory: e.target.value })}
                placeholder="Their history, origins, important past events..."
                rows={textareaRows.backstory}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            {/* Motivations */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Motivations <span className="text-gray-500 text-xs">(optional)</span>
              </label>
              <textarea
                value={formData.motivations}
                onChange={(e) => setFormData({ ...formData, motivations: e.target.value })}
                placeholder="What drives them? Goals, desires, fears..."
                rows={textareaRows.motivations}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            {/* Character Arc */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Character Arc <span className="text-gray-500 text-xs">(optional)</span>
              </label>
              <textarea
                value={formData.characterArc}
                onChange={(e) => setFormData({ ...formData, characterArc: e.target.value })}
                placeholder="How do they change throughout the story?"
                rows={textareaRows.characterArc}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
          </div>

          {/* Fanart Settings */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Fanart Settings</h3>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.allowUserSubmissions}
                onChange={(e) => setFormData({ ...formData, allowUserSubmissions: e.target.checked })}
                className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Allow fan-submitted artwork
                </span>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Readers can submit fanart for this character (requires your approval)
                </p>
              </div>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-6 sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !formData.name.trim()}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading && <Loader2 className="animate-spin" size={16} />}
              {loading ? 'Saving...' : isEditing ? 'Update Character' : 'Add Character'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
