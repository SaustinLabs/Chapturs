'use client'

import { useState } from 'react'
import { PhotoIcon, PencilIcon } from '@heroicons/react/24/outline'
import ReactMarkdown from 'react-markdown'
import ImageUpload from '@/components/upload/ImageUpload'
import { useToast } from '@/components/ui/Toast'

interface BasicInfoEditorProps {
  displayName: string
  bio: string
  profileImage?: string
  coverImage?: string
  featuredType: 'work' | 'block' | 'none'
  featuredWorkId?: string
  featuredBlockId?: string
  availableWorks: any[]
  availableBlocks: any[]
  onUpdate: (field: string, value: string) => void
  onImageUpload: (type: 'profile' | 'cover', file: File) => void
}

/**
 * BasicInfoEditor - v0.3 with ImageUpload integration
 * Edit basic profile information: name, bio, images, and featured content
 */
export default function BasicInfoEditor({
  displayName,
  bio,
  profileImage,
  coverImage,
  featuredType,
  featuredWorkId,
  featuredBlockId,
  availableWorks,
  availableBlocks,
  onUpdate,
  onImageUpload
}: BasicInfoEditorProps) {
  const [isEditingBio, setIsEditingBio] = useState(false)
  const [bioText, setBioText] = useState(bio)
  const { toast } = useToast()

  const handleBioSave = () => {
    onUpdate('bio', bioText)
    setIsEditingBio(false)
  }

  return (
    <div className="space-y-6">
      {/* Cover Image */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Cover Image
        </label>
        <ImageUpload
          entityType="cover"
          currentImage={coverImage}
          onUploadComplete={(image) => {
            onUpdate('coverImage', image.urls.optimized)
          }}
          onUploadError={(error) => {
            console.error('Cover upload error:', error)
            toast.error(`Failed to upload cover image: ${error}`)
          }}
          label="Profile Cover"
          hint="Recommended: 1200×300px or wider"
        />
      </div>

      {/* Profile Image */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Profile Image
        </label>
        <ImageUpload
          entityType="profile"
          currentImage={profileImage}
          onUploadComplete={(image) => {
            onUpdate('profileImage', image.urls.optimized)
          }}
          onUploadError={(error) => {
            console.error('Profile upload error:', error)
            toast.error(`Failed to upload profile image: ${error}`)
          }}
          label="Profile Picture"
          hint="Recommended: Square image, at least 200×200px"
        />
      </div>

      {/* Display Name */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Display Name
        </label>
        <input
          type="text"
          value={displayName}
          onChange={(e) => onUpdate('displayName', e.target.value)}
          className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-gray-100 focus:border-blue-500 focus:outline-none"
          placeholder="Your display name"
        />
      </div>

      {/* Bio */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-300">
            Bio
          </label>
          <button
            onClick={() => isEditingBio ? handleBioSave() : setIsEditingBio(true)}
            className="text-xs text-blue-400 hover:text-blue-300"
          >
            {isEditingBio ? 'Save' : 'Edit'}
          </button>
        </div>
        
        {isEditingBio ? (
          <div>
            <textarea
              value={bioText}
              onChange={(e) => setBioText(e.target.value)}
              className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-gray-100 focus:border-blue-500 focus:outline-none font-mono text-sm"
              placeholder="Write your bio... (Markdown supported)"
              rows={6}
            />
            <p className="text-xs text-gray-500 mt-1">
              Supports Markdown formatting
            </p>
            <div className="flex gap-2 mt-2">
              <button
                onClick={handleBioSave}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm font-medium"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setBioText(bio)
                  setIsEditingBio(false)
                }}
                className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-gray-900 border border-gray-700 rounded-lg min-h-[100px]">
            {bio ? (
              <div className="prose prose-invert prose-sm max-w-none">
                <ReactMarkdown>{bio}</ReactMarkdown>
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No bio yet. Click Edit to add one.</p>
            )}
          </div>
        )}
      </div>

      {/* Featured Content */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Featured Content
          <span className="text-xs text-gray-500 ml-2">
            (appears prominently on your profile)
          </span>
        </label>
        
        {/* Featured Type Selector */}
        <div className="space-y-3">
          {/* Option 1: Featured Work */}
          <label className="flex items-start gap-3 p-3 bg-gray-900 border border-gray-700 rounded-lg cursor-pointer hover:border-gray-600 transition-colors">
            <input
              type="radio"
              name="featuredType"
              value="work"
              checked={featuredType === 'work'}
              onChange={(e) => onUpdate('featuredType', e.target.value)}
              className="mt-1"
            />
            <div className="flex-1">
              <div className="font-medium text-gray-100">Featured Work</div>
              <p className="text-xs text-gray-400 mt-1">
                Showcase one of your published works
              </p>
              
              {featuredType === 'work' && (
                <select
                  value={featuredWorkId || ''}
                  onChange={(e) => onUpdate('featuredWorkId', e.target.value)}
                  className="w-full mt-2 px-3 py-2 bg-gray-800 border border-gray-600 rounded text-sm text-gray-100 focus:border-blue-500 focus:outline-none"
                >
                  <option value="">Select a work...</option>
                  {availableWorks.map((work) => (
                    <option key={work.id} value={work.id}>
                      {work.title}
                    </option>
                  ))}
                </select>
              )}
              
              {featuredType === 'work' && availableWorks.length === 0 && (
                <p className="text-xs text-yellow-500 mt-2">
                  You don't have any published works yet.
                </p>
              )}
            </div>
          </label>

          {/* Option 2: Featured Block */}
          <label className="flex items-start gap-3 p-3 bg-gray-900 border border-gray-700 rounded-lg cursor-pointer hover:border-gray-600 transition-colors">
            <input
              type="radio"
              name="featuredType"
              value="block"
              checked={featuredType === 'block'}
              onChange={(e) => onUpdate('featuredType', e.target.value)}
              className="mt-1"
            />
            <div className="flex-1">
              <div className="font-medium text-gray-100">Featured Block</div>
              <p className="text-xs text-gray-400 mt-1">
                Feature a YouTube video, text, or other block instead
              </p>
              
              {featuredType === 'block' && (
                <select
                  value={featuredBlockId || ''}
                  onChange={(e) => onUpdate('featuredBlockId', e.target.value)}
                  className="w-full mt-2 px-3 py-2 bg-gray-800 border border-gray-600 rounded text-sm text-gray-100 focus:border-blue-500 focus:outline-none"
                >
                  <option value="">Select a block...</option>
                  {availableBlocks.map((block) => (
                    <option key={block.id} value={block.id}>
                      {block.type.replace('-', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())} - {block.id.slice(0, 8)}
                    </option>
                  ))}
                </select>
              )}
              
              {featuredType === 'block' && availableBlocks.length === 0 && (
                <p className="text-xs text-yellow-500 mt-2">
                  Add some blocks first, then you can feature one.
                </p>
              )}
            </div>
          </label>

          {/* Option 3: None */}
          <label className="flex items-start gap-3 p-3 bg-gray-900 border border-gray-700 rounded-lg cursor-pointer hover:border-gray-600 transition-colors">
            <input
              type="radio"
              name="featuredType"
              value="none"
              checked={featuredType === 'none'}
              onChange={(e) => onUpdate('featuredType', e.target.value)}
              className="mt-1"
            />
            <div className="flex-1">
              <div className="font-medium text-gray-100">No Featured Content</div>
              <p className="text-xs text-gray-400 mt-1">
                Leave the featured space empty
              </p>
            </div>
          </label>
        </div>
      </div>
    </div>
  )
}
