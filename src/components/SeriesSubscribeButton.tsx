'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'

interface Props {
  seriesId: string
  workCount: number
}

export default function SeriesSubscribeButton({ seriesId, workCount }: Props) {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(false)
  const [subscribed, setSubscribed] = useState(false)

  if (!session?.user) {
    return (
      <a
        href="/login"
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm transition"
      >
        Sign in to follow this series
      </a>
    )
  }

  if (subscribed) {
    return (
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-900/30 border border-green-700/40 text-green-400 text-sm">
        ✓ Following this series
      </div>
    )
  }

  async function handleSubscribe() {
    setLoading(true)
    try {
      const res = await fetch(`/api/series/${seriesId}/subscribe`, { method: 'POST' })
      if (res.ok) {
        const data = await res.json()
        setSubscribed(true)
        toast.success(data.message ?? `Subscribed to ${data.subscribed} work(s)`)
      } else {
        const data = await res.json()
        toast.error(data.error ?? 'Failed to subscribe')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleSubscribe}
      disabled={loading || workCount === 0}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm transition"
    >
      {loading ? 'Subscribing…' : `Follow Series${workCount > 0 ? ` (${workCount} works)` : ''}`}
    </button>
  )
}
