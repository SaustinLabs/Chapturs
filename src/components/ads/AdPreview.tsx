/**
 * Ad Placement Preview Component
 * 
 * Shows how ads would appear to readers in the actual content
 */

'use client'

import React from 'react'
import { AdPlacement, AdFormat, AdPlacementType } from '@/types/ads'
import { 
  Eye, 
  X, 
  ExternalLink,
  Volume2,
  VolumeX,
  Play,
  Pause,
  SkipForward
} from 'lucide-react'

interface AdPreviewProps {
  placement: AdPlacement
  isVisible: boolean
  onClose?: () => void
  onInteraction?: (type: 'view' | 'click' | 'close') => void
}

export default function AdPreview({ 
  placement, 
  isVisible, 
  onClose, 
  onInteraction 
}: AdPreviewProps) {
  const [isVideoPlaying, setIsVideoPlaying] = React.useState(false)
  const [isMuted, setIsMuted] = React.useState(true)
  const [showSkip, setShowSkip] = React.useState(false)

  React.useEffect(() => {
    if (placement.format === AdFormat.VIDEO && isVideoPlaying) {
      const timer = setTimeout(() => setShowSkip(true), 5000) // Show skip after 5s
      return () => clearTimeout(timer)
    }
  }, [isVideoPlaying, placement.format])

  React.useEffect(() => {
    if (isVisible) {
      onInteraction?.('view')
    }
  }, [isVisible, onInteraction])

  if (!isVisible) return null

  const handleClick = () => {
    onInteraction?.('click')
    // In real implementation, this would open advertiser landing page
  }

  const handleClose = () => {
    onInteraction?.('close')
    onClose?.()
  }

  const getAdContent = () => {
    switch (placement.format) {
      case AdFormat.BANNER:
        return (
          <div 
            className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 rounded cursor-pointer hover:shadow-lg transition-shadow"
            onClick={handleClick}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg">Epic Fantasy Adventure</h3>
                <p className="text-sm opacity-90">Discover new realms in this immersive experience</p>
                <button className="mt-2 bg-white text-blue-600 px-4 py-1 rounded text-sm font-medium hover:bg-blue-50">
                  Learn More
                </button>
              </div>
              <div className="text-4xl">🏰</div>
            </div>
          </div>
        )

      case AdFormat.SQUARE:
        return (
          <div 
            className="bg-white border-2 border-gray-200 rounded-lg p-6 cursor-pointer hover:border-blue-300 transition-colors aspect-square flex flex-col items-center justify-center text-center"
            onClick={handleClick}
          >
            <div className="text-6xl mb-4">📱</div>
            <h3 className="font-bold text-lg text-gray-900 mb-2">Reading App Pro</h3>
            <p className="text-sm text-gray-600 mb-3">Enhanced reading experience with premium features</p>
            <button className="bg-blue-600 text-white px-4 py-2 rounded font-medium hover:bg-blue-700">
              Download Now
            </button>
          </div>
        )

      case AdFormat.NATIVE:
        return (
          <div 
            className="bg-gray-50 border border-gray-200 rounded-lg p-4 cursor-pointer hover:bg-gray-100 transition-colors"
            onClick={handleClick}
          >
            <div className="flex items-start space-x-3">
              <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-blue-500 rounded-lg flex items-center justify-center text-white text-2xl">
                📚
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <h3 className="font-medium text-gray-900">Sponsored Story</h3>
                  <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">Ad</span>
                </div>
                <p className="text-sm text-gray-700 mb-2">
                  "The Chronicles of Aetheria" - A captivating tale that readers can&apos;t put down. 
                  Join thousands discovering this epic series.
                </p>
                <div className="flex items-center space-x-4 text-xs text-gray-500">
                  <span>⭐ 4.8/5 rating</span>
                  <span>👥 50K+ readers</span>
                  <span className="text-blue-600 hover:underline">Read Chapter 1</span>
                </div>
              </div>
            </div>
          </div>
        )

      case AdFormat.VIDEO:
        return (
          <div className="relative bg-black rounded-lg overflow-hidden">
            {/* Video placeholder */}
            <div className="aspect-video bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
              <div className="text-center text-white">
                <div className="text-4xl mb-4">🎮</div>
                <h3 className="text-xl font-bold mb-2">Epic Gaming Experience</h3>
                <p className="text-sm opacity-75">Immersive worlds await your discovery</p>
              </div>
            </div>

            {/* Video controls overlay */}
            <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
              <div className="flex items-center space-x-4">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setIsVideoPlaying(!isVideoPlaying)
                  }}
                  className="w-16 h-16 bg-white bg-opacity-20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-opacity-30 transition-all"
                >
                  {isVideoPlaying ? <Pause size={24} /> : <Play size={24} />}
                </button>
              </div>
            </div>

            {/* Bottom controls */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/50 to-transparent p-4">
              <div className="flex items-center justify-between text-white text-sm">
                <div className="flex items-center space-x-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setIsMuted(!isMuted)
                    }}
                    className="hover:text-gray-300"
                  >
                    {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                  </button>
                  <span>0:15 / 0:30</span>
                </div>
                
                {showSkip && (
                  <button
                    onClick={handleClose}
                    className="flex items-center space-x-1 bg-white bg-opacity-20 px-3 py-1 rounded hover:bg-opacity-30"
                  >
                    <SkipForward size={14} />
                    <span>Skip</span>
                  </button>
                )}
              </div>
              
              {/* Progress bar */}
              <div className="mt-2 h-1 bg-white bg-opacity-30 rounded">
                <div 
                  className="h-full bg-white rounded transition-all duration-1000"
                  style={{ width: isVideoPlaying ? '50%' : '0%' }}
                />
              </div>
            </div>

            {/* Click overlay for interaction */}
            <div 
              className="absolute inset-0 cursor-pointer"
              onClick={handleClick}
            />
          </div>
        )

      case AdFormat.TEXT_ONLY:
        return (
          <div 
            className="border-l-4 border-blue-500 bg-blue-50 p-4 cursor-pointer hover:bg-blue-100 transition-colors"
            onClick={handleClick}
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-medium text-blue-900 mb-1">
                  📖 Looking for your next great read?
                </h3>
                <p className="text-sm text-blue-800">
                  Discover personalized recommendations based on your reading history. 
                  Join our community of passionate readers today.
                </p>
                <span className="inline-block mt-2 text-xs text-blue-600 hover:underline">
                  Explore recommendations →
                </span>
              </div>
              <span className="text-xs text-blue-500 bg-blue-100 px-2 py-1 rounded ml-3">
                Sponsored
              </span>
            </div>
          </div>
        )

      default:
        return (
          <div 
            className="bg-gray-100 border-2 border-dashed border-gray-300 p-8 rounded-lg text-center cursor-pointer hover:border-gray-400 transition-colors"
            onClick={handleClick}
          >
            <div className="text-gray-500">
              <div className="text-2xl mb-2">📢</div>
              <p className="font-medium">Advertisement</p>
              <p className="text-sm mt-1">Ad content would appear here</p>
            </div>
          </div>
        )
    }
  }

  const getPositionClass = () => {
    switch (placement.placementType) {
      case AdPlacementType.SIDEBAR_LEFT:
        return "fixed left-4 top-1/2 transform -translate-y-1/2 w-64 z-40"
      case AdPlacementType.SIDEBAR_RIGHT:
        return "fixed right-4 top-1/2 transform -translate-y-1/2 w-64 z-40"
      case AdPlacementType.HEADER_BANNER:
        return "sticky top-0 z-50 shadow-md"
      case AdPlacementType.FOOTER_BANNER:
        return "sticky bottom-0 z-50 shadow-md"
      case AdPlacementType.FLOATING_OVERLAY:
        return "fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 z-50"
      default:
        return "relative my-4"
    }
  }

  const shouldShowCloseButton = () => {
    return placement.displaySettings?.closeable !== false && 
           [AdPlacementType.FLOATING_OVERLAY, AdPlacementType.SIDEBAR_LEFT, AdPlacementType.SIDEBAR_RIGHT].includes(placement.placementType)
  }

  return (
    <div className={`${getPositionClass()} ${placement.format === AdFormat.VIDEO ? 'max-w-md' : ''}`}>
      <div className="relative">
        {/* Close button for closeable ads */}
        {shouldShowCloseButton() && (
          <button
            onClick={handleClose}
            className="absolute -top-2 -right-2 w-6 h-6 bg-gray-600 hover:bg-gray-700 text-white rounded-full flex items-center justify-center text-xs z-10 shadow-lg"
            title="Close ad"
          >
            <X size={12} />
          </button>
        )}

        {/* Ad content */}
        <div className="overflow-hidden shadow-lg">
          {getAdContent()}
        </div>

        {/* Ad indicator */}
        <div className="absolute top-2 left-2 flex items-center space-x-1">
          <Eye size={12} className="text-gray-500" />
          <span className="text-xs text-gray-500 bg-white bg-opacity-80 px-1 rounded">
            Ad
          </span>
        </div>

        {/* Placement type indicator (for demo purposes) */}
        <div className="absolute bottom-2 right-2">
          <span className="text-xs bg-black bg-opacity-50 text-white px-2 py-1 rounded">
            {placement.placementType.replace('_', ' ').toLowerCase()}
          </span>
        </div>
      </div>
    </div>
  )
}

