import type { Metadata } from 'next'
import AppLayout from '@/components/AppLayout'
import {
  SparklesIcon,
  GlobeAltIcon,
  SpeakerWaveIcon,
  BookmarkIcon,
  BellIcon,
  ChatBubbleLeftRightIcon,
  PencilSquareIcon,
  BookOpenIcon,
  UsersIcon,
  ChartBarIcon,
  PhotoIcon,
  StarIcon,
  AdjustmentsHorizontalIcon,
  FaceSmileIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline'

export const metadata: Metadata = {
  title: 'Platform Guide | Chapturs',
  description: 'Everything Chapturs can do — a guide to every reader, creator, and community feature.',
}

interface FeatureCardProps {
  icon: React.ReactNode
  title: string
  description: string
  badge?: string
}

function FeatureCard({ icon, title, description, badge }: FeatureCardProps) {
  return (
    <div className="relative bg-gray-800 border border-gray-700 rounded-xl p-5 flex flex-col gap-3 hover:border-gray-500 transition-colors">
      {badge && (
        <span className="absolute top-4 right-4 text-xs font-semibold px-2 py-0.5 bg-blue-900/60 text-blue-300 rounded-full border border-blue-700">
          {badge}
        </span>
      )}
      <div className="w-9 h-9 rounded-lg bg-gray-700 flex items-center justify-center text-blue-400 shrink-0">
        {icon}
      </div>
      <div>
        <h3 className="font-semibold text-gray-100 mb-1">{title}</h3>
        <p className="text-sm text-gray-400 leading-relaxed">{description}</p>
      </div>
    </div>
  )
}

interface SectionProps {
  id: string
  eyebrow: string
  heading: string
  subheading: string
  children: React.ReactNode
  accent?: string
}

function Section({ id, eyebrow, heading, subheading, children, accent = 'text-blue-400' }: SectionProps) {
  return (
    <section id={id} className="py-16 scroll-mt-8">
      <div className="mb-10">
        <p className={`text-sm font-semibold uppercase tracking-widest mb-2 ${accent}`}>{eyebrow}</p>
        <h2 className="text-2xl md:text-3xl font-bold text-gray-100 mb-3">{heading}</h2>
        <p className="text-gray-400 max-w-2xl">{subheading}</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {children}
      </div>
    </section>
  )
}

export default function FeaturesPage() {
  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto px-4 py-12">

        {/* Hero */}
        <div className="pb-12 border-b border-gray-700">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-900/30 border border-blue-800 rounded-full text-blue-300 text-xs font-medium mb-5">
            <SparklesIcon className="w-3.5 h-3.5" />
            Platform Guide
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-100 mb-4">
            Everything Chapturs can do
          </h1>
          <p className="text-gray-400 max-w-2xl text-lg leading-relaxed">
            Chapturs is a webnovel platform built for both readers and creators. Here&apos;s a full tour
            of every feature — from reading controls to the community content ecosystem.
          </p>

          {/* Jump links */}
          <div className="flex flex-wrap gap-3 mt-6">
            {['Readers', 'Creators', 'Community'].map(label => (
              <a
                key={label}
                href={`#${label.toLowerCase()}`}
                className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-300 hover:text-white hover:border-gray-500 transition-colors"
              >
                For {label}
              </a>
            ))}
          </div>
        </div>

        {/* ── READERS ───────────────────────────────────────────── */}
        <Section
          id="readers"
          eyebrow="For Readers"
          heading="A reading experience built around you"
          subheading="Discover stories, build your library, and tell authors exactly what resonates with you."
          accent="text-violet-400"
        >
          <FeatureCard
            icon={<SparklesIcon className="w-5 h-5" />}
            title="Smart Discovery Feed"
            description="Your home feed learns from your reading patterns and emoji reactions. The more you engage, the more accurately it surfaces stories you'll actually love — from the genres and styles you keep coming back to."
          />
          <FeatureCard
            icon={<FaceSmileIcon className="w-5 h-5" />}
            title="Chapter Reactions"
            description="Five emoji reactions at the end of every chapter let you express exactly how a moment landed. ❤️ 🔥 😂 😭 🤯 — each one feeds your personal recommendation profile and helps the story get found by readers like you."
          />
          <FeatureCard
            icon={<AdjustmentsHorizontalIcon className="w-5 h-5" />}
            title="Reading Controls"
            description="Adjust font size, font family, line height, brightness, and theme (light / paper / night) per reading session. Your settings persist across sessions on any device."
          />
          <FeatureCard
            icon={<GlobeAltIcon className="w-5 h-5" />}
            title="Multi-language Support"
            description="Switch any chapter to a community translation from the reading bar at the top. Fan translators submit language versions that authors approve — so you get human-quality translations, not just machine output."
          />
          <FeatureCard
            icon={<SpeakerWaveIcon className="w-5 h-5" />}
            title="Listen While You Read"
            description="Select a fan-narrated audiobook version of the chapter from the audio button in the reading bar. Authors approve and publish reader recordings, and you can switch between the written and audio experience at any point."
          />
          <FeatureCard
            icon={<BookmarkIcon className="w-5 h-5" />}
            title="Bookmarks & Library"
            description="Bookmark any story to save it to your private reading list. Your Library organises everything you've saved, are currently reading, or have finished — completely private and never visible to authors."
          />
          <FeatureCard
            icon={<BellIcon className="w-5 h-5" />}
            title="Subscriptions"
            description="Subscribe to a story to get notified the moment a new chapter drops. You can manage all your subscriptions from the Subscriptions page in the sidebar."
          />
          <FeatureCard
            icon={<ChatBubbleLeftRightIcon className="w-5 h-5" />}
            title="Comments & Threads"
            description="Leave comments on chapters or reply to threads. Highlight a passage of text while reading and tap 'Comment' to leave an inline note attached to that exact moment in the story."
          />
        </Section>

        <div className="border-t border-gray-700" />

        {/* ── CREATORS ──────────────────────────────────────────── */}
        <Section
          id="creators"
          eyebrow="For Creators"
          heading="Everything you need to build your story"
          subheading="Write, publish, and grow with tools built specifically for long-form serial fiction."
          accent="text-emerald-400"
        >
          <FeatureCard
            icon={<PencilSquareIcon className="w-5 h-5" />}
            title="The Chapter Editor"
            description="A clean rich-text editor with formatting tools, a full chapter list, and a resource sidebar. Chapters save as drafts automatically and can be published immediately or scheduled."
          />
          <FeatureCard
            icon={<BookOpenIcon className="w-5 h-5" />}
            title="Glossary System"
            description="Define every term, place, and concept in your world. Link any word in a chapter to a glossary entry — readers hover over highlighted words while reading to see your definitions without leaving the page."
          />
          <FeatureCard
            icon={<UsersIcon className="w-5 h-5" />}
            title="Character Profiles"
            description="Build profile cards for your cast — name, role, description, appearance, and a portrait. Character profiles are publicly visible on your story page, and readers can submit fan art tagged to specific characters."
          />
          <FeatureCard
            icon={<SparklesIcon className="w-5 h-5" />}
            title="AI Story Summary"
            description="After your first chapter is published, an AI-generated reader hook appears on your story's main page — written from a reader's perspective to help new visitors decide if the story is for them. Updates as your chapter count grows."
            badge="AI"
          />
          <FeatureCard
            icon={<StarIcon className="w-5 h-5" />}
            title="Featured Comments"
            description="Spot a reader comment that perfectly captures your story without spoilers? Feature it. Featured comments rotate on your story's main page, and readers who get featured earn a visible badge on their profile."
          />
          <FeatureCard
            icon={<DocumentTextIcon className="w-5 h-5" />}
            title="Pin & Moderate Comments"
            description="Pin important comments to the top of a chapter's thread, hide inappropriate ones without deleting them, and keep your community space exactly how you want it — you're always in control."
          />
          <FeatureCard
            icon={<ChartBarIcon className="w-5 h-5" />}
            title="Analytics Dashboard"
            description="Track views, reads, chapter completion rates, subscriber growth, and reaction breakdowns. Understand which chapters land hardest and where readers drop off."
          />
        </Section>

        <div className="border-t border-gray-700" />

        {/* ── COMMUNITY ─────────────────────────────────────────── */}
        <Section
          id="community"
          eyebrow="Community Systems"
          heading="A whole ecosystem around every story"
          subheading="Fan translations, audiobooks, art, and ratings — built on a framework where everyone earns fairly."
          accent="text-amber-400"
        >
          <FeatureCard
            icon={<GlobeAltIcon className="w-5 h-5" />}
            title="Fan Translations (3 Tiers)"
            description="Tier 1: instant AI translations, always available. Tier 2: community-submitted translations that you review and approve. Tier 3: contracted professional translators who work independently under a revenue-share deal you set."
          />
          <FeatureCard
            icon={<SpeakerWaveIcon className="w-5 h-5" />}
            title="Fan Audiobooks"
            description="Readers can record narrations and submit them chapter by chapter. You approve what gets published. Approved narrators earn the revenue-share percentage you configure in your fan content settings."
          />
          <FeatureCard
            icon={<PhotoIcon className="w-5 h-5" />}
            title="Fan Art"
            description="Readers submit artwork tagged to your characters. You can review and feature fan art on your creator profile. Artists get credited and linked back to their social profiles."
          />
          <FeatureCard
            icon={<StarIcon className="w-5 h-5" />}
            title="Community Ratings"
            description="Readers rate stories across multiple dimensions — overall, writing quality, plot, and world-building. Aggregate scores display on the story page and factor into discovery recommendations."
          />
          <FeatureCard
            icon={<ChartBarIcon className="w-5 h-5" />}
            title="Revenue Sharing"
            description="Translators and narrators earn a real share of the ad revenue their approved contributions generate. You set the default split in settings and can negotiate custom deals with individual Tier 3 contributors."
          />
          <FeatureCard
            icon={<UsersIcon className="w-5 h-5" />}
            title="Reader Profiles"
            description="Every reader has a public profile showing their featured comment count, premium status, and reading activity. A profile is a way for regular contributors and dedicated fans to be recognised."
          />
        </Section>

        {/* Footer CTA */}
        <div className="mt-4 py-12 border-t border-gray-700 text-center">
          <h2 className="text-xl font-semibold text-gray-100 mb-3">Ready to dive in?</h2>
          <p className="text-gray-400 mb-6">Start reading, or set up your creator profile and publish your first chapter.</p>
          <div className="flex justify-center gap-3 flex-wrap">
            <a
              href="/"
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              Browse Stories
            </a>
            <a
              href="/creator/upload"
              className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-gray-200 font-medium rounded-lg transition-colors"
            >
              Start Creating
            </a>
          </div>
        </div>

      </div>
    </AppLayout>
  )
}
