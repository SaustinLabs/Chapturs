'use client'

import { useState, useEffect, useRef } from 'react'
import { BellIcon } from '@heroicons/react/24/outline'
import { BellAlertIcon } from '@heroicons/react/24/solid'

interface Notification {
  id: string
  type: string
  title: string
  message: string
  url: string | null
  isRead: boolean
  createdAt: string
}

export default function NotificationBell({ isCollapsed }: { isCollapsed: boolean }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchNotifications()
    // Poll every 60s
    const interval = setInterval(fetchNotifications, 60_000)
    return () => clearInterval(interval)
  }, [])

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  async function fetchNotifications() {
    try {
      const res = await fetch('/api/notifications')
      if (!res.ok) return
      const data = await res.json()
      setNotifications(data.notifications ?? [])
      setUnreadCount(data.unreadCount ?? 0)
    } catch {}
  }

  async function markAllRead() {
    try {
      await fetch('/api/notifications', { method: 'PATCH' })
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
      setUnreadCount(0)
    } catch {}
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

  function handleOpen() {
    setOpen(prev => !prev)
    if (!open && unreadCount > 0) markAllRead()
  }

  function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime()
    const m = Math.floor(diff / 60_000)
    if (m < 1) return 'just now'
    if (m < 60) return `${m}m ago`
    const h = Math.floor(m / 60)
    if (h < 24) return `${h}h ago`
    return `${Math.floor(h / 24)}d ago`
  }

  const typeIcon: Record<string, string> = {
    new_comment: '💬',
    new_subscriber: '⭐',
    new_chapter: '📖',
    new_like: '❤️',
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={handleOpen}
        className={`flex items-center w-full px-3 py-2 rounded-lg text-sm font-medium
          text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800
          hover:text-gray-900 dark:hover:text-white transition-colors
          ${isCollapsed ? 'justify-center' : ''}`}
        title={isCollapsed ? 'Notifications' : undefined}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
      >
        <div className="relative flex-shrink-0">
          {unreadCount > 0
            ? <BellAlertIcon className="w-5 h-5 text-blue-400" />
            : <BellIcon className="w-5 h-5" />
          }
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </div>
        {!isCollapsed && <span className="ml-3 flex-1 text-left">Notifications</span>}
      </button>

      {open && (
        <div className="absolute left-full ml-2 top-0 z-50 w-80 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
            <span className="text-sm font-semibold text-white">Notifications</span>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="text-xs text-blue-400 hover:text-blue-300">
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-gray-500">
                No notifications yet
              </div>
            ) : (
              notifications.map(n => (
                <a
                  key={n.id}
                  href={n.url ?? '#'}
                  onClick={() => {
                    if (!n.isRead) markOneRead(n.id)
                    setOpen(false)
                  }}
                  className={`flex gap-3 px-4 py-3 hover:bg-gray-700/60 transition-colors border-b border-gray-700/50 last:border-0
                    ${!n.isRead ? 'bg-blue-900/20' : ''}`}
                >
                  <span className="text-lg mt-0.5 flex-shrink-0">{typeIcon[n.type] ?? '🔔'}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">{n.title}</p>
                    <p className="text-xs text-gray-400 truncate">{n.message}</p>
                    <p className="text-[11px] text-gray-500 mt-0.5">{timeAgo(n.createdAt)}</p>
                  </div>
                  {!n.isRead && (
                    <div className="w-2 h-2 rounded-full bg-blue-400 flex-shrink-0 mt-1.5" />
                  )}
                </a>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
