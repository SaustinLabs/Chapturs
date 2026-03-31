'use client'

import { useMemo, useCallback } from 'react'
import { prepare, layout, prepareWithSegments, layoutWithLines, layoutNextLine, PreparedText, PreparedTextWithSegments, LayoutLine, LayoutCursor } from '@chenglou/pretext'

/**
 * Pretext measurement utilities hook
 * Provides text measurement capabilities without DOM reflow
 */

interface TextMeasurementOptions {
  whiteSpace?: 'normal' | 'pre-wrap'
}

interface PreParedTextCache {
  text: string
  font: string
  prepared?: PreparedText
  preparedWithSegments?: PreparedTextWithSegments
  options: TextMeasurementOptions
}

// Global cache for prepared text to avoid recalculation across component rerenders
const preparedTextCache = new Map<string, PreParedTextCache>()
const PRETEXT_MAX_CACHE_ENTRIES = 500

function enforceCacheLimit() {
  if (preparedTextCache.size <= PRETEXT_MAX_CACHE_ENTRIES) return

  const overBy = preparedTextCache.size - PRETEXT_MAX_CACHE_ENTRIES
  const keysToDelete = Array.from(preparedTextCache.keys()).slice(0, overBy)

  for (const key of keysToDelete) {
    preparedTextCache.delete(key)
  }
}

function getOrCreatePrepared(text: string, font: string, options: TextMeasurementOptions): PreparedText {
  const cacheKey = `${text}|${font}|${options.whiteSpace || 'normal'}`
  const cache = preparedTextCache.get(cacheKey)

  if (cache?.prepared) {
    return cache.prepared
  }

  const prepared = prepare(text, font, options)
  preparedTextCache.set(cacheKey, {
    text,
    font,
    prepared,
    options
  })
  enforceCacheLimit()

  return prepared
}

function getOrCreatePreparedWithSegments(text: string, font: string, options: TextMeasurementOptions): PreparedTextWithSegments {
  const cacheKey = `lines|${text}|${font}|${options.whiteSpace || 'normal'}`
  const cache = preparedTextCache.get(cacheKey)

  if (cache?.preparedWithSegments) {
    return cache.preparedWithSegments
  }

  const preparedWithSegments = prepareWithSegments(text, font, options)
  preparedTextCache.set(cacheKey, {
    text,
    font,
    preparedWithSegments,
    options
  })
  enforceCacheLimit()

  return preparedWithSegments
}

export function measureTextHeight(
  text: string,
  font: string,
  maxWidth: number,
  lineHeight: number,
  options: TextMeasurementOptions = { whiteSpace: 'normal' }
) {
  if (!text || maxWidth <= 0 || lineHeight <= 0) {
    return { height: 0, lineCount: 0 }
  }

  const prepared = getOrCreatePrepared(text, font, options)
  return layout(prepared, maxWidth, lineHeight)
}

export function measureTextLines(
  text: string,
  font: string,
  maxWidth: number,
  lineHeight: number,
  options: TextMeasurementOptions = { whiteSpace: 'normal' }
) {
  if (!text || maxWidth <= 0 || lineHeight <= 0) {
    return { height: 0, lineCount: 0, lines: [] }
  }

  const preparedWithSegments = getOrCreatePreparedWithSegments(text, font, options)
  return layoutWithLines(preparedWithSegments, maxWidth, lineHeight)
}

export function measureTextRows(
  text: string,
  font: string,
  maxWidth: number,
  lineHeight: number,
  options: TextMeasurementOptions = { whiteSpace: 'pre-wrap' },
  minRows = 2,
  maxRows = 14
) {
  const { lineCount } = measureTextHeight(text, font, maxWidth, lineHeight, options)
  const safeRows = Math.max(minRows, Math.min(lineCount || minRows, maxRows))
  return safeRows
}

/**
 * Hook for measuring text height without DOM reflow
 * @param text The text to measure
 * @param font Font specification (e.g., "16px Inter", "14px Arial")
 * @param maxWidth Maximum width for the text container
 * @param lineHeight Line height in pixels (e.g., 24, 26, 28)
 * @param options Optional configuration (whiteSpace handling)
 * @returns Object with height and lineCount
 */
export function useMeasureTextHeight(
  text: string,
  font: string,
  maxWidth: number,
  lineHeight: number,
  options: TextMeasurementOptions = { whiteSpace: 'normal' }
) {
  return useMemo(() => {
    try {
      return measureTextHeight(text, font, maxWidth, lineHeight, options)
    } catch (error) {
      console.error('Pretext measurement error:', error)
      return { height: 0, lineCount: 0 }
    }
  }, [text, font, maxWidth, lineHeight, options.whiteSpace])
}

/**
 * Hook for laying out text with individual line information
 * @param text The text to layout
 * @param font Font specification
 * @param maxWidth Maximum width for text container
 * @param lineHeight Line height in pixels
 * @param options Optional configuration
 * @returns Object with height, lineCount, and lines array
 */
export function useMeasureTextLines(
  text: string,
  font: string,
  maxWidth: number,
  lineHeight: number,
  options: TextMeasurementOptions = { whiteSpace: 'normal' }
) {
  return useMemo(() => {
    try {
      return measureTextLines(text, font, maxWidth, lineHeight, options)
    } catch (error) {
      console.error('Pretext line layout error:', error)
      return { height: 0, lineCount: 0, lines: [] }
    }
  }, [text, font, maxWidth, lineHeight, options.whiteSpace])
}

/**
 * Hook for iterative line layout (e.g., text flowing around floated images)
 * @param text The text to layout
 * @param font Font specification
 * @param options Optional configuration
 * @returns Function that lays out the next line given a cursor and width
 */
export function useLayoutNextLine(
  text: string,
  font: string,
  options: TextMeasurementOptions = { whiteSpace: 'normal' }
) {
  const prepared = useMemo(() => {
    if (!text) return null

    try {
      return getOrCreatePreparedWithSegments(text, font, options)
    } catch (error) {
      console.error('Pretext nextline prepare error:', error)
      return null
    }
  }, [text, font, options.whiteSpace])

  return useCallback(
    (cursor: LayoutCursor, width: number): LayoutLine | null => {
      if (!prepared) return null
      try {
        return layoutNextLine(prepared, cursor, width)
      } catch (error) {
        console.error('Pretext nextline error:', error)
        return null
      }
    },
    [prepared]
  )
}

/**
 * Clear the prepared text cache (useful when fonts change or app cycles through many variants)
 */
export function useClearPretextCache() {
  return useCallback(() => {
    preparedTextCache.clear()
  }, [])
}

/**
 * Get cache stats (useful for debugging)
 */
export function useGetPretextCacheStats() {
  return useCallback(() => {
    return {
      size: preparedTextCache.size,
      entries: Array.from(preparedTextCache.keys())
    }
  }, [])
}

export default usePretext

function usePretext() {
  return {
    measureHeight: useMeasureTextHeight,
    measureLines: useMeasureTextLines,
    layoutNextLine: useLayoutNextLine,
    clearCache: useClearPretextCache,
    getCacheStats: useGetPretextCacheStats
  }
}
