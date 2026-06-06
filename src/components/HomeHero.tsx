'use client'

import { signIn } from 'next-auth/react'

export default function HomeHero() {
  return (
    <div className="mb-8 rounded-2xl bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 px-6 py-8 sm:px-10 text-white">
      <h1 className="text-3xl sm:text-4xl font-extrabold mb-2 leading-tight">
        Stories worth reading.<br />
        <span className="text-blue-300">Creators worth supporting.</span>
      </h1>
      <p className="text-blue-100 mb-6 max-w-xl text-lg">
        Chapturs is the free webnovel platform where 70% of ad revenue goes directly to the authors you love.
      </p>
      <div className="flex flex-wrap gap-4 mb-6 text-sm">
        <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2">
          <span className="text-green-400">✓</span>
          <span>Free to read, always</span>
        </div>
        <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2">
          <span className="text-green-400">✓</span>
          <span>70% ad revenue to creators</span>
        </div>
        <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2">
          <span className="text-green-400">✓</span>
          <span>You own your work, always</span>
        </div>
      </div>
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => signIn('google')}
          className="px-5 py-2.5 bg-white text-indigo-900 font-semibold rounded-lg hover:bg-blue-50 transition-colors"
        >
          Sign in with Google
        </button>
        <a
          href="/about"
          className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white font-medium rounded-lg transition-colors"
        >
          Learn more
        </a>
      </div>
    </div>
  )
}
