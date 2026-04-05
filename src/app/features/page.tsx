import type { Metadata } from 'next'
import AppLayout from '@/components/AppLayout'
import fs from 'fs'
import path from 'path'
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

interface ShowcaseItem {
  file: string
  label: string
  caption: string
}

const SHOWCASE_ITEMS: ShowcaseItem[] = [
  { file: 'reader.png',           label: 'Reading Experience',    caption: 'Clean, distraction-free chapter view with adaptive typography and inline glossary tooltips.' },
  { file: 'glossary.png',         label: 'Adaptive Glossary',     caption: 'Hover any highlighted term to see its definition. Spoiler-locked entries reveal only when the reader is far enough in the story.' },
  { file: 'featured-comments.png',label: 'Featured Comments',     caption: 'Authors pin standout reader reactions to the story page. Readers who get featured earn a visible badge.' },
  { file: 'creator-profile.png',  label: 'Creator Profile',       caption: 'A customisable three-panel creator canvas with draggable blocks, embedded media, and community links.' },
  { file: 'analytics.png',        label: 'Analytics Dashboard',   caption: 'Chapter completion rates, subscriber growth, and reaction breakdowns — all in one view.' },
  { file: 'rating.png',           label: 'Multi-dimension Rating', caption: 'Readers rate across writing, plot, characters, world-building, and pacing for nuanced story feedback.' },
]

