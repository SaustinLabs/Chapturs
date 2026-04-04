'use client'

import { useState, useRef, useEffect, ReactNode } from 'react'
import { HelpCircle, X } from 'lucide-react'

interface FeatureHintProps {
  /** Heading shown at the top of the hint panel */
  title: string
  /** Body content — can be JSX */
  children: ReactNode
  /** Extra class on the trigger button icon */
  iconClassName?: string
}

/**
 * A small ? icon that expands an inline hint panel explaining a feature in depth.
 * Closes on outside click or pressing the × button.
 * Designed to sit next to section headings, tab labels, or setting labels.
 */
export function FeatureHint({ title, children, iconClassName }: FeatureHintProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <span className="relative inline-flex" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className={`p-0.5 rounded-full text-gray-400 hover:text-blue-400 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1 ${iconClassName ?? ''}`}
        aria-label={`Learn about ${title}`}
        aria-expanded={open}
      >
        <HelpCircle className="w-4 h-4" />
      </button>

      {open && (
        <div className="absolute left-0 top-6 z-50 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl shadow-2xl p-4 text-sm">
          <div className="flex items-start justify-between mb-2 gap-2">
            <span className="font-semibold text-gray-900 dark:text-gray-100 leading-snug">{title}</span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="shrink-0 p-0.5 rounded text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
              aria-label="Close"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="text-gray-600 dark:text-gray-300 leading-relaxed space-y-2">
            {children}
          </div>
        </div>
      )}
    </span>
  )
}
