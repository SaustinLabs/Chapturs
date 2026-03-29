'use client'

import React, { useMemo } from 'react'
import { useMeasureTextLines } from '@/hooks/usePretext'

interface MobileTextBoxProps {
  content: string | Array<{ text: string; style?: 'normal' | 'bold' | 'italic' }>
  platform?: 'ios' | 'android' | 'generic'
  fontSize?: number
  fontFamily?: string
  lineHeight?: number
  maxWidth?: number
  className?: string
  showTimestamps?: boolean
  timestamp?: string
}

/**
 * Mobile-optimized text box component using Pretext for responsive layout
 * Automatically adapts text wrapping to viewport width without DOM reflow
 */
export default function MobileTextBox({
  content,
  platform = 'generic',
  fontSize = 16,
  fontFamily = 'Inter',
  lineHeight = 24,
  maxWidth = 280,
  className = '',
  showTimestamps = false,
  timestamp
}: MobileTextBoxProps) {
  // Normalize content to string
  const textContent = useMemo(() => {
    if (typeof content === 'string') return content
    return content.map(item => item.text).join(' ')
  }, [content])

  // Measure text layout using Pretext
  const fontSpec = `${fontSize}px ${fontFamily}`
  const measurement = useMeasureTextLines(
    textContent,
    fontSpec,
    maxWidth,
    lineHeight,
    { whiteSpace: 'normal' }
  )

  const platformStyles = useMemo(() => {
    switch (platform) {
      case 'ios':
        return {
          bubble: 'rounded-3xl',
          bg: 'bg-blue-500',
          text: 'text-white',
          maxWidthClass: 'max-w-xs'
        }
      case 'android':
        return {
          bubble: 'rounded-lg',
          bg: 'bg-gray-300',
          text: 'text-gray-900',
          maxWidthClass: 'max-w-sm'
        }
      default:
        return {
          bubble: 'rounded-xl',
          bg: 'bg-gray-100',
          text: 'text-gray-900',
          maxWidthClass: 'max-w-md'
        }
    }
  }, [platform])

  // Render inline formatted content
  const renderContent = () => {
    if (typeof content === 'string') {
      return <p className={`${platformStyles.text} break-words`}>{content}</p>
    }

    return (
      <p className={`${platformStyles.text} break-words`}>
        {content.map((item, idx) => {
          let styleClass = ''
          if (item.style === 'bold') styleClass = 'font-bold'
          if (item.style === 'italic') styleClass = 'italic'

          return (
            <span key={idx} className={styleClass}>
              {item.text}
            </span>
          )
        })}
      </p>
    )
  }

  return (
    <div
      className={`${className} ${platformStyles.maxWidthClass}`}
      style={{
        perspective: '1000px'
      }}
    >
      <div
        className={`${platformStyles.bubble} ${platformStyles.bg} px-4 py-2 shadow-sm`}
        style={{
          width:
            measurement.lines.length > 0
              ? Math.min(maxWidth, Math.max(...measurement.lines.map(line => line.width)) + 16)
              : 'auto',
          minHeight: `${Math.max(lineHeight, measurement.height)}px`
        }}
      >
        {renderContent()}
        {showTimestamps && timestamp && (
          <div className={`text-xs opacity-70 mt-1 ${platformStyles.text}`}>
            {timestamp}
          </div>
        )}
      </div>
    </div>
  )
}