function ShowcaseSection({ availableFiles }: { availableFiles: Set<string> }) {
  const visibleItems = SHOWCASE_ITEMS.filter(item => availableFiles.has(item.file))
  if (visibleItems.length === 0) return null

  return (
    <section className="py-16 border-b border-gray-700">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-widest mb-2 text-blue-400">See It In Action</p>
        <h2 className="text-2xl md:text-3xl font-bold text-gray-100 mb-3">Platform screenshots</h2>
        <p className="text-gray-400 max-w-2xl">A quick look at the features in practice.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {visibleItems.map(item => (
          <div key={item.file} className="group rounded-xl overflow-hidden border border-gray-700 bg-gray-800 hover:border-gray-500 transition-colors">
            <div className="aspect-[16/10] bg-gray-900 overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/screenshots/${item.file}`}
                alt={item.label}
                className="w-full h-full object-cover object-top group-hover:scale-[1.02] transition-transform duration-300"
              />
            </div>
            <div className="p-4">
              <p className="font-semibold text-gray-100 text-sm mb-1">{item.label}</p>
              <p className="text-xs text-gray-400 leading-relaxed">{item.caption}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

export default function FeaturesPage() {
  // Detect which screenshots are present at build/request time
  const screenshotsDir = path.join(process.cwd(), 'public', 'screenshots')
  let availableFiles = new Set<string>()
  try {
    const files = fs.readdirSync(screenshotsDir)
    availableFiles = new Set(files)
  } catch {
    // Directory doesn't exist yet — that's fine, showcase section won't render
  }

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
            Chapturs is a platform for long-form writing of any kind — serial fiction, articles, news,
            essays, and everything in between — built for both readers and creators. Here&apos;s a full
            tour of every feature, from reading controls to the community content ecosystem.
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

        {/* ── SCREENSHOTS (only renders when files are present) ─────── */}
        <ShowcaseSection availableFiles={availableFiles} />

        {/* ── READERS ───────────────────────────────────────────── */}
        <Section
          id="readers"
          eyebrow="For Readers"
          heading="A reading experience built around you"
          subheading="Discover stories, build your library, and tell authors exactly what resonates with you — whether it's a fantasy novel, a tech essay, or a breaking news piece."
          accent="text-violet-400"
        >
          <FeatureCard
            icon={<SparklesIcon className="w-5 h-5" />}
            title="Intelligent Discovery Feed"
            description="Your feed is shaped by dozens of signals working together: time spent per chapter, reading completion rates, emojis you leave, stories you like or bookmark, subscriptions, language preferences, your preferred formats, genres you explore, and the ones you skip. It isn't one signal — it's the full picture of how you actually read."
          />
          <FeatureCard
            icon={<FaceSmileIcon className="w-5 h-5" />}
            title="Chapter Reactions"
            description="Five emoji reactions at the end of every chapter let you express how a moment landed: ❤️ love it, 🔥 it's lit, 😂 hilarious, 😭 emotional, 🤯 mindblowing. Each reaction feeds into your personal taste profile and helps the platform surface this work to readers with similar reactions."
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
            description="Leave comments on chapters or reply to threads. Highlight any passage of text while reading and tap 'Comment' to leave an inline note anchored to that exact moment in the story — or 'Suggest Edit' to propose a correction the author can accept or dismiss."
          />
        </Section>

        <div className="border-t border-gray-700" />

        {/* ── CREATORS ──────────────────────────────────────────── */}
        <Section
          id="creators"
          eyebrow="For Creators"
          heading="Everything you need to build your story"
          subheading="Publish fiction, articles, essays, and more. Every tool here works just as well for a fantasy novel as it does for a weekly column or a news series."
          accent="text-emerald-400"
        >
          <FeatureCard
            icon={<PencilSquareIcon className="w-5 h-5" />}
            title="The Block-based Editor"
            description="Every chapter is built from blocks: prose paragraphs, headings, scene dividers, images, and more. Blocks support text alignment, font sizing, and pacing animations (fade-in, slide-up, typewriter) that readers see as they scroll. Chapters autosave as drafts and can be published immediately or scheduled. A pre-publish checklist and AI quality assessment run before anything goes live."
          />
          <FeatureCard
            icon={<AdjustmentsHorizontalIcon className="w-5 h-5" />}
            title="Story Simulation Blocks"
            description="Tell any kind of story without being limited to plain prose. Drop in a phone screen (iOS or Android) showing a text conversation. Add a Discord, WhatsApp, Telegram, or Slack chat UI. Write screenplay-style dialogue with speaker labels and emotion cues. Add a narrator box. Build interactive branching choices that readers can click through. The editor supports every format — novel, article, comic script, visual novel, interactive fiction."
          />
          <FeatureCard
            icon={<BookOpenIcon className="w-5 h-5" />}
            title="Adaptive Glossary"
            description="Define every term, place, faction, and concept in your world — then link them to any word in any chapter. Readers hover highlighted terms to see your definition inline without leaving the page. Entries can be marked as minor or major spoilers so they stay hidden until the right chapter, and each entry tracks where in the story the term first appears. Your glossary evolves with the story: add more detail to an entry as the truth comes out, and readers who hover early will only see what they're meant to know."
          />
          <FeatureCard
            icon={<UsersIcon className="w-5 h-5" />}
            title="Character Profiles"
            description="Build profile cards for your cast: name, aliases, role, description, appearance, and a portrait. Characters can be set to only appear on the story page from a specific chapter onward — keeping late-arriving characters or secret identities hidden until you're ready to reveal them. Profiles are publicly visible once unlocked, and readers can submit fan art tagged directly to a character."
          />
          <FeatureCard
            icon={<SparklesIcon className="w-5 h-5" />}
            title="AI Quality Assessment"
            description="Every chapter you publish is scored across six dimensions — writing quality, storytelling, characterization, world-building, engagement, and originality — and given a quality tier. Strong and exceptional chapters receive a visibility boost in the discovery system. You also get an AI-generated reader-facing hook for your story page, written to help first-time visitors decide if it's for them."
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
          <FeatureCard
            icon={<PhotoIcon className="w-5 h-5" />}
            title="Creator Profile — Block System"
            description="Your public creator profile is a three-panel canvas. The left sidebar holds your photo and bio (Markdown supported). The center features a work or a custom block — embed a YouTube video, for example, as the hero of your page instead of a book cover. The right side is a drag-and-drop grid of blocks you choose: work cards, YouTube channel, Twitch stream, Twitter feed, Discord server invite, external links, favourite author shoutouts, and support/donation prompts."
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
            description="Every reader has a public profile showing their featured comment count and premium status. Readers who have had comments featured by authors earn a visible badge — it's a way for dedicated community members to be recognised across the platform. Profiles also support the same block system as creator profiles, so readers can link their social channels, YouTube, Twitch, or anything else."
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
