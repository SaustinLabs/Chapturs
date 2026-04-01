'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import type { ReactNode } from 'react'
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/solid'

// ─── Types ────────────────────────────────────────────────────────────────────

export type ToastType = 'success' | 'error' | 'info' | 'warning'

interface ToastEntry {
  id: string
  type: ToastType
  message: string
}

interface ToastHelpers {
  success: (message: string) => void
  error: (message: string) => void
  info: (message: string) => void
  warning: (message: string) => void
}

interface ToastContextValue {
  addToast: (type: ToastType, message: string) => void
  toast: ToastHelpers
}

// ─── Context ──────────────────────────────────────────────────────────────────

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return ctx
}

// ─── Provider ─────────────────────────────────────────────────────────────────

const MAX_TOASTS = 5
const AUTO_DISMISS_MS = 4500

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastEntry[]>([])

  const addToast = useCallback((type: ToastType, message: string) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    setToasts((prev) => {
      const next = [...prev, { id, type, message }]
      return next.length > MAX_TOASTS ? next.slice(next.length - MAX_TOASTS) : next
    })
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const toast = useMemo<ToastHelpers>(
    () => ({
      success: (message) => addToast('success', message),
      error: (message) => addToast('error', message),
      info: (message) => addToast('info', message),
      warning: (message) => addToast('warning', message),
    }),
    [addToast]
  )

  return (
    <ToastContext.Provider value={{ addToast, toast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  )
}

// ─── Visual components ────────────────────────────────────────────────────────

const ICON_MAP: Record<ToastType, React.ReactElement> = {
  success: <CheckCircleIcon className="w-5 h-5 text-green-500" />,
  error: <ExclamationCircleIcon className="w-5 h-5 text-red-500" />,
  warning: <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500" />,
  info: <InformationCircleIcon className="w-5 h-5 text-blue-500" />,
}

const BORDER_MAP: Record<ToastType, string> = {
  success: 'border-green-200 dark:border-green-700',
  error: 'border-red-200 dark:border-red-700',
  warning: 'border-yellow-200 dark:border-yellow-700',
  info: 'border-blue-200 dark:border-blue-700',
}

function ToastItem({
  entry,
  onRemove,
}: {
  entry: ToastEntry
  onRemove: () => void
}) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    timerRef.current = setTimeout(onRemove, AUTO_DISMISS_MS)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entry.id])

  return (
    <div
      role="alert"
      className={`flex items-start gap-3 bg-white dark:bg-gray-800 border ${BORDER_MAP[entry.type]} shadow-lg rounded-lg px-4 py-3 min-w-[260px] max-w-sm`}
    >
      <span className="mt-0.5 flex-shrink-0">{ICON_MAP[entry.type]}</span>
      <p className="flex-1 text-sm text-gray-800 dark:text-gray-100">{entry.message}</p>
      <button
        onClick={onRemove}
        className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        aria-label="Dismiss notification"
      >
        <XMarkIcon className="w-4 h-4" />
      </button>
    </div>
  )
}

function ToastContainer({
  toasts,
  onRemove,
}: {
  toasts: ToastEntry[]
  onRemove: (id: string) => void
}) {
  if (toasts.length === 0) return null

  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none"
    >
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto">
          <ToastItem entry={t} onRemove={() => onRemove(t.id)} />
        </div>
      ))}
    </div>
  )
}
