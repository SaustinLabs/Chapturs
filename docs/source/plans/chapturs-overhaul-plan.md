# Chapturs Overhaul — Execution Plan

> **Date:** 2026-06-06
> **Based on:** Codex audit (2026-06-04) + May 2026 cleanup state + current codebase audit
> **Approach:** Strangler rebuild — keep data model / auth / APIs, rebuild UI surface incrementally

---

## Current State (Reconciled)

Codex's analysis was directionally correct but read the repo at a snapshot that didn't account for the May 2026 cleanup. Here's what's actually true now:

| Codex Claim | Current Reality |
|---|---|
| "Build safety bought by ignoring errors" | **Still true.** 45 type errors remain (down from ~87). `ignoreDuringBuilds: true` in next.config.js. |
| "UI has too many one-off styling decisions" | **True.** DESIGN.md exists (371 lines, thorough) but is a spec doc — not enforced in code. Tailwind config is bare (only `background`/`foreground` CSS vars). |
| "Client-heavy homepage" | **True.** `src/app/page.tsx` is 136 lines of `'use client'` — no server rendering at all. |
| "FeedCard doing too much" | **True.** 426 lines. Per-card subscription check still fires on every card. |
| "Navigation mixes SPA with full reloads" | **True.** 11 instances of `window.location.href` across Sidebar (6), editor (4), chapter page (1). |
| "Data/ops docs conflict" | **Partially fixed.** Skill file documents Supabase as canonical. Some PlanetScale refs may linger in older docs. |
| "Secrets hygiene" | **Still a concern.** Skill file documents the issue. Rotating is pre-launch priority. |
| "Product surface is huge" | **True but intentional.** Most advanced systems (Living World, achievements, collaborative editor) are already built and working. The problem is polish, not scope. |

### What Codex Missed

- **May 2026 cleanup was real.** 55 type errors fixed, auth unified (101 routes → `@/auth`), PrismaClient deduplicated (4→1), chapter page partially split, 60 debug `console.log` calls stripped, comment system unified.
- **DESIGN.md is a full design system spec.** Colors, typography, spacing, elevation, component specs, do's/don'ts. It just isn't connected to the code yet.
- **Feed back-navigation already has a snapshot cache.** `src/lib/feedCache.ts` — instant restore on back-nav. Not mentioned by Codex.
- **Most TASKS.md items are DONE.** 307 tasks tracked, heavy completion rate on phases 3-5. The skeleton is built.

### Codebase Numbers

- 517 source files, 160 components
- 45 remaining type errors (non-test, non-module-resolution)
- 11 `window.location.href` instances
- 1 bare Tailwind config

---

## The Strategy

**Strangler rebuild:** Create new UI surfaces alongside existing ones in the same Next.js project. Migrate one user journey at a time. Keep all existing routes functional until their replacement is live and verified.

**Why not a separate project:** The data model, auth, and API contracts are sound. A separate project means duplicating auth, Prisma, types, and 100+ API routes. That's months of work for zero product gain.

**What changes vs what stays:**

