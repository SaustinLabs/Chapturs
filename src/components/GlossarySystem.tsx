'use client'

import { useState, useRef, useEffect } from 'react'
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
import { GlossaryTerm } from '@/types'

interface GlossaryTooltipProps {
  term: string
  definition: string
  children: React.ReactNode
}

export function GlossaryTooltip({ term, definition, children }: GlossaryTooltipProps) {
  const [open, setOpen] = useState(false)
  const [isTouchDevice, setIsTouchDevice] = useState(false)
  const arrowRef = useRef(null)
  const pinchDistanceRef = useRef<number | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsTouchDevice(window.matchMedia('(pointer: coarse)').matches)
    }
  }, [])

  const { refs, floatingStyles, context, placement } = useFloating({
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

  const openMobileGlossary = () => {
    if (typeof window === 'undefined') return
    setOpen(false)
    window.dispatchEvent(
      new CustomEvent('reader-open-mobile-glossary', {
        detail: { type: 'term', term },
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
      openMobileGlossary()
    }
  }

  const handleTouchEnd = () => { pinchDistanceRef.current = null }

  return (
    <>
      <span
        ref={refs.setReference}
        {...getReferenceProps({
          onTouchStart: handleTouchStart,
          onTouchMove: handleTouchMove,
          onTouchEnd: handleTouchEnd,
          onDoubleClick: openMobileGlossary,
        })}
        className="cursor-help border-b border-dotted border-amber-500/30 hover:bg-amber-500/[0.06] hover:border-amber-500/50 transition-all"
      >
        {children}
      </span>

      {open && (
        <FloatingPortal>
          <div
            ref={refs.setFloating}
            style={floatingStyles}
            {...getFloatingProps()}
            className={`z-[9999] w-72 p-3 rounded-xl text-sm leading-relaxed bg-gray-900/95 backdrop-blur-md border border-gray-700/60 shadow-2xl shadow-black/50 ${isTouchDevice ? 'pointer-events-auto' : 'pointer-events-none'}`}
          >
            <span className="font-semibold text-gray-100 block mb-1">{term}</span>
            <span className="text-gray-300">{definition}</span>
            {isTouchDevice && (
              <button
                onClick={(e) => { e.stopPropagation(); openMobileGlossary() }}
                className="mt-3 text-xs text-amber-400/80 hover:text-amber-300 flex items-center gap-1"
              >
                See all terms →
              </button>
            )}
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

    // Build list of all matchable strings (terms + aliases), deduplicated
    const matchableStrings: string[] = []
    for (const t of sortedTerms) {
      matchableStrings.push(t.term)
      if (t.aliases) {
        const aliases = typeof t.aliases === 'string' ? JSON.parse(t.aliases) : t.aliases
        if (Array.isArray(aliases)) {
          for (const alias of aliases) {
            if (!matchableStrings.includes(alias)) matchableStrings.push(alias)
          }
        }
      }
    }
    // Sort matchable strings by length descending
    matchableStrings.sort((a, b) => b.length - a.length)

    // Process content and wrap glossary terms
    let processed = content
    const termReplacements: { term: string; definition: string; placeholder: string }[] = []

    sortedTerms.forEach((glossaryTerm, index) => {
      // Match any alias of this term in the text, but link back to the canonical term
      const matchTargets = [glossaryTerm.term]
      if (glossaryTerm.aliases) {
        const aliases = typeof glossaryTerm.aliases === 'string' ? JSON.parse(glossaryTerm.aliases) : glossaryTerm.aliases
        if (Array.isArray(aliases)) matchTargets.push(...aliases)
      }
      
      for (const target of matchTargets) {
        const placeholder = `__GLOSSARY_${index}__`
        const regex = new RegExp(`\\b${target.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi')
        
        if (regex.test(processed)) {
          termReplacements.push({
            term: target,
            definition: glossaryTerm.definition,
            placeholder
          })
          processed = processed.replace(regex, placeholder)
        }
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
