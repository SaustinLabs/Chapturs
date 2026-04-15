2026-04-14: Built EditSuggestionsPanel + integrated into Creator Hub
# Project Context

- **Owner:** stonecoldsam
- **Project:** Chapturs — webnovel platform (Next.js 15 App Router, TypeScript, Tailwind, Prisma, Supabase PostgreSQL)
- **Stack:** React 18, Next.js 15, TypeScript, Tailwind CSS, TipTap (rich text), Cloudflare R2 (images)
- **Created:** 2026-04-14

## Core Context

I'm Linus, the Frontend Dev on Chapturs. I own the reader/creator UI, all React components, and the TipTap editor.

**Key patterns I follow:**
- Server components for data, client components for interactivity only
- Mobile-first responsive Tailwind — no separate mobile code paths
- `resolveCoverSrc()` for all cover art — never read the DB column directly (may be base64)
- Next.js `<Image />` with `remotePatterns` — never raw `<img>` for remote URLs
- `src/lib/feedCache.ts` for feed scroll restoration

**Key files I work in:**
- `src/components/` — all shared components
- `src/app/story/` — reader hub
- `src/app/creator/` — creator hub
- `src/app/browse/`, `src/app/trending/`, `src/app/onboarding/`

## Learnings

📌 Team hired on 2026-04-14. Universe: Ocean's Eleven. Working with Danny (Lead), Rusty (Backend), Basher (Tester).

### 2026-04-14 — Achievement UI (Tasks #98, #99)

**Profile page architecture:**
- `src/app/profile/[username]/page.tsx` is a `'use client'` page (not server component) — fetches via `useEffect` + `/api/profile/[username]`. `isOwner` is derived by comparing session user ID/name against the fetched `user.id`/`user.username`.
- Profile renders: `ProfileLayout` (sidebar / featured / blocks 3-col grid) → then separate full-width sections below it. `AchievementsBlock` slots in as a full-width section below `ProfileLayout`, above the extra works list.
- `src/components/profile/` has: `ProfileLayout`, `ProfileSidebar`, `FeaturedSpace`, `BlockGrid`, `blocks/`, `config/`, `editor/`.

**Component patterns seen in the codebase:**
- Client components use `'use client'` at the top — no hybrid approaches.
- Heroicons (`@heroicons/react/24/solid` and `/24/outline`) are the icon library.
- Tailwind dark-mode: `bg-gray-800/50 border border-gray-700 rounded-xl` is the standard card style. Gray-900 is base background.
- CSS-only tooltips using `group`/`group-hover:opacity-100` work cleanly without useState for simple hover effects.
- Optimistic updates + fetch-then-revert-on-failure is the preferred pattern for toggle interactions.

**API stubs left for Rusty:**
- `PATCH /api/achievements/[userId]/featured` — body: `{ achievementId, isFeatured }`
- `PATCH /api/achievements/[userId]/visibility` — body: `{ visible }`
