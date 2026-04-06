'use client'

import { useState, useRef, useEffect } from 'react'
import { GlossaryTerm } from '@/types'

interface GlossaryTooltipProps {
  term: string
  definition: string
  children: React.ReactNode
}

export function GlossaryTooltip({ term, definition, children }: GlossaryTooltipProps) {
  const [visible, setVisible] = useState(false)
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const [pinchDistance, setPinchDistance] = useState<number | null>(null)
  const [isTouchDevice, setIsTouchDevice] = useState(false)
  const triggerRef = useRef<HTMLSpanElement>(null)
  const tooltipRef = useRef<HTMLSpanElement>(null)

  const TOOLTIP_W = 288 // matches w-72

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsTouchDevice(window.matchMedia('(pointer: coarse)').matches)
    }
  }, [])

  // Dismiss on tap-outside when tooltip is open on mobile
  useEffect(() => {
    if (!visible || !isTouchDevice) return
    const dismiss = (e: MouseEvent | TouchEvent) => {
      if (
        triggerRef.current?.contains(e.target as Node) ||
        tooltipRef.current?.contains(e.target as Node)
      ) return
      setVisible(false)
    }
    document.addEventListener('click', dismiss, { capture: true })
    document.addEventListener('touchend', dismiss, { capture: true })
    return () => {
      document.removeEventListener('click', dismiss, { capture: true })
      document.removeEventListener('touchend', dismiss, { capture: true })
    }
  }, [visible, isTouchDevice])

  const show = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      const vw = typeof window !== 'undefined' ? window.innerWidth : 1440
      // Center tooltip over the term, clamped so it never bleeds off either edge
      const cx = Math.max(
        TOOLTIP_W / 2 + 8,
        Math.min(vw - TOOLTIP_W / 2 - 8, rect.left + rect.width / 2)
      )
      setPos({ x: cx, y: rect.top })
    }
    setVisible(true)
  }
  const hide = () => setVisible(false)

  const openMobileGlossary = () => {
    if (typeof window === 'undefined') return
    setVisible(false)
    window.dispatchEvent(
      new CustomEvent('reader-open-mobile-glossary', {
        detail: { type: 'term', term },
      })
    )
  }

  const handleClick = (e: React.MouseEvent) => {
    if (isTouchDevice) {
      e.preventDefault()
      if (visible) {
        hide()
      } else {
        show()
      }
    } else {
      openMobileGlossary()
    }
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const [a, b] = [e.touches[0], e.touches[1]]
      setPinchDistance(Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY))
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length !== 2 || pinchDistance == null) return
    const [a, b] = [e.touches[0], e.touches[1]]
    const nextDistance = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY)
    if (Math.abs(nextDistance - pinchDistance) > 18) {
      setPinchDistance(null)
      openMobileGlossary()
    }
  }

  const handleTouchEnd = () => setPinchDistance(null)

  return (
    <span className="relative inline">
      <span
        ref={triggerRef}
        onMouseEnter={isTouchDevice ? undefined : show}
        onMouseLeave={isTouchDevice ? undefined : hide}
        onClick={handleClick}
        onDoubleClick={openMobileGlossary}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="cursor-help border-b border-dotted border-blue-500/60 text-blue-400 hover:text-blue-300 hover:border-blue-400/80 transition-colors"
      >
        {children}
      </span>

      {visible && (
        <span
          ref={tooltipRef}
          className={`fixed z-50 ${isTouchDevice ? 'pointer-events-auto' : 'pointer-events-none'}`}
          style={{ left: pos.x, top: pos.y, transform: 'translate(-50%, calc(-100% - 12px))' }}
          onClick={(e) => { if (isTouchDevice) e.stopPropagation() }}
        >
          <span className="block w-72 p-3 rounded-xl text-sm leading-relaxed bg-gray-900/95 backdrop-blur-md border border-gray-700/60 shadow-2xl shadow-black/50">
            <span className="font-semibold text-gray-100 block mb-1">{term}</span>
            <span className="text-gray-300">{definition}</span>
            {isTouchDevice && (
              <button
                onClick={(e) => { e.stopPropagation(); openMobileGlossary() }}
                className="mt-3 text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
              >
                See all terms →
              </button>
            )}
            {/* Downward caret pointing at the term */}
            <span className="absolute left-1/2 -translate-x-1/2 top-full -mt-px border-[6px] border-transparent border-t-gray-800" />
          </span>
        </span>
      )}
    </span>
  )
}

interface ChapterContentProps {
  content: string
  glossaryTerms: GlossaryTerm[] | undefined
  currentChapter: number
}

export default function ChapterContent({ content, glossaryTerms, currentChapter }: ChapterContentProps) {
  const [processedContent, setProcessedContent] = useState<React.ReactNode[]>([])

  useEffect(() => {
    // Use all available glossary terms (chapter filtering removed for now)
    const availableTerms = glossaryTerms || []

    // Sort by term length (descending) to handle overlapping terms correctly
    const sortedTerms = availableTerms.sort((a, b) => b.term.length - a.term.length)

    // Process content and wrap glossary terms
    let processed = content
    const termReplacements: { term: string; definition: string; placeholder: string }[] = []

    sortedTerms.forEach((glossaryTerm, index) => {
      const placeholder = `__GLOSSARY_${index}__`
      const regex = new RegExp(`\\b${glossaryTerm.term}\\b`, 'gi')
      
      if (regex.test(processed)) {
        termReplacements.push({
          term: glossaryTerm.term,
          definition: glossaryTerm.definition,
          placeholder
        })
        processed = processed.replace(regex, placeholder)
      }
    })

    // Split content and create React nodes
    const parts = processed.split(/(__GLOSSARY_\d+__)/)
    const contentNodes = parts.map((part, index) => {
      const replacement = termReplacements.find(r => r.placeholder === part)
      
      if (replacement) {
        return (
          <GlossaryTooltip
            key={index}
            term={replacement.term}
            definition={replacement.definition}
          >
            {replacement.term}
          </GlossaryTooltip>
        )
      }
      
      return part
    })

    setProcessedContent(contentNodes)
  }, [content, glossaryTerms, currentChapter])

  return (
    <div className="prose prose-lg dark:prose-invert max-w-none">
      <div className="whitespace-pre-wrap leading-relaxed">
        {processedContent}
      </div>
    </div>
  )
}
