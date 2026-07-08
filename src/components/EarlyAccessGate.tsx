'use client'

import { useState, useEffect } from 'react'
import { Lock, Crown, Clock } from 'lucide-react'
import { useSession } from 'next-auth/react'

interface EarlyAccessGateProps {
  sectionId: string
  earlyAccessUntil: string | null
  workTitle: string
  chapterTitle: string
}

export default function EarlyAccessGate({ sectionId, earlyAccessUntil, workTitle, chapterTitle }: EarlyAccessGateProps) {
  const { data: session } = useSession()
  const [isPremium, setIsPremium] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!session?.user) { setLoading(false); return }
    fetch('/api/user/me')
      .then(r => r.json())
      .then(data => { setIsPremium(!!data.isPremium); setLoading(false) })
      .catch(() => setLoading(false))
  }, [session?.user])

  // No early access, or expired
  if (!earlyAccessUntil) return null
  const expiry = new Date(earlyAccessUntil)
  if (expiry < new Date()) return null

  // User is premium — show the chapter normally, but with a badge
  if (isPremium) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-medium mb-4">
        <Crown size={12} />
        Early access — unlocks for everyone {expiry.toLocaleDateString()}
      </div>
    )
  }

  // Non-premium — show the gate
  const timeRemaining = expiry.getTime() - Date.now()
  const daysRemaining = Math.ceil(timeRemaining / (1000 * 60 * 60 * 24))

  return (
    <div className="min-h-[400px] flex items-center justify-center py-12">
      <div className="max-w-md text-center px-6">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
          <Lock className="w-8 h-8 text-amber-600 dark:text-amber-400" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          Early Access Chapter
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-1">
          This chapter of <em>{workTitle}</em> is available to premium supporters now.
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-500 mb-6">
          <Clock size={14} className="inline mr-1" />
          Unlocks for everyone in {daysRemaining > 0 ? `${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}` : 'less than a day'}
        </p>
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-6 text-left">
          <p className="text-sm text-gray-600 dark:text-gray-400 italic">
            &ldquo;{chapterTitle}&rdquo;
          </p>
          <p className="text-xs text-gray-400 mt-2">A preview of the first paragraph will appear here once the author publishes this chapter.</p>
        </div>
        <a
          href="/api/stripe/checkout"
          className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-medium transition-colors"
        >
          <Crown size={16} />
          Go Premium — Read Now
        </a>
        <p className="text-xs text-gray-400 mt-3">
          $5/month — supports creators, unlocks all early access chapters
        </p>
      </div>
    </div>
  )
}
