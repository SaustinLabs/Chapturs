# Chapturs — Social Media Content Scout

> Feed this document to a fresh Hermes session. The session's job: explore
> chapturs.com and the local codebase to find platform features worth teasing
> on social media. Output a content calendar with specific hooks.

## Your Mission

You are scouting Chapturs (chapturs.com) for social media content. The platform
is in soft-launch / pre-reveal phase. Your output will feed posts that tease
features without giving everything away at once.

**Do NOT describe yourself or what you're doing.** Produce content hooks
directly. The output is a markdown document at
`~/chapturs-social-content.md`.

## What to look for

### 1. Reader features
Things a reader would be excited about:
- How the reading experience works (typography, dark mode, continuous scroll)
- Chapter navigation, bookmarks, subscriptions
- Comment system with reactions, featured comments, spoiler blur
- Glossary tooltips — tap a term, see its definition in-world
- Character tooltips — tap a name, see their role and quick glance
- Translation system — community translations with rating/suggestions
- Achievement badges for readers (First!, Collector, Insightful, Voracious)
- Mobile reading experience
- Library organization (shelves: Reading, Want to Read, On Hold, Finished)

### 2. Creator features
Things a writer would migrate for:
- Rich text editor (TipTap-based, smart paste from Google Docs/Word)
- Chapter management, scheduling, drafts
- Glossary system with chapter-aware definitions and aliases
- Character profile system with relationships, development arcs, version history
- Quality assessment — AI-powered writing feedback with tier scores
- Monetization: Stripe subscriptions, ad revenue, creator payouts
- Analytics dashboard (reads, engagement, drop-off rates)
- Collaborative editing with permissions
- Series/volume organization
- Fan content management (fanart approvals, audiobook submissions)

### 3. Platform differentiators
Things that make Chapturs NOT Wattpad/RoyalRoad:
- AI quality assessment (not generative — evaluative)
- Living World system (shared universes across multiple authors)
- Dual reader/creator hubs (not just a feed)
- Achievement + leveling system for both readers AND creators
- Translation ecosystem (not just "English only")
- Smart paste pipeline (import from Google Docs preserves formatting)
- Gutenberg public domain import for classic literature
- Premium support model (readers subscribe to creators, not the platform)

### 4. Community & social features
- Comment threading (3 levels) with like/reaction/report
- Creator-featured comments with badges
- Profile blocks (customizable author pages)
- Fan translation, fan audiobook, fan art submission pipelines
- Subscription model (follow authors, not just stories)

### 5. Technical flex (for dev/tech audiences)
- Next.js App Router, server components, zero type errors
- Prisma/Supabase Postgres, Cloudflare R2 storage
- Real-time presence via Redis
- PM2 deployment on bare metal (not Vercel)
- Design system with DESIGN.md token spec
- Continuous scroll reader with IntersectionObserver preloading

## How to scout

1. **Read the docs first.** Start with `docs/summaries/feature-systems.md` in
   the repo at `/home/smccrary/chapturs/`. This is the full feature inventory.
2. **Browse chapturs.com.** Navigate the live site. Try the reading experience,
   check the comment system, look at profiles, explore the creator dashboard.
3. **Check the codebase.** Interesting features often have more depth in the
   source than what's visible on the live site.

## Output format

Produce `~/chapturs-social-content.md` with this structure:

```markdown
# Chapturs Social Media Content Calendar

## Platform Voice
[One paragraph — how Chapturs should sound on social. Tone, personality.]

## Content Buckets
[3-5 recurring post categories with descriptions]

## Individual Post Hooks
[15-25 specific hooks, each with:]

### [Hook title — the social post headline]
- **Category:** [reader / creator / platform / tech]
- **Feature:** [what specific feature this showcases]
- **Angle:** [why this is interesting / what problem it solves]
- **Visual idea:** [screenshot, GIF, or video concept]
- **Platforms:** [Twitter, Instagram, TikTok, Reddit, etc.]
- **Draft post:** [1-3 sentences, ready to post]

## Launch Sequence
[Ordered list of the first 5-7 posts for the reveal week]
```

## Constraints

- **Tease, don't explain.** Social posts should make people curious, not give
  them a manual. "Your world has a glossary now" is better than "Chapturs
  features a chapter-aware glossary system with aliases and versioning."
- **Show, don't tell.** Every hook should have a visual idea. A screenshot
  of the glossary tooltip in action > a paragraph about glossary features.
- **One feature per post.** Don't cram. A post about the comment system and
  another about the reading experience are better than one post about both.
- **Vary the audience.** Some posts for writers, some for readers, some for
  devs, some for general "what is this platform" curiosity.
- **Real examples > feature lists.** "Linnea's ember powers appear in a tooltip
  when you tap her name" is better than "Character tooltips show role and
  quick glance."
