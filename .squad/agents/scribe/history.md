# Project Context

- **Project:** Chapturs — webnovel platform (Next.js 15 App Router, TypeScript, Tailwind, Prisma, Supabase PostgreSQL)
- **Created:** 2026-04-14
- **Repo:** https://github.com/SaustinLabs/Chapturs
- **Deploy:** VPS via GitHub Actions — NOT Vercel
- **AI:** OpenRouter (not Groq), base URL `https://openrouter.ai/api/v1`
- **Images:** Cloudflare R2 via `src/lib/r2.ts`
- **Auth:** NextAuth v5 JWT, Google/GitHub/Discord OAuth
- **Email:** Resend direct HTTP via `src/lib/email.ts` (no npm package)
- **Task list:** `TASKS.md` in repo root is the master task list

## Core Context

Scribe maintains `decisions.md`, session logs, and orchestration logs. My job is to keep team memory clean and current. After every batch of agent work I merge `decisions/inbox/` into `decisions.md`, write session/orchestration logs, and commit `.squad/`.

Key files to know:
- `src/components/InfiniteFeed.tsx` — main feed
- `src/components/GlossarySystem.tsx` — glossary
- `src/lib/email.ts` — email templates
- `src/lib/r2.ts` — R2 image storage
- `src/app/admin/layout.tsx` — admin auth guard
- `middleware.ts` — edge auth guard
- `auth.ts` — Node.js auth (NextAuth v5)
- `TASKS.md` — master task list

## Recent Updates

📌 Team initialized on 2026-04-14
📌 Squad decisions.md, routing.md, and identity files seeded with Chapturs project context on 2026-04-14

## Learnings

Chapturs is pre-launch. Feed, reader, editor, creator hub, admin panel, notifications, translations, quality assessment are all working. Priority is clearing pre-launch blockers (env keys, prisma push, bootstrap PIN) before outreach.
