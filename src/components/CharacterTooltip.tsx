'use client'

import { useState, useEffect, useRef } from 'react'

interface CharacterTooltipProps {
  character: {
    id: string
    name: string
    role?: string
    imageUrl?: string
    quickGlance?: string
    [key: string]: any
  }
  onCharacterClick?: (character: any) => void
  children: React.ReactNode
}

export function CharacterTooltip({ 
  character,
  onCharacterClick,
  children 
}: CharacterTooltipProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isTouchDevice, setIsTouchDevice] = useState(false)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLSpanElement>(null)
  const pinchDistanceRef = useRef<number | null>(null)

  const TOOLTIP_W = 320 // matches w-80

  useEffect(() => {
    if (typeof window === 'undefined') return
    setIsTouchDevice(window.matchMedia('(pointer: coarse)').matches)
  }, [])

  const showTooltip = () => {
    if (!triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    const vw = window.innerWidth
    // Center above the trigger word, clamped to viewport
    const cx = Math.max(
      TOOLTIP_W / 2 + 8,
      Math.min(vw - TOOLTIP_W / 2 - 8, rect.left + rect.width / 2)
    )
    setPosition({ x: cx, y: rect.top })
    setIsVisible(true)
  }

  const hideTooltip = () => setIsVisible(false)

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    if (onCharacterClick) {
      onCharacterClick(character)
    }
  }

  const emitOpenGlossary = () => {
    if (typeof window === 'undefined') return
    window.dispatchEvent(
      new CustomEvent('reader-open-mobile-glossary', {
        detail: {
          type: 'character',
          characterId: character.id,
          characterName: character.name,
        },
      })
    )
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const [a, b] = [e.touches[0], e.touches[1]]
      pinchDistanceRef.current = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY)
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length !== 2 || pinchDistanceRef.current == null) return

    const [a, b] = [e.touches[0], e.touches[1]]
    const nextDistance = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY)
    if (Math.abs(nextDistance - pinchDistanceRef.current) > 18) {
      pinchDistanceRef.current = null
      emitOpenGlossary()
    }
  }

  const handleTouchEnd = () => {
    pinchDistanceRef.current = null
  }

  // Auto-fill quickGlance if empty: "First seen in Chapter X"
  const displayText = character.quickGlance || 
    (character.firstAppearance ? `First seen in Chapter ${character.firstAppearance}` : 'Character profile')

  return (
    <span className="relative">
      <span
        ref={triggerRef}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onClick={handleClick}
        onDoubleClick={emitOpenGlossary}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="cursor-pointer border-b-2 border-dotted border-green-500 text-green-600 dark:text-green-400 hover:border-solid hover:text-green-700 dark:hover:text-green-300 transition-all font-medium"
      >
        {children}
      </span>
      
      {isVisible && !isTouchDevice && (
        <div
          ref={tooltipRef}
          className="fixed z-50 w-80 p-4 bg-gray-900 text-white rounded-lg shadow-xl pointer-events-none"
          style={{
            left: position.x,
            top: position.y,
            transform: 'translate(-50%, calc(-100% - 12px))'
          }}
        >
          <div className="flex items-start gap-3">
            {character.imageUrl && (
              <div className="flex-shrink-0">
                <img
                  src={character.imageUrl}
                  alt={character.name}
                  className="w-16 h-16 rounded-lg object-cover"
                />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="font-bold text-lg mb-1">{character.name}</div>
              {character.role && (
                <div className="text-xs text-green-400 mb-2 uppercase tracking-wide">
                  {character.role}
                </div>
              )}
              <div className="text-sm text-gray-300">
                {displayText}
              </div>
              <div className="text-xs text-green-400 mt-2">
                Click for full profile →
              </div>
            </div>
          </div>
        </div>
      )}
    </span>
  )
}
