'use client'

import { useEffect } from 'react'

const RELOAD_GUARD_KEY = 'chapturs:chunk-recovery:reloaded'

function isChunkLoadFailure(message: string): boolean {
  const normalized = message.toLowerCase()
  return (
    normalized.includes('chunkloaderror') ||
    (normalized.includes('loading chunk') && normalized.includes('failed')) ||
    normalized.includes('/_next/static/chunks/')
  )
}

function recoverIfNeeded(message: string) {
  if (!isChunkLoadFailure(message)) {
    return
  }

  // Prevent infinite refresh loops if something else is broken.
  if (sessionStorage.getItem(RELOAD_GUARD_KEY) === '1') {
    return
  }

  sessionStorage.setItem(RELOAD_GUARD_KEY, '1')
  window.location.reload()
}

export default function ChunkRecovery() {
  useEffect(() => {
    const onError = (event: ErrorEvent) => {
      recoverIfNeeded(event.message || '')
    }

    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason
      const message =
        typeof reason === 'string'
          ? reason
          : (reason?.message as string | undefined) || String(reason)

      recoverIfNeeded(message)
    }

    window.addEventListener('error', onError)
    window.addEventListener('unhandledrejection', onUnhandledRejection)

    return () => {
      window.removeEventListener('error', onError)
      window.removeEventListener('unhandledrejection', onUnhandledRejection)
    }
  }, [])

  return null
}
