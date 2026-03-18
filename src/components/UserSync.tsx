'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useRef } from 'react'

// Syncs user to database after OAuth login (edge-compatible)
// Only runs once per session
export function UserSync() {
  const { data: session, status } = useSession()
  const synced = useRef(false)

  useEffect(() => {
    if (status === 'authenticated' && session?.user && !synced.current) {
      synced.current = true
      
      fetch('/api/auth/sync-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: session.user.id,
          email: session.user.email,
          name: session.user.name,
          image: session.user.image,
        }),
      }).catch(err => {
        console.error('User sync failed:', err)
        // Non-critical - user can still use the app
      })
    }
  }, [status, session])

  return null // Renders nothing
}
