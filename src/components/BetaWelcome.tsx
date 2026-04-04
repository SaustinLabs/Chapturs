'use client'

import { useState, useEffect } from 'react'
import { X, Rocket, DollarSign, Trophy, Sparkles, Users, TrendingUp } from 'lucide-react'
import Link from 'next/link'

interface BetaWelcomeProps {
  isLoggedIn?: boolean
}

export default function BetaWelcome({ isLoggedIn = false }: BetaWelcomeProps) {
  const [isVisible, setIsVisible] = useState(true)
  const [isDismissed, setIsDismissed] = useState(false)

  useEffect(() => {
    // Check if user has dismissed the welcome message
    const dismissed = localStorage.getItem('betaWelcomeDismissed')
    if (dismissed) {
      setIsDismissed(true)
      setIsVisible(false)
    }
  }, [])

  const handleDismiss = () => {
    localStorage.setItem('betaWelcomeDismissed', 'true')
    setIsVisible(false)
    setTimeout(() => setIsDismissed(true), 300) // Allow fade animation
  }

  if (isDismissed) return null

  // Full-screen landing page for non-logged-in users
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex justify-center items-center gap-2 mb-4">
              <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Chapturs
              </h1>
              <span className="px-3 py-1 bg-yellow-400 text-yellow-900 text-sm font-semibold rounded-full">
                BETA
              </span>
            </div>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              A creator-first webnovel platform that combines TikTok-style discovery with YouTube-style monetization
            </p>
          </div>

          {/* Mission Statement */}
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Sparkles className="text-purple-600" />
              Our Vision
            </h2>
            <p className="text-gray-700 mb-4">
              We're building a grassroots platform where creators retain full ownership of their work, readers discover 
              stories through infinite scroll, and everyone benefits from fair, transparent monetization.
            </p>
            <p className="text-gray-700 font-semibold">
              No paywalls. No data selling. No predatory contracts. Just great stories and fair compensation.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* For Readers */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Users className="text-blue-600" />
                For Readers
              </h3>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">✓</span>
                  <span><strong>Infinite Scroll Discovery:</strong> TikTok-style content feed mixing your subscriptions and new finds</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">✓</span>
                  <span><strong>All Content Free:</strong> No paywalled chapters, ever</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">✓</span>
                  <span><strong>Community Translation:</strong> Help bring stories to more languages</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">✓</span>
                  <span><strong>Premium Option (Coming):</strong> Ad-free reading + support all creators you read</span>
                </li>
              </ul>
            </div>

            {/* For Creators */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Rocket className="text-purple-600" />
                For Creators
              </h3>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">✓</span>
                  <span><strong>You Own Your Work:</strong> 100% IP rights, publish anywhere</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">✓</span>
                  <span><strong>Advanced Editor:</strong> Dynamic glossary, bulk upload, AI quality checks</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">✓</span>
                  <span><strong>Fair Monetization:</strong> 70/30 ad splits, 95/5 tips, Premium pool revenue</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">✓</span>
                  <span><strong>No Lock-In:</strong> Export all your content anytime</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Monetization Details */}
          <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <DollarSign className="text-green-600" />
              Monetization Roadmap (Coming Soon)
            </h2>
            
            <div className="grid md:grid-cols-3 gap-6 mb-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Tips & Donations</h4>
                <p className="text-sm text-gray-700">95% to creator, 5% platform fee</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Direct Subscriptions</h4>
                <p className="text-sm text-gray-700">95% to creator + supporter badge</p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Ad Revenue</h4>
                <p className="text-sm text-gray-700">70% to creator (customizable)</p>
              </div>
            </div>

            <div className="bg-white/50 rounded-lg p-4 mb-4">
              <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <TrendingUp className="text-blue-600 w-5 h-5" />
                Platform Premium (Like YouTube Premium)
              </h4>
              <p className="text-sm text-gray-700">
                One subscription for ad-free reading. Revenue distributed to creators based on actual reading time. 
                70% of Premium revenue goes to creators, 30% to platform operations.
              </p>
            </div>

            <div className="bg-white/50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-2">Advanced Ad Controls</h4>
              <p className="text-sm text-gray-700 mb-2">
                Creators can customize ad density and revenue splits:
              </p>
              <ul className="text-sm text-gray-700 space-y-1 ml-4">
                <li>• Fewer ads, lower revenue (better reader experience)</li>
                <li>• More ads, higher revenue (maximize earnings)</li>
                <li>• Featured placement programs (trade revenue for visibility)</li>
              </ul>
            </div>
          </div>

          {/* Writing Contests */}
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Trophy className="text-yellow-600" />
              <Link href="/contests" className="hover:text-yellow-700 transition-colors">Writing Contests →</Link>
            </h2>
            <p className="text-gray-700 mb-4">
              Compete in writing contests where ad revenue from contest entries pools together to fund prizes. 
              Platform-hosted contests may include additional prize money. Winner and runner-ups share the pool!
            </p>
            <p className="text-sm text-gray-600">
              Completely opt-in. Your regular content keeps its normal revenue splits.
            </p>
          </div>

          {/* Beta Status */}
          <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-bold text-yellow-900 mb-2">🚧 We're in Beta!</h3>
            <p className="text-yellow-800 mb-2">
              The platform is functional but actively being built. Expect bugs, missing features, and rapid improvements.
            </p>
            <p className="text-yellow-800 font-semibold">
              Current features: Story upload, reading feed, glossary system, translation collaboration
            </p>
            <p className="text-yellow-800">
              Coming soon: Monetization, Premium subscriptions, mobile apps
            </p>
          </div>

          {/* CTA */}
          <div className="text-center">
            <Link 
              href="/auth/signin"
              className="inline-block bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg"
            >
              Sign In with Google
            </Link>
            <p className="mt-4 text-sm text-gray-600">
              By signing in, you agree to our{' '}
              <Link href="/legal/terms" className="text-blue-600 hover:underline">Terms of Service</Link>
              {' and '}
              <Link href="/legal/privacy" className="text-blue-600 hover:underline">Privacy Policy</Link>
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Sidebar for logged-in users
  return (
    <div 
      className={`fixed right-4 top-20 w-96 bg-white rounded-lg shadow-xl border-2 border-purple-200 z-50 transition-all duration-300 ${
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
    >
      <div className="p-6">
        {/* Close Button */}
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Dismiss"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg font-bold text-gray-900">Welcome to Chapturs</h3>
            <span className="px-2 py-0.5 bg-yellow-400 text-yellow-900 text-xs font-semibold rounded">
              BETA
            </span>
          </div>
          <p className="text-sm text-gray-600">
            We're building something special together
          </p>
        </div>

        {/* Quick Info */}
        <div className="space-y-4 mb-4">
          <div className="flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-gray-900">No Paywalls</p>
              <p className="text-xs text-gray-600">All stories remain free to read, always</p>
            </div>
          </div>
          
          <div className="flex items-start gap-2">
            <DollarSign className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-gray-900">Fair Revenue Sharing</p>
              <p className="text-xs text-gray-600">70/30 ad splits, 95/5 tips & subscriptions</p>
              <p className="text-xs text-gray-600 mt-1">Platform Premium pool distributed by reading time</p>
            </div>
          </div>
          
          <div className="flex items-start gap-2">
            <Trophy className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div>
              <Link href="/contests" className="text-sm font-semibold text-gray-900 hover:text-yellow-700 transition-colors">
                Writing Contests →
              </Link>
              <p className="text-xs text-gray-600">Create or enter community contests</p>
              <p className="text-xs text-gray-600 mt-1">Contest entries pool ad revenue to fund prizes for winners</p>
              <p className="text-xs text-gray-600">Platform may add bonus prizes to official contests</p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <Users className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-gray-900">You Own Your Work</p>
              <p className="text-xs text-gray-600">100% IP rights, publish anywhere, export anytime</p>
            </div>
          </div>
        </div>

        {/* Links */}
        <div className="border-t pt-4">
          <Link 
            href="/about/roadmap"
            className="block text-sm text-blue-600 hover:text-blue-700 font-medium mb-2"
          >
            View Full Roadmap →
          </Link>
          <Link 
            href="/legal/creator-agreement"
            className="block text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            Creator Agreement →
          </Link>
        </div>
      </div>
    </div>
  )
}
