import Link from 'next/link'
import { CheckCircle2, Circle, Clock, Rocket, DollarSign, Trophy, Users, Sparkles, Globe, Smartphone } from 'lucide-react'

export default function RoadmapPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Chapturs Roadmap</h1>
          <p className="text-xl text-gray-600">
            Our journey to build the best creator-first webnovel platform
          </p>
          <div className="mt-4 inline-block px-4 py-2 bg-yellow-100 text-yellow-800 rounded-full font-semibold">
            🚧 Currently in Beta - Last updated: April 2026
          </div>
        </div>

        {/* Phase 1: Foundation (Completed) */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Phase 1: Foundation</h2>
              <p className="text-sm text-green-600 font-semibold">COMPLETED ✓</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-900">Core Reading Experience</h3>
                <p className="text-sm text-gray-600">Infinite scroll feed, chapter reading, bookmarks</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-900">Creator Tools</h3>
                <p className="text-sm text-gray-600">Advanced editor with dynamic glossary system, bulk upload</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-900">Translation System</h3>
                <p className="text-sm text-gray-600">Community translation collaboration with voting and approval</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-900">Quality Assessment</h3>
                <p className="text-sm text-gray-600">AI-powered quality checks (grammar, coherence, formatting)</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-900">Authentication & Database</h3>
                <p className="text-sm text-gray-600">OAuth login (Google, GitHub, Discord), PostgreSQL + Redis optimization</p>
              </div>
            </div>
          </div>
        </div>

        {/* Phase 2: Polish & Testing (Current) */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8 border-2 border-blue-400">
          <div className="flex items-center gap-3 mb-6">
            <Clock className="w-8 h-8 text-blue-600" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Phase 2: Polish & Testing</h2>
              <p className="text-sm text-blue-600 font-semibold">IN PROGRESS 🔄</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-900">Legal Documentation</h3>
                <p className="text-sm text-gray-600">Privacy Policy, Terms of Service, Creator Agreement</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Circle className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-900">End-to-End Testing</h3>
                <p className="text-sm text-gray-600">Translation workflow, comments, editing, moderation</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Circle className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-900">UI/UX Improvements</h3>
                <p className="text-sm text-gray-600">Mobile responsiveness, accessibility, performance</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Circle className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-900">Content Moderation</h3>
                <p className="text-sm text-gray-600">Reporting system, moderator tools, appeals process</p>
              </div>
            </div>
          </div>
        </div>

        {/* Phase 3: Monetization */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <DollarSign className="w-8 h-8 text-green-600" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Phase 3: Monetization</h2>
              <p className="text-sm text-gray-500 font-semibold">PLANNED - Q1 2026</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Circle className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-900">Tips & Donations</h3>
                <p className="text-sm text-gray-600">One-time payments, 95/5 split, PayPal/Stripe integration</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Circle className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-900">Individual Subscriptions</h3>
                <p className="text-sm text-gray-600">Direct creator support, supporter badges, bonus content access</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Circle className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-900">Ad System</h3>
                <p className="text-sm text-gray-600">70/30 revenue split, customizable ad density, featured placement programs</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Circle className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-900">Platform Premium (Beta)</h3>
                <p className="text-sm text-gray-600">YouTube Premium-style subscription, ad-free reading, revenue pool distribution</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Circle className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-900">Creator Dashboard</h3>
                <p className="text-sm text-gray-600">Earnings tracking, analytics, payout management</p>
              </div>
            </div>
          </div>
        </div>

        {/* Phase 4: Community Features */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <Trophy className="w-8 h-8 text-yellow-600" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Phase 4: Community Features</h2>
              <p className="text-sm text-gray-500 font-semibold">PLANNED - Q2 2026</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Circle className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-900">Writing Contests</h3>
                <p className="text-sm text-gray-600">Pooled ad revenue prizes, platform-hosted contests, community contests</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Circle className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-900">Creator Collaborations</h3>
                <p className="text-sm text-gray-600">Co-authoring tools, shared universes, crossover events</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Circle className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-900">Community Forums</h3>
                <p className="text-sm text-gray-600">Creator discussions, reader feedback, feature requests</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Circle className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-900">Advanced Analytics</h3>
                <p className="text-sm text-gray-600">Reader demographics, engagement heatmaps, retention metrics</p>
              </div>
            </div>
          </div>
        </div>

        {/* Phase 5: Scale & Expansion */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <Rocket className="w-8 h-8 text-purple-600" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Phase 5: Scale & Expansion</h2>
              <p className="text-sm text-gray-500 font-semibold">PLANNED - 2026+</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Circle className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-900">Mobile Apps</h3>
                <p className="text-sm text-gray-600">iOS and Android native apps, offline reading</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Circle className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-900">International Expansion</h3>
                <p className="text-sm text-gray-600">Multi-language UI, regional payment methods, localized content</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Circle className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-900">Publishing Partnerships</h3>
                <p className="text-sm text-gray-600">Traditional publisher connections, print-on-demand, media adaptation deals</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Circle className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-900">Enhanced Media Integration</h3>
                <p className="text-sm text-gray-600">Advanced multimedia features, creator-produced supplementary content</p>
              </div>
            </div>
          </div>
        </div>

        {/* Our Principles */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Sparkles className="text-purple-600" />
            Our Guiding Principles
          </h2>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl">💎</span>
              <div>
                <h3 className="font-semibold text-gray-900">Creators Own Their Work</h3>
                <p className="text-sm text-gray-700">100% IP rights, non-exclusive, exportable content, no lock-in</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl">🚫</span>
              <div>
                <h3 className="font-semibold text-gray-900">No Paywalls</h3>
                <p className="text-sm text-gray-700">All main content free to read, forever</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl">🤝</span>
              <div>
                <h3 className="font-semibold text-gray-900">Fair Revenue Sharing</h3>
                <p className="text-sm text-gray-700">Industry-leading splits, transparent accounting, creator control</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl">🔒</span>
              <div>
                <h3 className="font-semibold text-gray-900">Privacy First</h3>
                <p className="text-sm text-gray-700">No data selling, no AI training on your work, minimal tracking</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-2xl">🌱</span>
              <div>
                <h3 className="font-semibold text-gray-900">Grassroots Growth</h3>
                <p className="text-sm text-gray-700">Community-driven features, creator feedback, reader involvement</p>
              </div>
            </div>
          </div>
        </div>

        {/* Feedback CTA */}
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Help Shape Chapturs</h2>
          <p className="text-gray-700 mb-6">
            We're building this platform <em>with</em> creators and readers, not just <em>for</em> them. 
            Your feedback directly influences our roadmap.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a 
              href="mailto:feedback@chapturs.com"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Send Feedback
            </a>
            <Link 
              href="/legal/creator-agreement"
              className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
            >
              Creator Agreement
            </Link>
          </div>
        </div>

        {/* Back Link */}
        <div className="mt-8 text-center">
          <Link href="/" className="text-blue-600 hover:text-blue-700 font-medium">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
