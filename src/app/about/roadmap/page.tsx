import Link from 'next/link'
import { CheckCircle2, Circle, Clock, Rocket, DollarSign, Trophy, Sparkles } from 'lucide-react'

export default function RoadmapPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Chapturs Roadmap</h1>
          <p className="text-xl text-gray-600">
            Transparent status of what is live, what is in progress, and what is next.
          </p>
          <div className="mt-4 inline-block px-4 py-2 bg-blue-100 text-blue-800 rounded-full font-semibold">
            Public Beta - Last updated: April 2026
          </div>
          <p className="mt-3 text-sm text-gray-500">
            This page is synced with TASKS tracking and the public features guide.
          </p>
        </div>

        {/* Phase 1: Foundation */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <CheckCircle2 className="w-8 h-8 text-green-600" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Phase 1: Foundation</h2>
              <p className="text-sm text-green-600 font-semibold">COMPLETED</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-900">Core Reading Experience</h3>
                <p className="text-sm text-gray-600">Discovery feed, reading controls, library/bookmarks, subscriptions.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-900">Creator Tools</h3>
                <p className="text-sm text-gray-600">Block editor, glossary, character profiles, analytics, moderation controls.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-900">Community & Fan Content</h3>
                <p className="text-sm text-gray-600">Comments, ratings, fan translations, fan audiobooks, and fan art workflows.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-900">Quality Assessment</h3>
                <p className="text-sm text-gray-600">AI quality checks and story hooks through OpenRouter-integrated models.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-900">Authentication & Database</h3>
                <p className="text-sm text-gray-600">OAuth login (Google, GitHub, Discord), role-gated admin tools, production DB workflows.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Phase 2: Growth Tools */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8 border-2 border-blue-400">
          <div className="flex items-center gap-3 mb-6">
            <Clock className="w-8 h-8 text-blue-600" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Phase 2: Growth Tools</h2>
              <p className="text-sm text-blue-600 font-semibold">IN PROGRESS</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-900">Community Referral Links + Feed Seeding</h3>
                <p className="text-sm text-gray-600">Referral links are live and cold-start feed seeding is integrated.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Circle className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-900">Founding Creator Program</h3>
                <p className="text-sm text-gray-600">Cohort/badges design and points framework are in active planning.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Circle className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-900">Public Domain Seed Content</h3>
                <p className="text-sm text-gray-600">Import Gutenberg works with glossary and character profile enrichment.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Circle className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-900">Notifications Expansion</h3>
                <p className="text-sm text-gray-600">In-app center is partially wired; digest and push are upcoming.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Phase 3: Collaborative Editor */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <Clock className="w-8 h-8 text-indigo-600" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Phase 3: Collaborative Editor</h2>
              <p className="text-sm text-gray-500 font-semibold">IN PROGRESS</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-900">Co-author Invites + Roles</h3>
                <p className="text-sm text-gray-600">Invite by username is live in Creator Hub, including collaborator removal and role assignment.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-900">Collaboration Activity Log</h3>
                <p className="text-sm text-gray-600">Live activity feed of collaborator actions (add/remove, edits, publishing) is now available in the Creator Hub.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-indigo-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-900">Role Permissions Rollout</h3>
                <p className="text-sm text-gray-600">Chapter edit/publish and glossary writes now enforce collaborator permissions. Remaining creator write paths are being aligned.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-indigo-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-900">Real-time Co-editing</h3>
                <p className="text-sm text-gray-600">Chapter soft-locking is now live in the editor to prevent simultaneous edits. Live cursors and real-time merge flows are next.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Phase 4: Ecosystem Expansion */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <Trophy className="w-8 h-8 text-yellow-600" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Phase 4: Ecosystem Expansion</h2>
              <p className="text-sm text-gray-500 font-semibold">PLANNED</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Circle className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-900">Reader Contribution Tools</h3>
                <p className="text-sm text-gray-600">Reader highlight suggestions and creator accept/reject queues.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Circle className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-900">Series and Volumes</h3>
                <p className="text-sm text-gray-600">Grouped works, automatic progression, series-level subscriptions.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Circle className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-900">Discovery Extensions</h3>
                <p className="text-sm text-gray-600">Dedicated trending page and stronger recommendation surfaces.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Circle className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-900">Notification Center</h3>
                <p className="text-sm text-gray-600">Complete bell center UX plus digest and push coverage.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Phase 5: Future Expansion */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <Rocket className="w-8 h-8 text-purple-600" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Phase 5: Future Expansion</h2>
              <p className="text-sm text-gray-500 font-semibold">PLANNED AFTER SCALE</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Circle className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-900">Writers Room / Living World</h3>
                <p className="text-sm text-gray-600">Shared universe canon systems with lore tooling and council workflows.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Circle className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-900">AI Author Bots</h3>
                <p className="text-sm text-gray-600">Transparent, clearly-labeled cold-start support content systems.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Circle className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-900">Monetization Hardening</h3>
                <p className="text-sm text-gray-600">Stripe enablement, webhook verification, payout UX, and safeguards.</p>
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
                <p className="text-sm text-gray-700">Core reading remains accessible while monetization is creator-first and transparent.</p>
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
            We are building this platform <em>with</em> creators and readers, not just <em>for</em> them.
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
