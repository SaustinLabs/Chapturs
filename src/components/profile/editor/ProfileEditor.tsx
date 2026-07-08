'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import BlockPicker from '@/components/profile/editor/BlockPicker'
import BasicInfoEditor from '@/components/profile/editor/BasicInfoEditor'
import ProfileLayout from '@/components/profile/ProfileLayout'
import ProfileSidebar from '@/components/profile/ProfileSidebar'
import FeaturedSpace from '@/components/profile/FeaturedSpace'
import BlockGrid from '@/components/profile/BlockGrid'
import { getBlockInfo } from '@/components/profile/blocks'
import { 
  WorkCardConfig,
  TextBoxConfig,
  YouTubeVideoConfig,
  ExternalLinkConfig,
  DiscordInviteConfig,
  TwitchChannelConfig,
  YouTubeChannelConfig,
  TwitterFeedConfig,
  FavoriteAuthorConfig,
  SupportBlockConfig
} from '@/components/profile/config'
import { 
  EyeIcon, 
  ArrowLeftIcon, 
  CheckIcon,
  Cog6ToothIcon,
  PaintBrushIcon
} from '@heroicons/react/24/outline'

interface ProfileData {
  displayName: string
  bio: string
  profileImage?: string
  coverImage?: string
  featuredType: 'work' | 'block' | 'none'
  featuredWorkId?: string
  featuredBlockId?: string
  accentColor: string
  fontStyle: string
  backgroundStyle: string
  isPublished: boolean
  blocks: any[]
}

interface ConfigModalState {
  isOpen: boolean
  blockType: string | null
  blockId?: string
  initialData?: any
}

/**
 * ProfileEditor - v0.3
 * Full profile editing interface with:
 * - All 9 block configuration modals
 * - Featured work/block selection
 * - Real profile preview with actual components
 */
