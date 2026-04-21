'use client'

import { useEffect } from 'react'

/**
 * Fires a single fire-and-forget POST to increment the site-wide page view
 * counter on every navigation. Renders nothing — no visible output.
 */
export default function PageViewTracker() {
  useEffect(() => {
    fetch('/api/analytics/pageview', { method: 'POST' }).catch(() => {})
  }, [])

  return null
}