| Stays (don't touch) | Rebuilt (new UI) |
|---|---|
| Prisma schema (50 models) | App shell (layout, sidebar, nav) |
| Auth (NextAuth v5, Google OAuth) | Homepage / feed |
| 100+ API routes | Story cards + feed |
| Stripe integration | Creator dashboard |
| Translation system | Reading surface |
| Living World / Lore | Design system (tokens → components) |
| Achievements | Navigation (SPA links) |
| Gutenberg import pipeline | Creator editor shell |
| Recommendation engine | All page layouts |

---

## Phase 0: Foundation (Week 1-2)

**Goal:** Make the codebase safe to refactor. You can't rebuild a house while the foundation is on fire.

### Task 0.1: Kill `ignoreDuringBuilds`
**Files:** `next.config.js:7-16`
**What:** Remove `eslint.ignoreDuringBuilds` and `typescript.ignoreBuildErrors`. Fix remaining 45 type errors.
**Why:** Refactoring without type safety is gambling. Every component we touch in later phases needs to compile clean.
**Risk:** Medium. Some errors may be in code we're deleting anyway.
**Mitigation:** Fix only errors in code we're keeping. For code we're deleting in later phases, `@ts-expect-error` with a comment referencing the phase that removes it.
**Estimated:** 2-3 focused sessions.

### Task 0.2: Design Tokens in Tailwind Config
**Files:** `tailwind.config.js`, `src/app/globals.css`
**What:** Transform DESIGN.md spec into actual Tailwind tokens. Replace bare `background`/`foreground` CSS vars with a full token layer.
```js
// tailwind.config.js — target state
theme: {
  extend: {
    colors: {
      // Brand
      primary: { DEFAULT: '#2563EB', dark: '#1D4ED8' },
      secondary: { DEFAULT: '#7C3AED', dark: '#6D28D9' },
      // Surface
      surface: { DEFAULT: '#FFFFFF', dark: '#1F2937' },
      background: { DEFAULT: '#FFFFFF', dark: '#111827' },
      // Text
      'on-surface': { DEFAULT: '#111827', muted: '#4B5563', subtle: '#9CA3AF' },
      // Semantic
      success: '#10B981',
      warning: '#F59E0B',
      danger: '#EF4444',
      // Hero gradient stops
      hero: { from: '#1E3A8A', via: '#312E81', to: '#4C1D95' },
    },
    fontFamily: { sans: ['Inter Variable', 'Inter', 'sans-serif'] },
    borderRadius: { sm: '4px', md: '8px', lg: '12px', xl: '16px', '2xl': '20px' },
    spacing: { xs: '4px', sm: '8px', md: '16px', lg: '24px', xl: '32px', '2xl': '40px' },
  }
}
```
**Why:** Every component built in later phases uses these tokens. Without them, we're just shifting inline classes around.
**Estimated:** 1 session.

### Task 0.3: Design System Components
**Files:** New `src/components/ui/` directory
**What:** Build the primitives from DESIGN.md as actual components. Each one enforces the spec — no more inline class rediscovery.
```
src/components/ui/
├── Button.tsx           (primary gradient, simple, ghost variants)
├── Card.tsx             (shadow-sm border, hover:shadow-lg lift)
├── Badge.tsx            (genre, status, discovery variants)
├── StoryCover.tsx       (cover art with aspect ratio, fallback)
├── EmptyState.tsx       (icon + message + optional CTA)
├── Skeleton.tsx         (pulse animation, configurable shape)
├── HeroBanner.tsx       (gradient bg, white text, stat pills)
└── index.ts             (barrel export)
```
**Why:** Codex flagged "every page has to rediscover the design language." These components are the fix.
**Estimated:** 2 sessions.

### Task 0.4: Fix Navigation — Kill `window.location.href`
**Files:** `src/components/Sidebar.tsx`, `src/app/story/[id]/chapter/[chapterId]/page.tsx`, `src/app/creator/editor/page.tsx`
**What:** Replace all 11 `window.location.href` instances with `router.push()` or `<Link>`.
**Pattern:**
```tsx
// Before
window.location.href = '/creator/dashboard'

// After
import { useRouter } from 'next/navigation'
const router = useRouter()
router.push('/creator/dashboard')
```
**Sidebar hub switching** — currently uses `window.location.href` for all 6 hub changes. Replace with `router.push()` and route-aware active states.
**Why:** Full page reloads break the SPA feel. Back-navigation should be instant (already cached via feedCache).
**Estimated:** 1 session.

### Task 0.5: Security Hygiene
**What:** Rotate any secrets that may have appeared in docs/summaries. The skill file flags `docs/summaries/bugs-fixes.md` as containing real secrets. Audit and redact.
**Why:** Pre-launch urgency. Codex flagged this correctly.
**Estimated:** 30 minutes.

### Phase 0 Deliverable
- `npx tsc --noEmit` returns 0 errors (or only `@ts-expect-error` with phase references)
- `next build` succeeds without `ignoreDuringBuilds`
- DESIGN.md tokens live in Tailwind config
- `src/components/ui/` contains Button, Card, Badge, StoryCover, EmptyState, Skeleton, HeroBanner
- Zero `window.location.href` in app code
- Secrets rotated, sensitive docs redacted

---

## Phase 1: Reader Experience (Week 2-3)

**Goal:** The reader journey (discover → open → read → bookmark/subscribe) feels premium, fast, and calm.

### Task 1.1: Server-Render the Homepage
**Files:** `src/app/page.tsx` (rewrite), new `src/components/ServerFeed.tsx`
**What:** Split the 136-line client component into server + client:
```
src/app/page.tsx              → Server Component (async, fetches initial data)
src/components/ServerFeed.tsx → Server-renders first 20 feed items
src/components/FeedClient.tsx → Client island for pagination, actions, impressions
```
**Pattern:**
```tsx
// page.tsx (Server Component — no 'use client')
export default async function HomePage() {
  const session = await auth()
  const initialFeed = await getFeedItems('reader', session?.user?.id, 1)
  const newAndPromising = await getNewAndPromising()

  return (
    <AppLayout>
      {!session && <HeroBanner />}
      {session && <BetaWelcome />}
      <NewAndPromisingSection works={newAndPromising} />
      <FeedClient initialItems={initialFeed} userId={session?.user?.id} />
    </AppLayout>
  )
}
```
**Why:** Codex's #1 technical critique. First paint should be meaningful content, not a loading spinner waiting on client-side auth + fetch + effects.
**Estimated:** 2 sessions.

### Task 1.2: Split FeedCard
**Files:** `src/components/FeedCard.tsx` → split into 3 files
**What:**
```
src/components/FeedCard.tsx          → Delete (426 lines)
src/components/StoryCard.tsx         → Pure presentational (cover, title, badges, metadata)
src/components/StoryCardActions.tsx  → Client island (bookmark, like, subscribe, report)
src/hooks/useStoryCardActions.ts     → Optimistic mutations
```
**Why:** 426-line god component with per-card subscription checks. Split lets the presentational card be server-rendered while only actions hydrate on the client.
**Subscription fix:** Move the per-card `DataService.checkUserSubscription()` call out of FeedCard. The feed API should include `isSubscribed: boolean` in its response (batch query on the server). This eliminates N+1 subscription checks.
**Estimated:** 1-2 sessions.

### Task 1.3: Rebuild Story Cards with Cover Art
**Files:** `src/components/StoryCard.tsx` (new), `src/components/StoryCover.tsx` (from Phase 0)
**What:** Cards that actually look like a reading platform:
- Cover art dominant (not buried in a corner)
- Title in `h3` weight per DESIGN.md
- Author + chapter count in muted `body-sm`
- Genre badges in semantic colors
- Hover: shadow-lg + translate-y-1 per DESIGN.md
- Skeleton state while image loads
**Why:** The current FeedCard layout is dense and functional but doesn't feel like a reading product. DESIGN.md has the spec — we're implementing it.
**Estimated:** 1 session.

### Task 1.4: Rebuild the Reading Surface
**Files:** `src/app/story/[id]/chapter/[chapterId]/page.tsx` (refactor, not rewrite)
**What:** The chapter page is 2,268 lines and partially extracted. Continue the split:
- Extract reading controls into `ChapterToolbar.tsx` (font, theme, line-height — already in `ChapterReaderSettings`)
- Extract chapter navigation into `ChapterNav.tsx` (prev/next, chapter list)
- Extract social actions into `ChapterActions.tsx` (bookmark, like, share, report)
- Keep the reader renderer intact (ChapterBlockRenderer → ProseBlock → HtmlWithHighlights chain)
**Typography:** Enforce DESIGN.md reading specs — `max-w-2xl`, body-lg (1.125rem), line-height 1.7-1.8.
**Why:** The reading experience is the product. This page should feel like a well-designed e-reader, not a web app.
**Estimated:** 2 sessions.

### Phase 1 Deliverable
- Homepage server-renders initial content (no loading spinner on first paint)
- StoryCard is presentational + StoryCardActions is a client island
- Zero per-card subscription fetches (batched in feed API)
- Chapter page is split into focused components
- Reading surface follows DESIGN.md typography specs

---

## Phase 2: Creator Experience (Week 3-4)

**Goal:** Creator dashboard feels like an operational surface, not an afterthought.

### Task 2.1: Rebuild Creator Dashboard
**Files:** `src/app/creator/dashboard/page.tsx` (rewrite)
**What:** Server-render the dashboard shell with stats, recent works, and quick actions. Client islands for interactive parts.
**Layout:** Sidebar + main content per DESIGN.md creator hub spec. Denser information layout with tables and stat blocks.
**Estimated:** 2 sessions.

### Task 2.2: Works Management Polish
**Files:** `src/app/creator/works/` directory
**What:** Clean up the works list:
- Status badges using `ui/Badge` from Phase 0
- Chapter counts, last updated, view counts in a table layout
- Quick actions (edit, publish, view) as icon buttons
- Empty state using `ui/EmptyState`
**Estimated:** 1 session.

### Task 2.3: Editor Shell Redesign
**Files:** `src/app/creator/editor/page.tsx` (refactor shell, keep Tiptap)
**What:** Redesign the editor chrome (toolbar, save/publish flow, sidebar) while keeping the Tiptap editor intact. Fix the 4 `window.location.href` instances (should already be done in Phase 0.4).
**Save/Publish flow:** Clear state indicators — "Draft • Last saved 2m ago" vs "Published • 3 chapters". Publish button distinct from save.
**Estimated:** 1-2 sessions.

### Phase 2 Deliverable
- Creator dashboard loads with meaningful content (no client-side fetch waterfall)
- Works management is a clean table with status badges
- Editor shell feels intentional, not bolted on
- Creator hub navigation is SPA-smooth

### Phase 2 — Implementation Results (June 2026)

**Commit checkpoints:** `fc1a823` (2.1), `df48927` (2.2), `113dd6e` (2.3).

| Task | Status | Key Changes |
|------|--------|-------------|
| **2.1** Dashboard | ✅ | `page.tsx` → async server component with `auth()`. Stats prefetched via Prisma on server — no client-side fetch waterfall. `CreatorDashboardNew` accepts `initialStats`/`userName`/`isAuthenticated` as props instead of using `useUser()` + `useEffect()`. Unauthenticated and no-author-profile states rendered server-side. All skeletons use `ui/Skeleton`, empty states use `ui/EmptyState`, badges use `ui/Badge`. Single `console.error` stripped. |
| **2.2** Works management | ✅ | Switched from 2-column card grid to compact table/list layout. Each row: cover thumbnail, title+genre, `ui/Badge` status, chapter count, likes, icon-only action buttons. `page.tsx` → async server component, passes auth to `StoryManagement` via props. All 8 `console.log` calls stripped. `ui/EmptyState` for empty, `ui/Skeleton` for loading. Dead `CreatorDashboard.tsx` removed. |
| **2.3** Editor shell | ✅ | 79 `console.log`/`console.error` calls stripped (file: 1,193 → 1,108 lines). Inline DRAFT badge replaced with `<Badge variant="warning">`. Main container: `bg-gray-900` → `bg-white dark:bg-gray-900` (now respects light mode). |
| **2.3 (deferred)** | ⏸️ | Component extraction (EditorHeader, StartPicker, SettingsModal) deferred — header is tightly coupled to 15+ state variables. File is sufficiently clean for now. Will extract during Phase 3 polish pass. |

---

## Phase 3: Advanced Systems Integration (Week 4-5)

**Goal:** The advanced systems already exist. Make them feel like coherent product surfaces rather than isolated pages.

### Task 3.1: Comments & Moderation Surface
**Files:** Story page comment section, admin moderation queue
**What:** The comment system was unified in May 2026 (BlockComment → Comment). Polish the UI:
- Threaded comments with proper indentation
- Like/reply/report actions as icon buttons
- Moderation actions (hide, delete, warn) with confirmation
**Estimated:** 1 session.

### Task 3.2: Character & Glossary Integration
**Files:** `src/components/GlossarySystem.tsx`, story page, character profiles
**What:** Already partially fixed (glossary aliases, CSS, API). Remaining:
- Make character profiles discoverable from the reader (tooltip → full profile link)
- Glossary term highlighting should use aliases (source fix per skill pitfall #18)
- Link glossary terms to their definition pages
**Estimated:** 1 session.

### Task 3.3: Living World Surfaces
**Files:** World pages, lore index, timeline
**What:** These exist (Phase 5 mostly done). Polish:
- World Atlas page — better story card grid
- Lore Index — better search and filtering
- Timeline — better visual design
**Estimated:** 1 session.

### Task 3.4: Loading States & Skeletons
**Files:** All pages missing skeletons (TASKS.md #75)
**What:** Every page that fetches data should show a skeleton, not a blank screen or spinner. Use `ui/Skeleton` from Phase 0.
**Audit:** Identify pages with no loading state. Add skeletons.
**Estimated:** 1 session.

### Phase 3 Deliverable
- Comments feel like a modern discussion system
- Glossary/character integration is seamless in the reader
- Living World pages are polished product surfaces
- Every page has a loading skeleton

---

## What We're NOT Doing (Yet)

These are explicitly deferred:

- **Real-time co-editing (WebSocket)** — Phase 3 tasks #42-43. Complex infrastructure. Post-launch.
- **Version history** — Phase 3 task #41. Post-launch.
- **AI Author Bots (Phase 6)** — Spec exists, zero implementation. Post-launch cold-start solution.
- **Web push notifications** — Task #29. Nice-to-have.
- **Vector-indexed lore store (pgvector)** — Task #54. Postgres LIKE fallback works.
- **Translator Profile hub** — Task #94. Schema exists, needs UI.
- **Complete rewrite** — Not happening. The data model and backend are fine.

---

## Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Server-rendering breaks auth-dependent UI | Medium | High | Keep client islands for auth-gated actions. Server-render only what's safe for unauthenticated visitors. |
| Design token migration breaks existing pages | Low | Medium | Add tokens alongside existing classes. Migrate incrementally — don't find-and-replace. |
| Removing `ignoreDuringBuilds` reveals cascading errors | Medium | Medium | Fix incrementally. `@ts-expect-error` with phase references for deferred fixes. |
| Feed API changes break InfiniteFeed | Low | High | Keep existing API contract. Add fields (`isSubscribed`) don't remove existing ones. |
| Splitting FeedCard loses recommendation tracking | Low | Medium | `useStoryCardActions` hook preserves all tracking logic. Test with Playwright smoke suite. |

---

## Success Metrics

After Phase 2, these should be measurably better:

1. **First paint** — homepage shows content in <1s (vs current client-side fetch waterfall)
2. **Navigation feel** — back-navigation is instant (already cached, now SPA-smooth)
3. **Type safety** — `npx tsc --noEmit` returns 0 errors
4. **Bundle size** — no net increase (server components reduce client JS)
5. **Design consistency** — no hardcoded hex values outside `tailwind.config.js` and `ui/` components
6. **Lighthouse** — Performance >90, Best Practices >90 (currently unknown)

---

## Execution Order

```
Phase 0 (Foundation)
  ├── 0.1: Kill ignoreDuringBuilds (fix 45 type errors)
  ├── 0.2: Design tokens in Tailwind config
  ├── 0.3: Design system components (ui/Button, ui/Card, etc.)
  ├── 0.4: Fix navigation (kill window.location.href)
  └── 0.5: Security hygiene (rotate secrets)

Phase 1 (Reader Experience)
  ├── 1.1: Server-render homepage
  ├── 1.2: Split FeedCard → StoryCard + StoryCardActions
  ├── 1.3: Rebuild story cards with cover art
  └── 1.4: Rebuild reading surface (chapter page split)

Phase 2 (Creator Experience)
  ├── 2.1: Rebuild creator dashboard
  ├── 2.2: Works management polish
  └── 2.3: Editor shell redesign

Phase 3 (Advanced Systems)
  ├── 3.1: Comments & moderation surface
  ├── 3.2: Character & glossary integration
  ├── 3.3: Living World surfaces
  └── 3.4: Loading states & skeletons
```

Each phase is gated on the previous. Phase 0 is the hard prerequisite — nothing else should start until types are clean and tokens exist.

---

## Implementation Notes

- **Run `npm run dev` after every task.** Verify the page loads. Use Playwright smoke tests (`npm run test:e2e:mobile`) for regression.
- **Commit after each task.** `feat: add design tokens to Tailwind config`, `fix: replace window.location.href with router.push in Sidebar`, etc.
- **DESIGN.md is the source of truth.** If a component doesn't match DESIGN.md, it's a bug. If DESIGN.md is wrong, update it first, then the component.
- **Server Components by default.** Only add `'use client'` when you need interactivity (state, effects, event handlers, browser APIs).
- **Don't delete old code until the replacement is live.** Strangler pattern — old and new coexist. Remove old only after verifying the new path works in production.
