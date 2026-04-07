'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import AppLayout from '@/components/AppLayout'
import { BellIcon, BellAlertIcon, CheckIcon } from '@heroicons/react/24/outline'

interface Notification {
  id: string
  type: string
  title: string
  message: string
  url: string | null
  isRead: boolean
  createdAt: string
}

const TYPE_ICON: Record<string, string> = {
  new_comment: '💬',
  new_subscriber: '⭐',
  new_chapter: '📖',
  new_like: '❤️',
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60_000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d < 30) return `${d}d ago`
  return new Date(dateStr).toLocaleDateString()
}

function NotificationsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [markingAll, setMarkingAll] = useState(false)

  useEffect(() => {
    if (status !== 'authenticated') return
    setLoading(true)
    fetch('/api/notifications')
      .then(r => r.json())
      .then(data => {
        setNotifications(data.notifications ?? [])
        setUnreadCount(data.unreadCount ?? 0)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [status])

  async function markAllRead() {
    setMarkingAll(true)
    try {
      await fetch('/api/notifications', { method: 'PATCH' })
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
      setUnreadCount(0)
    } catch {}
    setMarkingAll(false)
  }

  async function markOneRead(id: string) {
    try {
      await fetch(`/api/notifications/${id}`, { method: 'PATCH' })
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, isRead: true } : n)
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch {}
  }

  async function handleNotificationClick(n: Notification) {
    if (!n.isRead) await markOneRead(n.id)
    if (n.url) router.push(n.url)
  }

  if (status === 'unauthenticated') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <BellIcon className="w-12 h-12 text-gray-600 mx-auto mb-4" />
        <p className="text-gray-300 font-medium mb-2">Sign in to see your notifications</p>
        <a
          href="/auth/signin?callbackUrl=/notifications"
          className="inline-block mt-4 px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          Sign in
        </a>
      </div>
    )
  }

  if (status === 'loading' || loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-20 bg-gray-800 rounded-xl animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          {unreadCount > 0
            ? <BellAlertIcon className="w-6 h-6 text-blue-400" />
            : <BellIcon className="w-6 h-6 text-gray-400" />
          }
          <h1 className="text-xl font-bold text-white">Notifications</h1>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 text-xs font-semibold">
              {unreadCount} unread
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            disabled={markingAll}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-blue-400 hover:bg-blue-500/10 transition-colors disabled:opacity-50"
          >
            <CheckIcon className="w-3.5 h-3.5" />
            Mark all read
          </button>
        )}
      </div>

      {/* List */}
      {notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <BellIcon className="w-12 h-12 text-gray-600 mb-4" />
          <p className="text-gray-400 font-medium">No notifications yet</p>
          <p className="text-gray-600 text-sm mt-1">
            You'll see new subscribers, comments, likes, and chapter alerts here.
          </p>
        </div>
      ) : (
        <div className="space-y-1">
          {notifications.map(n => (
            <button
              key={n.id}
              onClick={() => handleNotificationClick(n)}
              className={`w-full flex items-start gap-4 px-4 py-4 rounded-xl text-left transition-colors
                ${!n.isRead
                  ? 'bg-blue-900/20 hover:bg-blue-900/30 border border-blue-700/30'
                  : 'hover:bg-gray-800/60 border border-transparent'
                }`}
            >
              <span className="text-xl mt-0.5 flex-shrink-0">
                {TYPE_ICON[n.type] ?? '🔔'}
              </span>
              <div className="min-w-0 flex-1">
                <p className={`text-sm font-semibold ${!n.isRead ? 'text-white' : 'text-gray-300'}`}>
                  {n.title}
                </p>
                <p className="text-sm text-gray-400 mt-0.5 line-clamp-2">{n.message}</p>
                <p className="text-xs text-gray-600 mt-1">{timeAgo(n.createdAt)}</p>
              </div>
              {!n.isRead && (
                <div className="w-2 h-2 rounded-full bg-blue-400 flex-shrink-0 mt-2" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function NotificationsPageWrapper() {
  return (
    <AppLayout>
      <NotificationsPage />
    </AppLayout>
  )
}