// Demo component to show different ad placements
export function AdPlacementDemo() {
  const [visibleAds, setVisibleAds] = React.useState<string[]>(['demo-1'])

  const demoAds: AdPlacement[] = [
    {
      id: 'demo-1',
      workId: 'demo-work',
      sectionId: 'demo-section',
      placementType: AdPlacementType.INLINE_CONTENT,
      format: AdFormat.NATIVE,
      position: { paragraph: 2 },
      revenueShare: 0.7,
      targeting: {} as any,
      displaySettings: {} as any,
      contentFilters: [],
      performanceMetrics: {} as any,
      isActive: true,
      requiresApproval: false,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'demo-2',
      workId: 'demo-work',
      sectionId: 'demo-section',
      placementType: AdPlacementType.SIDEBAR_RIGHT,
      format: AdFormat.SQUARE,
      position: { anchor: 'middle' },
      revenueShare: 0.8,
      targeting: {} as any,
      displaySettings: { closeable: true } as any,
      contentFilters: [],
      performanceMetrics: {} as any,
      isActive: true,
      requiresApproval: false,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ]

  const handleAdInteraction = (adId: string, type: 'view' | 'click' | 'close') => {
    
    if (type === 'close') {
      setVisibleAds(prev => prev.filter(id => id !== adId))
    }
  }

  return (
    <div className="space-y-8 p-6 max-w-4xl mx-auto">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Ad Placement Preview</h2>
        <p className="text-gray-600">
          This demonstrates how different ad formats and placements appear to readers
        </p>
      </div>

      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-3">Sample Content with Ads</h3>
          
          <div className="prose prose-gray max-w-none">
            <p>
              In the mystical realm of Aetheria, where magic flows like rivers through enchanted forests, 
              our hero embarks on an epic journey. The ancient prophecies speak of a chosen one who will 
              restore balance to the world.
            </p>
            
            {/* Inline ad placement */}
            {visibleAds.includes('demo-1') && (
              <AdPreview
                placement={demoAds[0]}
                isVisible={true}
                onClose={() => handleAdInteraction('demo-1', 'close')}
                onInteraction={(type) => handleAdInteraction('demo-1', type)}
              />
            )}
            
            <p>
              As dawn breaks over the Crystal Mountains, strange shadows begin to move through the valleys below. 
              The inhabitants of the peaceful villages have no idea that their world is about to change forever. 
              Ancient powers are stirring, and the delicate balance between light and darkness hangs by a thread.
            </p>
            
            <p>
              Our protagonist, armed with nothing but courage and an mysterious artifact passed down through 
              generations, must navigate treacherous alliances and face impossible choices. Each step forward 
              reveals new mysteries and deeper conspiracies that threaten the very fabric of reality.
            </p>
          </div>
        </div>

        {/* Sidebar ad */}
        {visibleAds.includes('demo-2') && (
          <AdPreview
            placement={demoAds[1]}
            isVisible={true}
            onClose={() => handleAdInteraction('demo-2', 'close')}
            onInteraction={(type) => handleAdInteraction('demo-2', type)}
          />
        )}

        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-2">Demo Controls</h4>
          <div className="flex space-x-3">
            <button
              onClick={() => setVisibleAds(['demo-1', 'demo-2'])}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Reset Ads
            </button>
            <button
              onClick={() => setVisibleAds([])}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Hide All Ads
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}