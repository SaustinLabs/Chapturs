'use client'

import React, { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useToast } from '@/components/ui/Toast'

const BENEFITS = [
  'No ads — ever',
  '70% of your subscription split among authors you read',
  'Early access to creator announcements',
  'Premium badge on your profile',
]

const PremiumSubscriptionSettings: React.FC = () => {
  const { data: session } = useSession()
  const [isPremium, setIsPremium] = useState(false)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetch('/api/user/monetization')
      .then(res => res.json())
      .then(data => {
        setIsPremium(!!data.isPremium)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const goPremium = async () => {
    if (!session?.user) {
      toast.error('Please sign in to subscribe.')
      return
    }
    setProcessing(true)
    try {
      const res = await fetch('/api/stripe/checkout', { method: 'POST' })
      if (!res.ok) throw new Error(await res.text())
      const { url } = await res.json()
      window.location.href = url
    } catch {
      toast.error('Could not start checkout. Please try again.')
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-3">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48" />
        <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Premium Membership</h2>
      {isPremium ? (
        <div className="rounded-xl border border-emerald-200 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/20 p-5 space-y-3">
          <p className="text-emerald-600 dark:text-emerald-400 text-lg font-semibold">✓ Active Member</p>
          <ul className="space-y-1 text-sm text-emerald-800 dark:text-emerald-300">
            {BENEFITS.map(b => (
              <li key={b} className="flex items-center gap-2">
                <span className="text-emerald-500">✓</span> {b}
              </li>
            ))}
          </ul>
          <p className="text-xs text-emerald-700 dark:text-emerald-400">
            To cancel, manage your subscription in your Stripe customer portal.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5 space-y-4">
          <div>
            <p className="font-semibold text-gray-900 dark:text-gray-100">
              Go ad-free and support the authors you love —{' '}
              <span className="text-indigo-600 dark:text-indigo-400">$5 / month</span>
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Your subscription is split among the authors you actually read.
            </p>
          </div>
          <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
            {BENEFITS.map(b => (
              <li key={b} className="flex items-center gap-2">
                <span className="text-indigo-400">✓</span> {b}
              </li>
            ))}
          </ul>
          <button
            onClick={goPremium}
            disabled={processing}
            className="w-full rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold py-2.5 px-4 transition-colors"
          >
            {processing ? 'Redirecting to checkout…' : 'Become a Member'}
          </button>
          <p className="text-xs text-center text-gray-400">
            Secure checkout powered by Stripe. Cancel any time.
          </p>
        </div>
      )}
    </div>
  )
}

export default PremiumSubscriptionSettings

