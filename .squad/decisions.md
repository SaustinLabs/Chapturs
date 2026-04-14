# Squad Decisions

## Active Decisions

### 2026-04-14: Stack & Deployment
**Decision:** Chapturs is a Next.js 15 App Router app deployed to a VPS (NOT Vercel) via GitHub Actions. Supabase PostgreSQL is the database. All secrets live in GitHub Secrets and are written to `.env.production` on the VPS at deploy time.
**Rationale:** VPS gives full control over the runtime and avoids Vercel edge limitations.
**Applies to:** All agents — never suggest Vercel deployment or Vercel env vars.

### 2026-04-14: LLM Provider
**Decision:** All LLM calls use **OpenRouter** (`OPENROUTER_API_KEY`), OpenAI-compatible SDK, base URL `https://openrouter.ai/api/v1`. Always add headers `{ 'HTTP-Referer': 'https://chapturs.com', 'X-Title': 'Chapturs' }`. Quality assessment model: `meta-llama/llama-3.3-70b-instruct`. Quick tasks: `meta-llama/llama-3.1-8b-instruct`.
**Rule:** Never add `groq-sdk` as a dependency. Never call Groq directly.

### 2026-04-14: Image Storage
**Decision:** All images/covers use Cloudflare R2 via `src/lib/r2.ts`. Proxy via `/api/proxy-image` for base64 fallback. Remote patterns are configured in `next.config.js`.
**Rule:** Use `<Image />` from Next.js with configured `remotePatterns`. Never store images in `public/`.

### 2026-04-14: Auth Strategy
**Decision:** NextAuth v5 with JWT strategy (`auth.ts` for Node.js, `src/auth-edge.ts` for middleware). OAuth providers: Google, GitHub, Discord. Admin guarded at BOTH middleware AND server layout (`src/app/admin/layout.tsx`) for defence-in-depth.
**Rule:** Never remove the double guard. Never use database sessions.

### 2026-04-14: Email (Resend)
**Decision:** Email uses direct Resend HTTP API in `src/lib/email.ts` — no npm package. All email calls are fire-and-forget (`.catch(() => {})`). FROM address is an env var.
**Rule:** Never install resend npm package. Never block requests on email sending.

### 2026-04-14: Quality Assessment
**Decision:** LLM quality assessment runs on FIRST CHAPTER ONLY for new users. Cumulative review at milestones 5/10/20/50 chapters. Validation calls go through `/api/quality-assessment/`.
**Rule:** Do not apply QA to every chapter — only first chapter + milestones.

### 2026-04-14: Task Tracking
**Decision:** `TASKS.md` in the repo root is the single source of truth. When a feature ships, mark it ✅ in TASKS.md and update `src/app/about/roadmap/page.tsx` + `src/app/features/page.tsx` in the same commit.
**Rule:** Always check TASKS.md before building a feature. Always update it after shipping.

### 2026-04-14: Site Settings
**Decision:** Runtime configuration lives in the `SiteSettings` Prisma table — admin-editable without redeploy. Groups: general, content, features, monetization, email.
**Rule:** Use SiteSettings for any value that ops might want to tune without a deploy.

### 2026-04-14: Monetization (Stripe)
**Decision:** Stripe integration exists but `premium_enabled` is currently false. Keys are set in secrets. Do not enable without complete end-to-end test.
**Applies to:** Task #66 — flip flag only after staging test.

## Governance

- All meaningful changes require team consensus
- Document architectural decisions here
- Keep history focused on work, decisions focused on direction
- TASKS.md is the master task list — always check before building
