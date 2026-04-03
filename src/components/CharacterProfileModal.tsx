'use client'

import { useState, useEffect } from 'react'
import { X, User, Image as ImageIcon, BookOpen, Users as UsersIcon, Save } from 'lucide-react'
import { useToast } from '@/components/ui/Toast'

interface CategoryLabels {
  role?: string
  visualInfo?: string
  physicalDescription?: string
  age?: string
  height?: string
  appearanceNotes?: string
  backstory?: string
  personalityTraits?: string
  motivations?: string
  characterArc?: string
  authorNotes?: string
  [key: string]: string | undefined
}

interface CharacterProfile {
  id?: string
  name: string
  aliases: string[]
  role: string
  firstAppearance?: number
  imageUrl?: string
  quickGlance?: string
  physicalDescription?: string
  age?: string
  height?: string
  appearanceNotes?: string
  backstory?: string
  personalityTraits: string[]
  motivations?: string
  characterArc?: string
  authorNotes?: string
  categoryLabels?: CategoryLabels
  allowUserSubmissions?: boolean
}

interface CharacterProfileModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (character: CharacterProfile) => Promise<void>
  initialCharacter?: CharacterProfile | null
  currentChapter?: number
}

export default function CharacterProfileModal({
  isOpen,
  onClose,
  onSave,
  initialCharacter,
  currentChapter
}: CharacterProfileModalProps) {
  const [character, setCharacter] = useState<CharacterProfile>({
    name: '',
    aliases: [],
    role: '',
    firstAppearance: currentChapter || undefined,
    imageUrl: '',
    quickGlance: '',
    physicalDescription: '',
    age: '',
    height: '',
    appearanceNotes: '',
    backstory: '',
    personalityTraits: [],
    motivations: '',
    characterArc: '',
    authorNotes: '',
    categoryLabels: {},
    allowUserSubmissions: false
  })

  const [aliasInput, setAliasInput] = useState('')
  const [traitInput, setTraitInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [showCustomizeLabels, setShowCustomizeLabels] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (initialCharacter) {
      setCharacter(initialCharacter)
    } else if (currentChapter) {
      setCharacter(prev => ({ ...prev, firstAppearance: currentChapter }))
    }
  }, [initialCharacter, currentChapter])

  const handleSave = async () => {
    if (!character.name) {
      toast.warning('Character name is required')
      return
    }

    setSaving(true)
    try {
      await onSave(character)
      onClose()
    } catch (error) {
      console.error('Error saving character:', error)
      toast.error('Failed to save character. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const addAlias = () => {
    if (aliasInput.trim() && !character.aliases.includes(aliasInput.trim())) {
      setCharacter(prev => ({
        ...prev,
        aliases: [...prev.aliases, aliasInput.trim()]
      }))
      setAliasInput('')
    }
  }

  const removeAlias = (alias: string) => {
    setCharacter(prev => ({
      ...prev,
      aliases: prev.aliases.filter(a => a !== alias)
    }))
  }

  const addTrait = () => {
    if (traitInput.trim() && !character.personalityTraits.includes(traitInput.trim())) {
      setCharacter(prev => ({
        ...prev,
        personalityTraits: [...prev.personalityTraits, traitInput.trim()]
      }))
      setTraitInput('')
    }
  }

  const removeTrait = (trait: string) => {
    setCharacter(prev => ({
      ...prev,
      personalityTraits: prev.personalityTraits.filter(t => t !== trait)
    }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-4xl mx-4 my-8 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <User size={24} />
            {initialCharacter ? 'Edit Character Profile' : 'Add Character Profile'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            <X size={24} className="text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Basic Info Section */}
          <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Basic Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  value={character.name}
                  onChange={(e) => setCharacter(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Character name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Role/Archetype
                </label>
                <select
                  value={character.role}
                  onChange={(e) => setCharacter(prev => ({ ...prev, role: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">Select role...</option>
                  <option value="protagonist">Protagonist</option>
                  <option value="antagonist">Antagonist</option>
                  <option value="supporting">Supporting</option>
                  <option value="mentor">Mentor</option>
                  <option value="love_interest">Love Interest</option>
                  <option value="comic_relief">Comic Relief</option>
                  <option value="sidekick">Sidekick</option>
                  <option value="villain">Villain</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  First Appearance (Chapter)
                </label>
                <input
                  type="number"
                  value={character.firstAppearance || ''}
                  onChange={(e) => setCharacter(prev => ({ ...prev, firstAppearance: parseInt(e.target.value) || undefined }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Chapter number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Aliases
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={aliasInput}
                    onChange={(e) => setAliasInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAlias())}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Add alias..."
                  />
                  <button
                    onClick={addAlias}
                    className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {character.aliases.map((alias, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-sm"
                    >
                      {alias}
                      <button onClick={() => removeAlias(alias)} className="hover:text-blue-600">
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Visual Section */}
          <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <ImageIcon size={20} />
              Visual Information
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Profile Image URL
                </label>
                <input
                  type="text"
                  value={character.imageUrl || ''}
                  onChange={(e) => setCharacter(prev => ({ ...prev, imageUrl: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Quick Glance (Tooltip Text)
                </label>
                <textarea
                  value={character.quickGlance || ''}
                  onChange={(e) => setCharacter(prev => ({ ...prev, quickGlance: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Jimbo is Dave's dad who we first saw carrying a big bag out of his backdoor Tuesday night after Vince went missing."
                  rows={3}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  This short description appears when readers hover over the character's name. Keep it brief and intriguing!
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Age
                  </label>
                  <input
                    type="text"
                    value={character.age || ''}
                    onChange={(e) => setCharacter(prev => ({ ...prev, age: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="e.g., 25"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Height
                  </label>
                  <input
                    type="text"
                    value={character.height || ''}
                    onChange={(e) => setCharacter(prev => ({ ...prev, height: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="e.g., 5'10&quot;"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Physical Description
                </label>
                <textarea
                  value={character.physicalDescription || ''}
                  onChange={(e) => setCharacter(prev => ({ ...prev, physicalDescription: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Describe the character's physical appearance..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Appearance Notes
                </label>
                <input
                  type="text"
                  value={character.appearanceNotes || ''}
                  onChange={(e) => setCharacter(prev => ({ ...prev, appearanceNotes: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Additional appearance details..."
                />
              </div>
            </div>
          </div>

          {/* Background Section */}
          <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <BookOpen size={20} />
              Background & Personality
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Backstory
                </label>
                <textarea
                  value={character.backstory || ''}
                  onChange={(e) => setCharacter(prev => ({ ...prev, backstory: e.target.value }))}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Character's background and history..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Personality Traits
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={traitInput}
                    onChange={(e) => setTraitInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTrait())}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Add trait..."
                  />
                  <button
                    onClick={addTrait}
                    className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {character.personalityTraits.map((trait, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded text-sm"
                    >
                      {trait}
                      <button onClick={() => removeTrait(trait)} className="hover:text-purple-600">
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Motivations/Goals
                </label>
                <textarea
                  value={character.motivations || ''}
                  onChange={(e) => setCharacter(prev => ({ ...prev, motivations: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="What drives this character..."
                />
              </div>
            </div>
          </div>

          {/* Customization Section */}
          <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Profile Customization</h3>
            
            <div className="space-y-4">
              {/* Allow User Submissions Toggle */}
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Allow Fanart Submissions
                  </label>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Let readers submit fanart with artist credit
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setCharacter(prev => ({ ...prev, allowUserSubmissions: !prev.allowUserSubmissions }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    character.allowUserSubmissions ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      character.allowUserSubmissions ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Customize Category Labels */}
              <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <button
                  type="button"
                  onClick={() => setShowCustomizeLabels(!showCustomizeLabels)}
                  className="w-full flex items-center justify-between text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  <span>Customize Category Labels</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {showCustomizeLabels ? 'Hide' : 'Show'}
                  </span>
                </button>
                
                {showCustomizeLabels && (
                  <div className="mt-4 space-y-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                      Rename categories to customize this profile (e.g., "Backstory" → "Inner Thoughts")
                    </p>
                    
                    {[
                      { key: 'role', default: 'Role/Archetype' },
                      { key: 'visualInfo', default: 'Visual Information' },
                      { key: 'physicalDescription', default: 'Physical Description' },
                      { key: 'backstory', default: 'Backstory' },
                      { key: 'personalityTraits', default: 'Personality Traits' },
                      { key: 'motivations', default: 'Motivations/Goals' },
                      { key: 'characterArc', default: 'Character Arc Notes' },
                      { key: 'authorNotes', default: 'Private Author Notes' }
                    ].map(({ key, default: defaultLabel }) => (
                      <div key={key} className="grid grid-cols-2 gap-2 items-center">
                        <span className="text-xs text-gray-600 dark:text-gray-400">{defaultLabel}</span>
                        <input
                          type="text"
                          value={character.categoryLabels?.[key] || ''}
                          onChange={(e) => setCharacter(prev => ({
                            ...prev,
                            categoryLabels: {
                              ...prev.categoryLabels,
                              [key]: e.target.value
                            }
                          }))}
                          placeholder={defaultLabel}
                          className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Author Notes Section */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {character.categoryLabels?.authorNotes || 'Author Notes'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Character Arc Notes
                </label>
                <textarea
                  value={character.characterArc || ''}
                  onChange={(e) => setCharacter(prev => ({ ...prev, characterArc: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Track character development through the story..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Private Author Notes
                </label>
                <textarea
                  value={character.authorNotes || ''}
                  onChange={(e) => setCharacter(prev => ({ ...prev, authorNotes: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Private notes (not shown to readers)..."
                />
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !character.name}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Save size={16} />
            {saving ? 'Saving...' : 'Save Character'}
          </button>
        </div>
      </div>
    </div>
  )
}
