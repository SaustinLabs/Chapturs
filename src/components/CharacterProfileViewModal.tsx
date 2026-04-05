'use client'

import { useState, useEffect } from 'react'
import { Upload } from 'lucide-react'
import ImageUpload from '@/components/upload/ImageUpload'
import { useToast } from '@/components/ui/Toast'

interface Character {
  id: string
  name: string
  aliases?: string[]
  role?: string
  firstAppearance?: number
  imageUrl?: string
  quickGlance?: string
  physicalDescription?: string
  age?: string
  height?: string
  appearanceNotes?: string
  backstory?: string
  personalityTraits?: string[]
  motivations?: string
  characterArc?: string
  authorNotes?: string
  categoryLabels?: Record<string, string>
  allowUserSubmissions?: boolean
  [key: string]: any
}

interface CharacterProfileViewModalProps {
  character: Character
  isOpen: boolean
  onClose: () => void
}

export default function CharacterProfileViewModal({
  character,
  isOpen,
  onClose
}: CharacterProfileViewModalProps) {
  const [showSubmitFanart, setShowSubmitFanart] = useState(false)
  const { toast } = useToast()
  const [approvedFanart, setApprovedFanart] = useState<any[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    imageUrl: '',
    artistName: '',
    artistLink: '',
    artistHandle: '',
    notes: ''
  })

  // Get custom label or default
  const getLabel = (field: string, defaultLabel: string) => {
    return character.categoryLabels?.[field] || defaultLabel
  }

  // Fetch approved fanart when modal opens
  useEffect(() => {
    if (isOpen && character.allowUserSubmissions) {
      fetch(`/api/works/${character.workId}/characters/${character.id}/submissions?status=approved`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setApprovedFanart(data.submissions || [])
          }
        })
        .catch(err => console.error('Failed to load fanart:', err))
    }
  }, [isOpen, character.id, character.workId, character.allowUserSubmissions])

  const handleSubmitFanart = async () => {
    if (!formData.imageUrl || !formData.artistName) {
      toast.warning('Image URL and Artist Name are required')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch(`/api/works/${character.workId}/characters/${character.id}/submissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || 'Submission failed')
      }

      toast.success('Fanart submitted! It will appear once the author approves it.')
      setShowSubmitFanart(false)
      setFormData({ imageUrl: '', artistName: '', artistLink: '', artistHandle: '', notes: '' })
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit fanart')
    } finally {
      setSubmitting(false)
    }
  }

  useEffect(() => {
    if (!isOpen) return
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-black/55 z-[80] flex items-end md:items-center justify-center"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="reader-sheet-rise w-full md:max-w-2xl bg-white dark:bg-gray-900 rounded-t-2xl md:rounded-2xl border border-gray-200 dark:border-gray-700 shadow-2xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile drag handle */}
        <div className="py-2 flex justify-center md:hidden flex-shrink-0">
          <div className="w-10 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600" />
        </div>

        {/* Header — matches glossary sheet style */}
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between flex-shrink-0">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{character.name}</h3>
            {character.role && (
              <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">{character.role.replace(/_/g, ' ')}</span>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-2 py-1 text-xs text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            Close
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-4 space-y-4">
          {/* Hero: image + quick glance + aliases */}
          {(character.imageUrl || character.quickGlance || (character.aliases && character.aliases.length > 0)) && (
            <div className="flex gap-3">
              {character.imageUrl && (
                <img
                  src={character.imageUrl}
                  alt={character.name}
                  className="w-20 h-20 rounded-xl object-cover shadow-md flex-shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                {character.aliases && character.aliases.length > 0 && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                    aka {character.aliases.join(', ')}
                  </p>
                )}
                {character.quickGlance && (
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                    {character.quickGlance}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Stats chips */}
          {(character.age || character.height || character.firstAppearance) && (
            <div className="flex flex-wrap gap-2">
              {character.age && (
                <span className="px-2.5 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-xs text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
                  Age: {character.age}
                </span>
              )}
              {character.height && (
                <span className="px-2.5 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-xs text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
                  Height: {character.height}
                </span>
              )}
              {character.firstAppearance && (
                <span className="px-2.5 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-xs text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
                  First seen: Ch. {character.firstAppearance}
                </span>
              )}
            </div>
          )}

          {/* Personality traits */}
          {character.personalityTraits && character.personalityTraits.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                {getLabel('personalityTraits', 'Personality')}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {character.personalityTraits.map((trait, index) => (
                  <span
                    key={index}
                    className="px-2.5 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs border border-blue-200 dark:border-blue-800"
                  >
                    {trait}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Text sections — card style matching glossary terms */}
          {character.physicalDescription && (
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-3">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                {getLabel('physicalDescription', 'Appearance')}
              </p>
              <p className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                {character.physicalDescription}
              </p>
              {character.appearanceNotes && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 italic">
                  {character.appearanceNotes}
                </p>
              )}
            </div>
          )}

          {!character.physicalDescription && character.appearanceNotes && (
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-3">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                {getLabel('appearanceNotes', 'Appearance Notes')}
              </p>
              <p className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                {character.appearanceNotes}
              </p>
            </div>
          )}

          {character.backstory && (
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-3">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                {getLabel('backstory', 'Backstory')}
              </p>
              <p className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                {character.backstory}
              </p>
            </div>
          )}

          {character.motivations && (
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-3">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                {getLabel('motivations', 'Motivations')}
              </p>
              <p className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                {character.motivations}
              </p>
            </div>
          )}

          {character.characterArc && (
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-3">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                {getLabel('characterArc', 'Arc')}
              </p>
              <p className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                {character.characterArc}
              </p>
            </div>
          )}

          {/* Fan Art */}
          {character.allowUserSubmissions && (
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                {getLabel('images', 'Fan Art')}
              </p>
              
              {/* Display approved fanart */}
              {approvedFanart.length > 0 && (
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {approvedFanart.map((art) => (
                    <div key={art.id} className="relative">
                      <img
                        src={art.imageUrl}
                        alt={`Fan art by ${art.artistName}`}
                        className="w-full h-36 object-cover rounded-xl"
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2 rounded-b-xl">
                        <p className="text-white text-xs font-medium">{art.artistName}</p>
                        {art.artistLink && (
                          <a 
                            href={art.artistLink} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-300 hover:text-blue-200 text-xs"
                          >
                            Portfolio →
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                The author is accepting fan art submissions for this character!
              </p>
              
              {!showSubmitFanart ? (
                <button
                  onClick={() => setShowSubmitFanart(true)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs hover:bg-blue-700 transition-colors"
                >
                  <Upload size={14} />
                  Submit Fan Art
                </button>
              ) : (
                <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-3 space-y-3">
                  <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300">Submit Your Fan Art</h4>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Fan Art Image *</label>
                    <ImageUpload
                      entityType="fanart"
                      entityId={character.id}
                      currentImage={formData.imageUrl}
                      onUploadComplete={(image) => {
                        setFormData(prev => ({ ...prev, imageUrl: image.urls.optimized }))
                      }}
                      onUploadError={(error) => {
                        console.error('Fanart upload error:', error)
                        toast.error(`Failed to upload fanart: ${error}`)
                      }}
                      label="Upload Your Artwork"
                      hint="Any size, 1200px recommended. Max 8MB."
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Artist Name *</label>
                    <input
                      type="text"
                      value={formData.artistName}
                      onChange={(e) => setFormData(prev => ({ ...prev, artistName: e.target.value }))}
                      className="w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="Your name or handle"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Portfolio Link</label>
                      <input
                        type="text"
                        value={formData.artistLink}
                        onChange={(e) => setFormData(prev => ({ ...prev, artistLink: e.target.value }))}
                        className="w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="https://..."
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Social Handle</label>
                      <input
                        type="text"
                        value={formData.artistHandle}
                        onChange={(e) => setFormData(prev => ({ ...prev, artistHandle: e.target.value }))}
                        className="w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="@yourhandle"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                      className="w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                      placeholder="Any notes..."
                      rows={2}
                    />
                  </div>

                  <div className="flex gap-2">
                    <button 
                      onClick={handleSubmitFanart}
                      disabled={submitting || !formData.imageUrl}
                      className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submitting ? 'Submitting...' : 'Submit'}
                    </button>
                    <button
                      onClick={() => setShowSubmitFanart(false)}
                      disabled={submitting}
                      className="px-3 py-1.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-xs hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
