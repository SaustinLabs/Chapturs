'use client'

import { useState, useEffect } from 'react'
import { X, User, Image as ImageIcon, BookOpen, Users as UsersIcon, Upload } from 'lucide-react'
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

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-4xl mx-4 my-8 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <User size={24} />
            {character.name}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            <X size={24} className="text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Hero Section with Image and Quick Info */}
          <div className="flex flex-col md:flex-row gap-6 border-b border-gray-200 dark:border-gray-700 pb-6">
            {character.imageUrl && (
              <div className="flex-shrink-0">
                <img
                  src={character.imageUrl}
                  alt={character.name}
                  className="w-48 h-48 rounded-lg object-cover shadow-lg"
                />
              </div>
            )}
            
            <div className="flex-1">
              {character.role && (
                <div className="inline-block px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full text-sm font-medium mb-3">
                  {getLabel('role', 'Role')}: {character.role}
                </div>
              )}
              
              {character.aliases && character.aliases.length > 0 && (
                <div className="mb-3">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Also known as: </span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {character.aliases.join(', ')}
                  </span>
                </div>
              )}

              {character.quickGlance && (
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4 text-lg">
                  {character.quickGlance}
                </p>
              )}

              <div className="grid grid-cols-2 gap-4 text-sm">
                {character.age && (
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">Age:</span>{' '}
                    <span className="text-gray-600 dark:text-gray-400">{character.age}</span>
                  </div>
                )}
                {character.height && (
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">Height:</span>{' '}
                    <span className="text-gray-600 dark:text-gray-400">{character.height}</span>
                  </div>
                )}
                {character.firstAppearance && (
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">First Appearance:</span>{' '}
                    <span className="text-gray-600 dark:text-gray-400">Chapter {character.firstAppearance}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Physical Description */}
          {character.physicalDescription && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                <ImageIcon size={18} />
                {getLabel('physicalDescription', 'Physical Description')}
              </h3>
              <div className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {character.physicalDescription}
              </div>
            </div>
          )}

          {/* Appearance Notes */}
          {character.appearanceNotes && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {getLabel('appearanceNotes', 'Appearance Notes')}
              </h3>
              <div className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {character.appearanceNotes}
              </div>
            </div>
          )}

          {/* Backstory */}
          {character.backstory && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                <BookOpen size={18} />
                {getLabel('backstory', 'Backstory')}
              </h3>
              <div className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {character.backstory}
              </div>
            </div>
          )}

          {/* Personality Traits */}
          {character.personalityTraits && character.personalityTraits.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {getLabel('personalityTraits', 'Personality Traits')}
              </h3>
              <div className="flex flex-wrap gap-2">
                {character.personalityTraits.map((trait, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm"
                  >
                    {trait}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Motivations */}
          {character.motivations && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {getLabel('motivations', 'Motivations')}
              </h3>
              <div className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {character.motivations}
              </div>
            </div>
          )}

          {/* Character Arc */}
          {character.characterArc && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {getLabel('characterArc', 'Character Arc')}
              </h3>
              <div className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {character.characterArc}
              </div>
            </div>
          )}

          {/* Fanart Submissions Section */}
          {character.allowUserSubmissions && (
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                <ImageIcon size={18} />
                {getLabel('images', 'Fan Art Gallery')}
              </h3>
              
              {/* Display approved fanart */}
              {approvedFanart.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                  {approvedFanart.map((art) => (
                    <div key={art.id} className="group relative">
                      <img
                        src={art.imageUrl}
                        alt={`Fan art by ${art.artistName}`}
                        className="w-full h-48 object-cover rounded-lg shadow-md"
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 rounded-b-lg">
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

              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                The author is accepting fan art submissions for this character!
              </p>
              
              {!showSubmitFanart ? (
                <button
                  onClick={() => setShowSubmitFanart(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  <Upload size={18} />
                  Submit Fan Art
                </button>
              ) : (
                <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3">Submit Your Fan Art</h4>
                  
                  <div className="space-y-3">
                    {/* Image Upload */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Fan Art Image *
                      </label>
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
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Artist Name *
                      </label>
                      <input
                        type="text"
                        value={formData.artistName}
                        onChange={(e) => setFormData(prev => ({ ...prev, artistName: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="Your name or handle"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Portfolio Link (Optional)
                        </label>
                        <input
                          type="text"
                          value={formData.artistLink}
                          onChange={(e) => setFormData(prev => ({ ...prev, artistLink: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          placeholder="https://yourportfolio.com"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Social Handle (Optional)
                        </label>
                        <input
                          type="text"
                          value={formData.artistHandle}
                          onChange={(e) => setFormData(prev => ({ ...prev, artistHandle: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          placeholder="@yourhandle"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Notes (Optional)
                      </label>
                      <textarea
                        value={formData.notes}
                        onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="Any notes about your artwork..."
                        rows={2}
                      />
                    </div>

                    <div className="flex gap-2">
                      <button 
                        onClick={handleSubmitFanart}
                        disabled={submitting || !formData.imageUrl}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {submitting ? 'Submitting...' : 'Submit'}
                      </button>
                      <button
                        onClick={() => setShowSubmitFanart(false)}
                        disabled={submitting}
                        className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-400 dark:hover:bg-gray-500 disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    </div>
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
