'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'

const CONSENT_KEY = 'mature_consent_v1'

const RATING_LABELS: Record<string, string> = {
  'R': 'R — Restricted',
  'NC-17': 'NC-17 — Adults Only',
}

const RATING_DESCRIPTIONS: Record<string, string> = {
  'R': 'This story contains mature content including strong language, violence, or adult themes. Suitable for readers 17 and older.',
  'NC-17': 'This story contains explicit adult content. It is intended for readers 18 years of age and older only.',
}

interface MaturityGateProps {
  maturityRating: string
  children: React.ReactNode
}

export default function MaturityGate({ maturityRating, children }: MaturityGateProps) {
  const router = useRouter()
  const [consented, setConsented] = useState<boolean | null>(null)

  const isGated = maturityRating === 'R' || maturityRating === 'NC-17'

  useEffect(() => {
    if (!isGated) {
      setConsented(true)
      return
    }
    try {
      const stored = localStorage.getItem(CONSENT_KEY)
      setConsented(stored === 'true')
    } catch {
      setConsented(false)
    }
  }, [isGated])

  const handleConfirm = () => {
    try {
      localStorage.setItem(CONSENT_KEY, 'true')
    } catch {
      // storage unavailable — allow anyway for this session
    }
    setConsented(true)
  }

  const handleGoBack = () => {
    router.back()
  }

  // Still checking localStorage
  if (consented === null) return null

  if (!isGated || consented) {
    return <>{children}</>
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/95 backdrop-blur-sm">
      <div className="max-w-md w-full mx-4 bg-gray-900 border border-gray-700 rounded-2xl overflow-hidden shadow-2xl">
        {/* Header band */}
        <div className={`px-6 py-4 ${maturityRating === 'NC-17' ? 'bg-red-900/60' : 'bg-amber-900/60'}`}>
          <div className="flex items-center gap-3">
            <ExclamationTriangleIcon className="w-6 h-6 text-amber-400 flex-shrink-0" />
            <span className={`text-sm font-bold tracking-widest uppercase ${maturityRating === 'NC-17' ? 'text-red-300' : 'text-amber-300'}`}>
              {RATING_LABELS[maturityRating] ?? maturityRating}
            </span>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-6 space-y-4">
          <h2 className="text-xl font-bold text-white">Age Verification Required</h2>
          <p className="text-gray-300 text-sm leading-relaxed">
            {RATING_DESCRIPTIONS[maturityRating] ?? 'This story contains mature content and is intended for adult readers only.'}
          </p>
          <p className="text-gray-400 text-xs">
            Once confirmed, you won't be asked again on this device.
          </p>
        </div>

        {/* Actions */}
        <div className="px-6 pb-6 flex flex-col gap-3">
          <button
            onClick={handleConfirm}
            className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-colors"
          >
            I confirm I am {maturityRating === 'NC-17' ? '18' : '17'} or older — Continue
          </button>
          <button
            onClick={handleGoBack}
            className="w-full py-2 rounded-xl text-gray-400 hover:text-white text-sm transition-colors"
          >
            ← Go back
          </button>
        </div>
      </div>
    </div>
  )
}
