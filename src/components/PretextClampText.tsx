'use client'

import { CSSProperties, useEffect, useMemo, useRef, useState } from 'react'
import { useMeasureTextHeight } from '@/hooks/usePretext'

interface PretextClampTextProps {
  text: string
  className?: string
  lineClamp: number
  font?: string
  lineHeight?: number
  as?: 'p' | 'span' | 'div' | 'h3' | 'h4'
}

export default function PretextClampText({
  text,
  className = '',
  lineClamp,
  font = '14px Inter',
  lineHeight = 20,
  as = 'p'
}: PretextClampTextProps) {
  const containerRef = useRef<HTMLElement | null>(null)
  const [width, setWidth] = useState(320)

  useEffect(() => {
    const node = containerRef.current
    if (!node) return

    const update = () => {
      setWidth(node.clientWidth || 320)
    }

    update()
    const observer = new ResizeObserver(update)
    observer.observe(node)

    return () => observer.disconnect()
  }, [])

  const measurement = useMeasureTextHeight(
    text,
    font,
    Math.max(140, width),
    lineHeight,
    { whiteSpace: 'pre-wrap' }
  )

  const style = useMemo(() => {
    const visibleLines = Math.max(1, Math.min(lineClamp, measurement.lineCount || 1))
    return {
      display: '-webkit-box',
      WebkitLineClamp: lineClamp,
      WebkitBoxOrient: 'vertical',
      overflow: 'hidden',
      minHeight: `${visibleLines * lineHeight}px`
    } as CSSProperties
  }, [lineClamp, lineHeight, measurement.lineCount])

  const Tag = as

  return (
    <Tag ref={containerRef as any} className={className} style={style}>
      {text}
    </Tag>
  )
}