export default function ProfileEditor() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'basic' | 'blocks' | 'style'>('basic')
  const [previewMode, setPreviewMode] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [availableWorks, setAvailableWorks] = useState<any[]>([])
  const [username, setUsername] = useState<string>('')

  // Configuration modal state
  const [configModal, setConfigModal] = useState<ConfigModalState>({
    isOpen: false,
    blockType: null
  })

  // Profile data state
  const [profileData, setProfileData] = useState<ProfileData>({
    displayName: '',
    bio: '',
    featuredType: 'none',
    accentColor: '#3B82F6',
    fontStyle: 'default',
    backgroundStyle: 'solid',
    isPublished: false,
    blocks: []
  })

  // Load profile data, works, and username on mount
  useEffect(() => {
    loadProfile()
    loadWorks()
    loadUsername()
  }, [])

  const loadProfile = async () => {
    try {
      const response = await fetch('/api/creator/profile')
      if (response.ok) {
        const data = await response.json()
        setProfileData(data)
      }
    } catch (error) {
      console.error('Failed to load profile:', error)
    }
  }

  const loadWorks = async () => {
    try {
      const response = await fetch('/api/creator/works')
      if (response.ok) {
        const data = await response.json()
        setAvailableWorks(data.works || [])
      }
    } catch (error) {
      console.error('Failed to load works:', error)
    }
  }

  const loadUsername = async () => {
    try {
      const response = await fetch('/api/user/profile')
      if (response.ok) {
        const data = await response.json()
        setUsername(data.username || data.id)
      }
    } catch (error) {
      console.error('Failed to load username:', error)
    }
  }

  const handleUpdate = (field: string, value: any) => {
    setProfileData(prev => ({ ...prev, [field]: value }))
    setHasUnsavedChanges(true)
  }

  const handleImageUpload = async (type: 'profile' | 'cover', file: File) => {
    // TODO: Implement image upload to storage
    setHasUnsavedChanges(true)
  }

  const handleAddBlock = (blockType: string) => {
    // Open configuration modal for this block type
    setConfigModal({
      isOpen: true,
      blockType,
      initialData: undefined
    })
  }

  const handleConfigSave = (data: any) => {
    const { blockType, blockId } = configModal

    if (blockId) {
      // Update existing block
      setProfileData(prev => ({
        ...prev,
        blocks: prev.blocks.map(b =>
          b.id === blockId
            ? { ...b, data: JSON.stringify(data) }
            : b
        )
      }))
    } else {
      // Add new block
      const nextY = profileData.blocks.length > 0
        ? Math.max(...profileData.blocks.map((b: any) => b.gridY + b.height))
        : 0

      // Use default size from registry when available
      let defaultWidth = 1
      let defaultHeight = 1
      const info: any = getBlockInfo(blockType as any)
      if (info?.defaultSize) {
        defaultWidth = info.defaultSize.width ?? 1
        defaultHeight = info.defaultSize.height ?? 1
      }

      const newBlock = {
        id: `temp-${Date.now()}`,
        type: blockType,
        data: JSON.stringify(data),
        gridX: 0,
        gridY: nextY,
        width: defaultWidth,
        height: defaultHeight,
        isVisible: true,
        order: profileData.blocks.length
      }

      setProfileData(prev => ({
        ...prev,
        blocks: [...prev.blocks, newBlock]
      }))
    }

    setHasUnsavedChanges(true)
    setConfigModal({ isOpen: false, blockType: null })
  }

  const handleEditBlock = (blockId: string) => {
    const block = profileData.blocks.find((b: any) => b.id === blockId)
    if (!block) return

    const data = typeof block.data === 'string' 
      ? JSON.parse(block.data) 
      : block.data

    setConfigModal({
      isOpen: true,
      blockType: block.type,
      blockId,
      initialData: data
    })
  }

  const handleDeleteBlock = (blockId: string) => {
    setProfileData(prev => ({
      ...prev,
      blocks: prev.blocks.filter(b => b.id !== blockId)
    }))
    setHasUnsavedChanges(true)
  }

  const handleExpandBlock = (blockId: string, direction: 'width' | 'height') => {
    setProfileData(prev => ({
      ...prev,
      blocks: prev.blocks.map(b =>
        b.id === blockId
          ? {
              ...b,
              [direction]: direction === 'width' ? 2 : b.width,
              height: direction === 'height' ? 2 : b.height
            }
          : b
      )
    }))
    setHasUnsavedChanges(true)
  }

  // Helper function to get featured work data
  const getFeaturedWorkData = () => {
    if (profileData.featuredType !== 'work' || !profileData.featuredWorkId) {
      return undefined
    }
    const work = availableWorks.find(w => w.id === profileData.featuredWorkId)
    return work ? {
      id: work.id,
      title: work.title,
      coverImage: work.coverImage,
      description: work.description || '',
      genres: work.genres || [],
      status: work.status || 'Ongoing'
    } : undefined
  }

  // Helper function to get featured block data
  const getFeaturedBlockData = () => {
    if (profileData.featuredType !== 'block' || !profileData.featuredBlockId) {
      return undefined
    }
    const block = profileData.blocks.find(b => b.id === profileData.featuredBlockId)
    return block ? {
      id: block.id,
      type: block.type,
      data: typeof block.data === 'string' ? block.data : JSON.stringify(block.data)
    } : undefined
  }

  const handleSave = async (publish = false) => {
    setIsSaving(true)
    try {
      const response = await fetch('/api/creator/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...profileData,
          isPublished: publish ? true : profileData.isPublished
        })
      })

      if (response.ok) {
        setHasUnsavedChanges(false)
        if (publish) {
          // Redirect to public profile
          const data = await response.json()
          router.push(`/profile/${data.username}`)
        }
      } else {
        console.error('Failed to save profile')
      }
    } catch (error) {
      console.error('Save error:', error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-gray-900">
      {/* Left Sidebar - Block Picker or Settings */}
      {!previewMode && (
        <div className="flex-shrink-0 border-r border-gray-700">
          {activeTab === 'blocks' ? (
            <BlockPicker onAddBlock={handleAddBlock} />
          ) : activeTab === 'style' ? (
            <StyleEditor
              accentColor={profileData.accentColor}
              fontStyle={profileData.fontStyle}
              backgroundStyle={profileData.backgroundStyle}
              onUpdate={handleUpdate}
            />
          ) : (
            <div className="w-80 bg-gray-800 p-4 overflow-y-auto max-h-screen">
              <BasicInfoEditor
                displayName={profileData.displayName}
                bio={profileData.bio}
                profileImage={profileData.profileImage}
                coverImage={profileData.coverImage}
                featuredType={profileData.featuredType}
                featuredWorkId={profileData.featuredWorkId}
                featuredBlockId={profileData.featuredBlockId}
                availableWorks={availableWorks}
                availableBlocks={profileData.blocks}
                onUpdate={handleUpdate}
                onImageUpload={handleImageUpload}
              />
            </div>
          )}
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top Bar */}
        <div className="sticky top-0 z-10 h-16 bg-gray-800 border-b border-gray-700 flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-bold text-gray-100">
              Edit Profile
            </h1>
            {hasUnsavedChanges && (
              <span className="text-xs text-yellow-500">• Unsaved changes</span>
            )}
          </div>

          {/* Tab Controls */}
          {!previewMode && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('basic')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'basic'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                <Cog6ToothIcon className="w-4 h-4 inline mr-1" />
                Basic Info
              </button>
              <button
                onClick={() => setActiveTab('blocks')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'blocks'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Blocks
              </button>
              <button
                onClick={() => setActiveTab('style')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === 'style'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                <PaintBrushIcon className="w-4 h-4 inline mr-1" />
                Style
              </button>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPreviewMode(!previewMode)}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              <EyeIcon className="w-4 h-4" />
              {previewMode ? 'Edit' : 'Preview'}
            </button>
            <button
              onClick={() => handleSave(false)}
              disabled={!hasUnsavedChanges || isSaving}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 rounded-lg text-sm font-medium transition-colors"
            >
              {isSaving ? 'Saving...' : 'Save Draft'}
            </button>
            <button
              onClick={() => handleSave(true)}
              disabled={isSaving}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              <CheckIcon className="w-4 h-4" />
              Publish
            </button>
          </div>
        </div>

        {/* Preview/Edit Area */}
        <div className="flex-1 overflow-y-auto bg-gray-900">
          {previewMode ? (
            <div>
              {/* Preview Mode Banner */}
              <div className="sticky top-0 z-20 bg-gray-900 border-b border-gray-700">
                <div className="max-w-7xl mx-auto px-6 py-4">
                  <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <EyeIcon className="w-5 h-5 text-blue-400" />
                      <p className="text-sm text-blue-300 font-medium">
                        Preview Mode - This is how your profile appears to visitors
                      </p>
                    </div>
                    <button
                      onClick={() => setPreviewMode(false)}
                      className="text-sm text-blue-400 hover:text-blue-300 font-medium"
                    >
                      Exit Preview
                    </button>
                  </div>
                </div>
              </div>

              {/* Actual Profile Preview */}
              <ProfileLayout
                sidebar={
                  <ProfileSidebar
                    profileImage={profileData.profileImage}
                    displayName={profileData.displayName || 'Your Name'}
                    username={username || 'username'}
                    bio={profileData.bio}
                    isOwner={false} // Show visitor view
                  />
                }
                featured={
                  <FeaturedSpace
                    type={profileData.featuredType}
                    workData={getFeaturedWorkData()}
                    blockData={getFeaturedBlockData()}
                    isOwner={false} // Show visitor view
                  />
                }
                blocks={
                  <BlockGrid
                    blocks={profileData.blocks.map(block => ({
                      ...block,
                      data: typeof block.data === 'string' ? JSON.parse(block.data) : block.data
                    }))}
                    isOwner={false} // Show visitor view
                  />
                }
              />
            </div>
          ) : (
            <div className="p-8">
              <div className="max-w-4xl mx-auto space-y-6">
                {/* Editor Instructions */}
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                  <h3 className="font-semibold text-gray-100 mb-2">
                    {activeTab === 'basic' && '✏️ Edit Your Basic Info'}
                    {activeTab === 'blocks' && '🧩 Add Content Blocks'}
                    {activeTab === 'style' && '🎨 Customize Your Style'}
                  </h3>
                  <p className="text-sm text-gray-400">
                    {activeTab === 'basic' && 'Use the panel on the left to edit your profile picture, display name, and bio.'}
                    {activeTab === 'blocks' && 'Click blocks from the left panel to add them to your profile. Blocks can be expanded in one direction.'}
                    {activeTab === 'style' && 'Choose your accent color, font style, and background to match your brand.'}
                  </p>
                </div>

                {/* Block List (when in blocks tab) */}
                {activeTab === 'blocks' && (
                  <div className="space-y-3">
                    <h4 className="font-semibold text-gray-200">Your Blocks ({profileData.blocks.length})</h4>
                    {profileData.blocks.length === 0 ? (
                      <div className="bg-gray-800 border border-gray-700 rounded-lg p-8 text-center">
                        <p className="text-gray-400">
                          No blocks yet. Add some from the left panel!
                        </p>
                      </div>
                    ) : (
                      profileData.blocks.map((block, index) => (
                        <div
                          key={block.id}
                          className="bg-gray-800 border border-gray-700 rounded-lg p-4 flex items-center justify-between hover:bg-gray-750 transition-colors"
                        >
                          <div className="flex-1">
                            <h5 className="font-medium text-gray-100">
                              Block {index + 1}: {block.type}
                            </h5>
                            <p className="text-xs text-gray-400">
                              Size: {block.width}×{block.height} | Position: ({block.gridX}, {block.gridY})
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditBlock(block.id)}
                              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm"
                            >
                              Configure
                            </button>
                            <button
                              onClick={() => handleDeleteBlock(block.id)}
                              className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Configuration Modals */}
      {configModal.blockType === 'work-card' && (
        <WorkCardConfig
          isOpen={configModal.isOpen}
          onClose={() => setConfigModal({ isOpen: false, blockType: null })}
          onSave={handleConfigSave}
          initialData={configModal.initialData}
          availableWorks={availableWorks}
        />
      )}

      {configModal.blockType === 'text-box' && (
        <TextBoxConfig
          isOpen={configModal.isOpen}
          onClose={() => setConfigModal({ isOpen: false, blockType: null })}
          onSave={handleConfigSave}
          initialData={configModal.initialData}
        />
      )}

      {configModal.blockType === 'youtube-video' && (
        <YouTubeVideoConfig
          isOpen={configModal.isOpen}
          onClose={() => setConfigModal({ isOpen: false, blockType: null })}
          onSave={handleConfigSave}
          initialData={configModal.initialData}
        />
      )}

      {configModal.blockType === 'external-link' && (
        <ExternalLinkConfig
          isOpen={configModal.isOpen}
          onClose={() => setConfigModal({ isOpen: false, blockType: null })}
          onSave={handleConfigSave}
          initialData={configModal.initialData}
        />
      )}

      {configModal.blockType === 'discord-invite' && (
        <DiscordInviteConfig
          isOpen={configModal.isOpen}
          onClose={() => setConfigModal({ isOpen: false, blockType: null })}
          onSave={handleConfigSave}
          initialData={configModal.initialData}
        />
      )}

      {configModal.blockType === 'twitch-channel' && (
        <TwitchChannelConfig
          isOpen={configModal.isOpen}
          onClose={() => setConfigModal({ isOpen: false, blockType: null })}
          onSave={handleConfigSave}
          initialData={configModal.initialData}
        />
      )}

      {configModal.blockType === 'youtube-channel' && (
        <YouTubeChannelConfig
          isOpen={configModal.isOpen}
          onClose={() => setConfigModal({ isOpen: false, blockType: null })}
          onSave={handleConfigSave}
          initialData={configModal.initialData}
        />
      )}

      {configModal.blockType === 'twitter-feed' && (
        <TwitterFeedConfig
          isOpen={configModal.isOpen}
          onClose={() => setConfigModal({ isOpen: false, blockType: null })}
          onSave={handleConfigSave}
          initialData={configModal.initialData}
        />
      )}

      {configModal.blockType === 'favorite-author' && (
        <FavoriteAuthorConfig
          isOpen={configModal.isOpen}
          onClose={() => setConfigModal({ isOpen: false, blockType: null })}
          onSave={handleConfigSave}
          initialData={configModal.initialData}
        />
      )}

      {configModal.blockType === 'support' && (
        <SupportBlockConfig
          isOpen={configModal.isOpen}
          onClose={() => setConfigModal({ isOpen: false, blockType: null })}
          onSave={handleConfigSave}
          initialData={configModal.initialData}
        />
      )}
    </div>
  )
}

// Style Editor Component
function StyleEditor({
  accentColor,
  fontStyle,
  backgroundStyle,
  onUpdate
}: {
  accentColor: string
  fontStyle: string
  backgroundStyle: string
  onUpdate: (field: string, value: string) => void
}) {
  const colors = [
    { name: 'Blue', value: '#3B82F6' },
    { name: 'Purple', value: '#9333EA' },
    { name: 'Pink', value: '#EC4899' },
    { name: 'Red', value: '#EF4444' },
    { name: 'Orange', value: '#F97316' },
    { name: 'Green', value: '#10B981' },
  ]

  return (
    <div className="w-80 bg-gray-800 border-r border-gray-700 p-4 overflow-y-auto">
      <h2 className="text-lg font-bold text-gray-100 mb-4">Style Settings</h2>

      {/* Accent Color */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-3">
          Accent Color
        </label>
        <div className="grid grid-cols-3 gap-2">
          {colors.map(color => (
            <button
              key={color.value}
              onClick={() => onUpdate('accentColor', color.value)}
              className={`h-12 rounded-lg border-2 transition-all ${
                accentColor === color.value
                  ? 'border-white scale-105'
                  : 'border-gray-700 hover:border-gray-600'
              }`}
              style={{ backgroundColor: color.value }}
              title={color.name}
            />
          ))}
        </div>
      </div>

      {/* Font Style */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-3">
          Font Style
        </label>
        <select
          value={fontStyle}
          onChange={(e) => onUpdate('fontStyle', e.target.value)}
          className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-gray-100"
        >
          <option value="default">Default</option>
          <option value="serif">Serif</option>
          <option value="mono">Monospace</option>
        </select>
      </div>

      {/* Background Style */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-3">
          Background
        </label>
        <select
          value={backgroundStyle}
          onChange={(e) => onUpdate('backgroundStyle', e.target.value)}
          className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-gray-100"
        >
          <option value="solid">Solid</option>
          <option value="gradient">Gradient</option>
          <option value="pattern">Pattern</option>
        </select>
      </div>
    </div>
  )
}
