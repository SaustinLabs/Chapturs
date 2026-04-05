'use client'

import { useState, useRef, useEffect, FormEvent } from 'react'
import { signOut } from 'next-auth/react'
import { ShieldCheckIcon, LockClosedIcon } from '@heroicons/react/24/outline'

export default function AdminBootstrapPage() {
  const [pin, setPin] = useState(['', '', '', ''])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const inputs = useRef<(HTMLInputElement | null)[]>([])

  // Auto-focus first cell on mount
  useEffect(() => {
    inputs.current[0]?.focus()
  }, [])

  const handleDigit = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return
    const next = [...pin]
    next[index] = value
    setPin(next)
    setError('')
    if (value && index < 3) {
      inputs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      inputs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4)
    if (text.length === 4) {
      setPin(text.split(''))
      inputs.current[3]?.focus()
    }
    e.preventDefault()
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const fullPin = pin.join('')
    if (fullPin.length < 4) {
      setError('Enter your 4-digit PIN.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/admin/bootstrap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: fullPin }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Invalid credentials.')
        setPin(['', '', '', ''])
        inputs.current[0]?.focus()
        return
      }

      setSuccess(true)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="w-full max-w-sm text-center">
          <div className="w-16 h-16 bg-green-500/10 border border-green-500/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldCheckIcon className="w-8 h-8 text-green-400" />
          </div>
          <h1 className="text-2xl font-black text-white mb-2">Admin access granted</h1>
          <p className="text-gray-400 text-sm mb-8">
            Your account has been elevated. Sign out and back in to activate the new role — your session needs to refresh.
          </p>
          <button
            onClick={() => signOut({ callbackUrl: '/auth/signin' })}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-3 rounded-2xl transition-colors"
          >
            Sign out &amp; sign back in →
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-blue-600/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-gray-800 border border-gray-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <LockClosedIcon className="w-7 h-7 text-gray-400" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Admin access</h1>
          <p className="text-gray-500 text-sm mt-1">
            Enter your 4-digit admin PIN to continue.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-gray-900 border border-gray-800 rounded-3xl p-8 shadow-2xl"
        >
          {/* PIN input cells */}
          <div className="flex justify-center gap-3 mb-6" onPaste={handlePaste}>
            {pin.map((digit, i) => (
              <input
                key={i}
                ref={el => { inputs.current[i] = el }}
                type="password"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                autoComplete="off"
                onChange={e => handleDigit(i, e.target.value)}
                onKeyDown={e => handleKeyDown(i, e)}
                className={`w-14 h-14 text-center text-2xl font-black rounded-2xl border bg-gray-800 text-white caret-transparent focus:outline-none transition-all ${
                  error
                    ? 'border-red-500 bg-red-500/10'
                    : digit
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-gray-700 focus:border-blue-500'
                }`}
              />
            ))}
          </div>

          {error && (
            <p className="text-center text-sm text-red-400 mb-4 font-medium">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || pin.join('').length < 4}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black py-3 rounded-2xl transition-colors text-sm"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Verifying…
              </span>
            ) : (
              'Unlock Admin'
            )}
          </button>

          <p className="text-center text-xs text-gray-600 mt-5">
            This page is only useful if you are the site owner.<br />
            Unauthorised attempts are logged.
          </p>
        </form>
      </div>
    </div>
  )
}
