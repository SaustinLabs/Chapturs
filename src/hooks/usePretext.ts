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
    if (!text || maxWidth <= 0 || lineHeight <= 0) {
      return { height: 0, lineCount: 0 }
    }

    try {
      const cacheKey = `${text}|${font}|${options.whiteSpace || 'normal'}`
      let cache = preparedTextCache.get(cacheKey)

      if (!cache) {
        cache = {
          text,
          font,
          prepared: prepare(text, font, options),
          options
        }
        preparedTextCache.set(cacheKey, cache)
      }

      const result = layout(cache.prepared!, maxWidth, lineHeight)
      return result
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
    if (!text || maxWidth <= 0 || lineHeight <= 0) {
      return { height: 0, lineCount: 0, lines: [] }
    }

    try {
      const cacheKey = `lines|${text}|${font}|${options.whiteSpace || 'normal'}`
      let cache = preparedTextCache.get(cacheKey)

      if (!cache) {
        cache = {
          text,
          font,
          preparedWithSegments: prepareWithSegments(text, font, options),
          options
        }
        preparedTextCache.set(cacheKey, cache)
      }

      const result = layoutWithLines(cache.preparedWithSegments!, maxWidth, lineHeight)
      return result
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
      const cacheKey = `nextline|${text}|${font}|${options.whiteSpace || 'normal'}`
      let cache = preparedTextCache.get(cacheKey)

      if (!cache) {
        cache = {
          text,
          font,
          preparedWithSegments: prepareWithSegments(text, font, options),
          options
        }
        preparedTextCache.set(cacheKey, cache)
      }

      return cache.preparedWithSegments
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
