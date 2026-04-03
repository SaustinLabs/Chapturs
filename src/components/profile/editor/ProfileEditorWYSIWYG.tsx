'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import ProfileLayout from '@/components/profile/ProfileLayout'
import ProfileSidebar from '@/components/profile/ProfileSidebar'
import EditableFeaturedSpace from './EditableFeaturedSpace'
import EditableBlockGrid from './EditableBlockGrid'
import BlockPicker from './BlockPicker'
import BasicInfoEditor from './BasicInfoEditor'
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
  CheckIcon,
  Cog6ToothIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline'
import Modal from '@/components/ui/Modal'
import { useDroppable } from '@dnd-kit/core'
import { useToast } from '@/components/ui/Toast'

/**
 * Internal: FeaturedDropZone component to handle droppable featured area and confirmation modal
 */
function FeaturedDropZone({
  type,
  workData,
  blockData,
  onSelectFeatured,
  onEditFeatured,
  onConfirmFeatured
}: {
  type: 'work' | 'block' | 'none'
  workData?: any
  blockData?: any
  onSelectFeatured: () => void
  onEditFeatured: () => void
  onConfirmFeatured: (blockId: string) => void
}) {
  const { isOver, setNodeRef } = useDroppable({ id: 'featured-dropzone' })
  const [showFeaturedConfirm, setShowFeaturedConfirm] = useState(false)
  const [pendingFeaturedBlockId, setPendingFeaturedBlockId] = useState<string | null>(null)

  const handleNativeDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const blockId = e.dataTransfer.getData('blockId')
    if (blockId) {
      setPendingFeaturedBlockId(blockId)
      setShowFeaturedConfirm(true)
    }
  }

  const cancelFeaturedBlock = () => {
    setShowFeaturedConfirm(false)
    setPendingFeaturedBlockId(null)
  }

  const confirmFeaturedBlock = () => {
    if (pendingFeaturedBlockId) {
      onConfirmFeatured(pendingFeaturedBlockId)
    }
    setShowFeaturedConfirm(false)
    setPendingFeaturedBlockId(null)
  }

  return (
    <div
      ref={setNodeRef}
      className={`relative ${isOver ? 'ring-4 ring-blue-500' : ''}`}
      style={{ minHeight: 500 }}
      onDrop={handleNativeDrop}
      onDragOver={(e) => e.preventDefault()}
    >
      <EditableFeaturedSpace
        type={type}
        workData={workData}
        blockData={blockData}
        onSelectFeatured={onSelectFeatured}
        onEditFeatured={onEditFeatured}
      />
      {showFeaturedConfirm && (
        <Modal isOpen={true} onClose={cancelFeaturedBlock} title="Feature this block?">
          <div className="p-6">
            <p className="mb-4">Are you sure you want to feature this block in your profile's featured area?</p>
            <div className="flex gap-4 justify-end">
              <button className="px-4 py-2 bg-gray-700 rounded" onClick={cancelFeaturedBlock}>Cancel</button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded" onClick={confirmFeaturedBlock}>Confirm</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

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
 * ProfileEditorWYSIWYG - v1.0
 * True WYSIWYG profile editor
 * - Looks exactly like the public profile but with edit controls
 * - No separate preview mode needed
 * - Inline editing with hover controls
 * - Block slots with plus buttons
 */
export default function ProfileEditorWYSIWYG() {
  const router = useRouter()
  const { toast } = useToast()
  const [isSaving, setIsSaving] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [availableWorks, setAvailableWorks] = useState<any[]>([])
  const [username, setUsername] = useState<string>('')
  const [showSettings, setShowSettings] = useState(false)
  const [showBlockPicker, setShowBlockPicker] = useState(false)
  const [pendingSlotPosition, setPendingSlotPosition] = useState<number | null>(null)

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
    console.log('Upload image:', type, file)
    setHasUnsavedChanges(true)
  }

  const handleAddBlockClick = (position: number) => {
    setPendingSlotPosition(position)
    setShowBlockPicker(true)
  }

  const handleBlockTypeSelected = (blockType: string) => {
    setShowBlockPicker(false)
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
      // Add new block at the pending position
      const position = pendingSlotPosition ?? profileData.blocks.length

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
        gridY: 0,
        width: defaultWidth,
        height: defaultHeight,
        isVisible: true,
        order: position
      }

      setProfileData(prev => ({
        ...prev,
        blocks: [...prev.blocks, newBlock]
      }))
      setPendingSlotPosition(null)
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
        toast.error('Failed to save profile. Please try again.')
      }
    } catch (error) {
      console.error('Save error:', error)
      toast.error('Failed to save profile. Please try again.')
    } finally {
      setIsSaving(false)
    }
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

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Top Editor Bar */}
      <div className="sticky top-0 z-30 h-16 bg-gray-800 border-b border-gray-700 flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/creator/dashboard')}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            title="Back to dashboard"
          >
            <ArrowLeftIcon className="w-5 h-5 text-gray-300" />
          </button>
          <h1 className="text-lg font-bold text-gray-100">
            Edit Profile
          </h1>
          {hasUnsavedChanges && (
            <span className="text-xs text-yellow-500">• Unsaved changes</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          >
            <Cog6ToothIcon className="w-4 h-4" />
            Settings
          </button>
          <button
            onClick={() => handleSave(false)}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-medium transition-colors"
            disabled={isSaving || !hasUnsavedChanges}
          >
            {isSaving ? 'Saving...' : 'Save Draft'}
          </button>
          <button
            onClick={() => handleSave(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            disabled={isSaving}
          >
            <CheckIcon className="w-4 h-4" />
            {profileData.isPublished ? 'Update & View' : 'Publish'}
          </button>
        </div>
      </div>

      {/* Main WYSIWYG Profile Layout */}
      <ProfileLayout
        sidebar={
          <ProfileSidebar
            profileImage={profileData.profileImage}
            displayName={profileData.displayName}
            bio={profileData.bio}
            username={username}
            isOwner={true}
          />
        }
        featured={
          <FeaturedDropZone
            type={profileData.featuredType}
            workData={getFeaturedWorkData()}
            blockData={getFeaturedBlockData()}
            onSelectFeatured={() => {
              // TODO: Open featured selection modal
              toast.info('Featured selection coming soon!')
            }}
            onEditFeatured={() => {
              // TODO: Open featured selection modal
              toast.info('Featured selection coming soon!')
            }}
            onConfirmFeatured={(blockId: string) => {
              setProfileData(prev => ({ ...prev, featuredType: 'block', featuredBlockId: blockId }))
              setHasUnsavedChanges(true)
            }}
          />
        }
        blocks={
          <EditableBlockGrid
            blocks={profileData.blocks}
            onAddBlock={handleAddBlockClick}
            onEditBlock={handleEditBlock}
            onDeleteBlock={handleDeleteBlock}
            onReorderBlocks={(newBlocks) => {
              setProfileData(prev => ({ ...prev, blocks: newBlocks }))
              setHasUnsavedChanges(true)
            }}
          />
        }
      />

      {/* Settings Sidebar */}
      {showSettings && (
        <Modal
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
          title="Profile Settings"
          size="lg"
        >
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
        </Modal>
      )}

      {/* Block Picker Modal */}
      {showBlockPicker && (
        <Modal
          isOpen={showBlockPicker}
          onClose={() => {
            setShowBlockPicker(false)
            setPendingSlotPosition(null)
          }}
          title="Choose Block Type"
          size="lg"
        >
          <BlockPicker
            onAddBlock={handleBlockTypeSelected}
            availableWorks={availableWorks}
            onQuickAddWork={(workId: string) => {
              // Close picker and open WorkCardConfig with pre-selected work
              setShowBlockPicker(false)
              setConfigModal({
                isOpen: true,
                blockType: 'work-card',
                initialData: { workId }
              })
            }}
          />
        </Modal>
      )}

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
