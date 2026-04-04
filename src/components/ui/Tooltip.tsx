'use client'

import { useState, useRef, ReactNode } from 'react'

interface TooltipProps {
  /** The tooltip text / content shown on hover */
  content: ReactNode
  children: ReactNode
  /** Which side the tooltip appears on relative to the trigger. Defaults to 'top'. */
  side?: 'top' | 'bottom'
  /** Extra class on the wrapper span */
  className?: string
}

/**
 * Lightweight hover tooltip.
 * Wraps children in a relative container, shows a styled popup on hover/focus.
 * Delay: 280ms — fast enough to feel responsive, slow enough not to flash on cursor travel.
 */
export function Tooltip({ content, children, side = 'top', className }: TooltipProps) {
  const [open, setOpen] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const show = () => {
    timer.current = setTimeout(() => setOpen(true), 280)
  }
  const hide = () => {
    if (timer.current) clearTimeout(timer.current)
    setOpen(false)
  }

  return (
    <span
      className={`relative inline-flex items-center ${className ?? ''}`}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}

      {open && (
        <span
          role="tooltip"
          className={`absolute z-50 w-max max-w-[260px] px-3 py-2 text-xs leading-relaxed text-white bg-gray-900 rounded-lg shadow-xl pointer-events-none left-1/2 -translate-x-1/2 ${
            side === 'top' ? 'bottom-full mb-2.5' : 'top-full mt-2.5'
          }`}
        >
          {content}
          {/* Arrow */}
          <span
            className={`absolute left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-gray-900 rotate-45 ${
              side === 'top' ? 'bottom-[-5px]' : 'top-[-5px]'
            }`}
          />
        </span>
      )}
    </span>
  )
}
