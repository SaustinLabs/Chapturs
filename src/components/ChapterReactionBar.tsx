'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Tooltip } from '@/components/ui/Tooltip'

const EMOJIS = ['❤️', '🔥', '😂', '😭', '🤯'] as const

interface ChapterReactionBarProps {
  workId: string
  sectionId: string
}

export default function ChapterReactionBar({ workId, sectionId }: ChapterReactionBarProps) {
  const { data: session } = useSession()
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [userReactions, setUserReactions] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState<string | null>(null)

  useEffect(() => {
    if (!sectionId) return
    fetch(`/api/works/${workId}/sections/${sectionId}/react`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data) return
        setCounts(data.counts ?? {})
        setUserReactions(new Set(data.userReactions ?? []))
      })
      .catch(() => {})
  }, [workId, sectionId])

  async function toggle(emoji: string) {
    if (!session?.user) return
    if (loading) return
    setLoading(emoji)

    // Optimistic update
    const wasReacted = userReactions.has(emoji)
    setCounts(prev => ({
      ...prev,
      [emoji]: Math.max(0, (prev[emoji] ?? 0) + (wasReacted ? -1 : 1)),
    }))
    setUserReactions(prev => {
      const next = new Set(prev)
      wasReacted ? next.delete(emoji) : next.add(emoji)
      return next
    })

    try {
      const res = await fetch(`/api/works/${workId}/sections/${sectionId}/react`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emoji }),
      })
      if (res.ok) {
        const data = await res.json()
        setCounts(data.counts ?? {})
        setUserReactions(new Set(data.userReactions ?? []))
      } else {
        // Revert optimistic update on error
        setCounts(prev => ({
          ...prev,
          [emoji]: Math.max(0, (prev[emoji] ?? 0) + (wasReacted ? 1 : -1)),
        }))
        setUserReactions(prev => {
          const next = new Set(prev)
          wasReacted ? next.add(emoji) : next.delete(emoji)
          return next
        })
      }
    } catch {
      // Revert optimistic update
      setCounts(prev => ({
        ...prev,
        [emoji]: Math.max(0, (prev[emoji] ?? 0) + (wasReacted ? 1 : -1)),
      }))
      setUserReactions(prev => {
        const next = new Set(prev)
        wasReacted ? next.add(emoji) : next.delete(emoji)
        return next
      })
    } finally {
      setLoading(null)
    }
  }

  const total = Object.values(counts).reduce((a, b) => a + b, 0)

  return (
    <div className="flex flex-col items-center gap-2 py-4">
      {/* Reaction label */}
      <Tooltip
        content="Your reactions help us find more stories you'll enjoy — and surface this one to other readers like you."
        side="top"
      >
        <p className="text-xs text-gray-400 dark:text-gray-500 tracking-wide uppercase cursor-default">
          React to this chapter
        </p>
      </Tooltip>

      {/* Emoji buttons */}
      <div className="flex items-center gap-2 flex-wrap justify-center">
        {EMOJIS.map(emoji => {
          const count = counts[emoji] ?? 0
          const active = userReactions.has(emoji)
          const isLoading = loading === emoji

          return (
            <button
              key={emoji}
              onClick={() => toggle(emoji)}
              disabled={!session?.user || isLoading}
              title={session?.user ? `React with ${emoji}` : 'Sign in to react'}
              className={[
                'flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium transition-all duration-150',
                'border',
                active
                  ? 'border-violet-500 bg-violet-500/10 dark:bg-violet-500/20 scale-110'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-violet-400 hover:scale-105',
                !session?.user ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
                isLoading ? 'opacity-60' : '',
              ].join(' ')}
            >
              <span className="text-base leading-none">{emoji}</span>
              {count > 0 && (
                <span className={active ? 'text-violet-600 dark:text-violet-400' : 'text-gray-500 dark:text-gray-400'}>
                  {count >= 1000 ? `${(count / 1000).toFixed(1)}k` : count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Total reactions */}
      {total > 0 && (
        <p className="text-xs text-gray-400 dark:text-gray-500">
          {total.toLocaleString()} reaction{total !== 1 ? 's' : ''}
        </p>
      )}
    </div>
  )
}
