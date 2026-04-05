# Chapturs — AI Coding Agent Instructions

## Project Overview
Chapturs is a modern webnovel platform inspired by TikTok (infinite scroll discovery) and YouTube (creator monetization). It features dual Reader/Creator hubs, dynamic glossary, analytics, and advanced content management.

## Task Tracking — Source of Truth
**`TASKS.md` in the repo root is the master task list.**
- Before starting any feature or fix, check `TASKS.md` — if the work is listed, confirm the task number and context.
- When a task is completed, mark it done in `TASKS.md` by changing `⬜` to `✅` and moving it to the ✅ Done section at the bottom.
- When implementing a new feature the user asks for that isn't in `TASKS.md`, add it first, then build it.
- When a task is partially done, use 🔶 and add a short note.
- Always commit `TASKS.md` changes in the same commit as the work.

## Architecture & Data Flow
- **Frontend:** Next.js App Router (15.x), React 18, TypeScript, Tailwind CSS. Uses server and client components.
- **Backend:** Next.js API routes (in `src/app/api/`), Prisma ORM with Supabase PostgreSQL.
- **Key Flows:** 
  - Reader Hub: Infinite scroll feed, search, reading history, bookmarks.
  - Creator Hub: Upload, analytics, glossary, revenue.
  - Quality Assessment: Content is validated and queued for review via `/api/quality-assessment/`.
  - File Uploads: Images/Covers use Cloudflare R2 (see `src/lib/r2.ts`), with proxy endpoints for base64 fallback.
- **State:** Auth via NextAuth v5 (JWT strategy), user/author profiles, works/sections/chapters, analytics.
- **Admin:** Role-gated at both middleware (`middleware.ts`) and server layout (`src/app/admin/layout.tsx`). Bootstrap via `/admin/bootstrap` PIN flow.

## Developer Workflows
- **Install:** `npm install`
- **Dev server:** `npm run dev`
- **Build:** `npm run build`
- **Lint:** `npm run lint`
- **Prisma:** `npx prisma generate`, `npx prisma db push`
- **Seed DB:** `npm run db:seed`
- **Deploy:** Push to `main` triggers auto-deploy via GitHub Actions (`.github/workflows/deploy-vps.yml`) to a VPS. All secrets are stored in GitHub Actions Secrets and written to `.env.production` on the VPS each deploy. **Not Vercel — VPS only.**
- **Env:** Copy `.env.example` to `.env.local` for local dev. Never commit real secrets.

## LLM / AI Integration
- **Provider: OpenRouter** (NOT Groq directly). All LLM calls use `OPENROUTER_API_KEY`, OpenAI-compatible SDK, base URL `https://openrouter.ai/api/v1`.
- Always add headers: `{ 'HTTP-Referer': 'https://chapturs.com', 'X-Title': 'Chapturs' }`.
- Quality assessment model: `meta-llama/llama-3.3-70b-instruct`. Quick tasks: `meta-llama/llama-3.1-8b-instruct`.
- **Never add groq-sdk as a new dependency.**
- Quality assessment is gated to FIRST CHAPTER ONLY. Cumulative review triggers at milestones 5/10/20/50 chapters.

## Email (Resend)
- Direct HTTP API in `src/lib/email.ts` — no npm package. Reads `RESEND_API_KEY` + `EMAIL_FROM`.
- Templates: `notifyNewComment`, `notifyNewSubscriber`, `notifyNewChapter`, `sendWelcomeEmail`, `notifyChapterRejected`.
- All email calls are fire-and-forget (`.catch(() => {})`) — never block requests on email.
- FROM address must stay as env var (tied to Resend domain verification).
- Platform email addresses (hello@, support@, dmca@, etc.) are managed in Admin → Settings → Email Addresses (SiteSettings table, group: 'email').

## Project Conventions & Patterns
- **TypeScript everywhere:** Types in `/src/types/`.
- **Component structure:** All UI in `/src/components/`, grouped by feature.
- **API routes:** In `/src/app/api/`, grouped by resource.
- **Responsive design:** Tailwind responsive classes; no separate mobile code paths.
- **Image handling:** Next.js `<Image />` with remotePatterns in `next.config.js`. R2 proxy for base64 images.
- **Auth guard pattern:** Admin pages use BOTH middleware (`middleware.ts`, edge-compatible) AND server layout (`src/app/admin/layout.tsx`, Node.js) for defence-in-depth.
- **Site settings:** Runtime config in SiteSettings table — admin-editable without redeploy. Groups: general, content, features, monetization, email.
- **Error handling:** Next.js error boundaries + API error helpers in `/src/lib/api/errorHandling.ts`.
- **Mobile:** All design is responsive; do not create separate mobile code paths.

## Integration Points
- **Cloudflare R2:** Image storage. `src/lib/r2.ts`.
- **Cloudflare Email Routing:** Receiving inboxes (support@, dmca@, etc.) forwarded to personal email.
- **Supabase PostgreSQL:** Production DB.
- **OpenRouter:** LLM calls (quality assessment, future AI features).
- **Resend:** Outbound transactional email.
- **NextAuth v5:** Auth — Google, GitHub, Discord OAuth. JWT strategy.

## Key Files
- **Feed:** `src/components/InfiniteFeed.tsx`
- **Glossary:** `src/components/GlossarySystem.tsx`
- **Story/Work Management:** `src/components/StoryManagement.tsx`, `src/app/story/[id]/page.tsx`
- **Quality Assessment:** `src/lib/ContentValidationService.ts`, `src/app/api/quality-assessment/`, `src/lib/quality-assessment/`
- **Email:** `src/lib/email.ts`
- **Admin layout guard:** `src/app/admin/layout.tsx`
- **Middleware:** `middleware.ts` (edge, uses `src/auth-edge.ts`)
- **Auth (Node.js):** `auth.ts`
- **Deployment:** `.github/workflows/deploy-vps.yml`
- **Task list:** `TASKS.md`

## Special Notes
- **Do not commit secrets.** Always add new env files to `.gitignore`.
- **TASKS.md is the source of truth** — check it before building, update it after shipping.
- **`community_genres` cookie** is set by `/api/join/[slug]` but the feed algorithm does not yet read it — see TASKS.md item #17.
- **`viewCount` on Section model** is a TODO — see TASKS.md item #33.

