'use client'

import { useState, useEffect, useRef } from 'react'
import {
  useFloating,
  autoUpdate,
  offset,
  flip,
  shift,
  arrow,
  FloatingPortal,
  useInteractions,
  useHover,
  useClick,
  useDismiss,
  useRole,
  FloatingArrow,
} from '@floating-ui/react'

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
  const [open, setOpen] = useState(false)
  const [isTouchDevice, setIsTouchDevice] = useState(false)
  const arrowRef = useRef(null)
  const pinchDistanceRef = useRef<number | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    setIsTouchDevice(window.matchMedia('(pointer: coarse)').matches)
  }, [])

  const { refs, floatingStyles, context } = useFloating({
    open,
    onOpenChange: setOpen,
    placement: 'top',
    middleware: [
      offset(10),
      flip({ fallbackPlacements: ['bottom', 'top'] }),
      shift({ padding: 8 }),
      arrow({ element: arrowRef }),
    ],
    whileElementsMounted: autoUpdate,
  })

  const hover = useHover(context, { enabled: !isTouchDevice, delay: { open: 120, close: 80 } })
  const click = useClick(context, { enabled: isTouchDevice })
  const dismiss = useDismiss(context)
  const role = useRole(context, { role: 'tooltip' })

  const { getReferenceProps, getFloatingProps } = useInteractions([hover, click, dismiss, role])

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

  const handleTouchEnd = () => { pinchDistanceRef.current = null }

  // On desktop, clicking the text opens full profile modal directly
  const handleDesktopClick = (e: React.MouseEvent) => {
    if (!isTouchDevice && onCharacterClick) {
      e.preventDefault()
      onCharacterClick(character)
    }
  }

  const displayText = character.quickGlance || 
    (character.firstAppearance ? `First seen in Chapter ${character.firstAppearance}` : 'Character profile')

  return (
    <>
      <span
        ref={refs.setReference}
        {...getReferenceProps({
          onTouchStart: handleTouchStart,
          onTouchMove: handleTouchMove,
          onTouchEnd: handleTouchEnd,
          onDoubleClick: emitOpenGlossary,
          onClick: handleDesktopClick,
        })}
        className="cursor-pointer border-b-2 border-dotted border-green-500 text-green-600 dark:text-green-400 hover:border-solid hover:text-green-700 dark:hover:text-green-300 transition-all font-medium"
      >
        {children}
      </span>

      {open && (
        <FloatingPortal>
          <div
            ref={refs.setFloating}
            style={floatingStyles}
            {...getFloatingProps()}
            className={`z-[9999] w-80 p-4 bg-gray-900 text-white rounded-lg shadow-xl ${isTouchDevice ? 'pointer-events-auto' : 'pointer-events-none'}`}
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
                  {isTouchDevice ? (
                    <button
                      onClick={(e) => { e.stopPropagation(); setOpen(false); onCharacterClick?.(character) }}
                      className="text-green-400 hover:text-green-300"
                    >
                      Tap for full profile →
                    </button>
                  ) : (
                    'Click for full profile →'
                  )}
                </div>
              </div>
            </div>
            <FloatingArrow
              ref={arrowRef}
              context={context}
              className="fill-gray-900"
            />
          </div>
        </FloatingPortal>
      )}
    </>
  )
}
