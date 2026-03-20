# Chapturs 窶・AI Coding Agent Instructions

## Project Overview
Chapturs is a modern webnovel platform inspired by TikTok (infinite scroll discovery) and YouTube (creator monetization). It features dual Reader/Creator hubs, dynamic glossary, analytics, and advanced content management.

## Architecture & Data Flow
- **Frontend:** Next.js App Router (15.x), React 18, TypeScript, Tailwind CSS. Uses server and client components.
- **Backend:** Next.js API routes (in `src/app/api/`), Prisma ORM with Supabase PostgreSQL.
- **Key Flows:** 
  - Reader Hub: Infinite scroll feed, search, reading history, bookmarks.
  - Creator Hub: Upload, analytics, glossary, revenue, bulk import.
  - Quality Assessment: Content is validated and queued for review via `/api/quality-assessment/`.
  - File Uploads: Images/Covers use Cloudflare R2 (see `src/lib/r2.ts`), with proxy endpoints for base64 fallback.
- **State:** Auth via NextAuth, user/author profiles, works/sections/chapters, analytics.

## Developer Workflows
- **Install:** `npm install`
- **Dev server:** `npm run dev`
- **Build:** `npm run build`
- **Lint:** `npm run lint`
- **Prisma:** `npx prisma generate`, `npx prisma db push`
- **Seed DB:** `npm run db:seed`
- **Deploy:** Push to `main` triggers Vercel deploy (see `docs/source/ops/VERCEL_DEPLOYMENT_GUIDE.md`)
- **Env:** Copy `.env.example` to `.env.local` and fill in secrets. Never commit real secrets.

## Project Conventions & Patterns
- **TypeScript everywhere:** All code and types in `/src/types/`.
- **Component structure:** All UI in `/src/components/`, grouped by feature (e.g., `GlossarySystem.tsx`, `StoryManagement.tsx`).
- **API routes:** In `/src/app/api/`, grouped by resource (e.g., `/works/`, `/quality-assessment/`).
- **Responsive design:** Use Tailwind's responsive classes; no separate mobile domain.
- **Image handling:** Use Next.js `<Image />` with remotePatterns in `next.config.js`. R2 proxy for base64 images.
- **Quality assessment:** Content validation and moderation in `ContentValidationService.ts` and related API routes.
- **Analytics:** Vercel Analytics and Speed Insights wired in `src/app/layout.tsx`.

## Integration Points
- **Cloudflare R2:** For image storage. See `src/lib/r2.ts` and related upload endpoints.
- **Supabase PostgreSQL:** For production DB. See `docs/source/ops/VERCEL_DEPLOYMENT_GUIDE.md` for setup.
- **Groq API:** For content quality assessment (see env vars and `/api/quality-assessment/`).
- **NextAuth:** For authentication (see `/src/app/api/auth/`).

## Examples & Key Files
- **Infinite Feed:** `src/components/InfiniteFeed.tsx`
- **Glossary:** `src/components/GlossarySystem.tsx`, `src/lib/images.ts`
- **Story/Work Management:** `src/components/StoryManagement.tsx`, `src/app/story/[id]/page.tsx`
- **API Example:** `src/app/api/works/publish/route.ts`
- **Quality Assessment:** `src/lib/ContentValidationService.ts`, `src/app/api/quality-assessment/`
- **Deployment:** `docs/source/ops/VERCEL_DEPLOYMENT_GUIDE.md`

## Special Notes
- **Do not commit secrets:** Always add new env files to `.gitignore`.
- **Legacy/experimental code:** Some features (e.g., bulk upload, advanced moderation) may have partial or legacy implementations.
- **Error handling:** Use Next.js error boundaries and API error helpers in `/src/lib/api/errorHandling.ts`.
- **Mobile:** All design is responsive; do not create separate mobile code paths.



