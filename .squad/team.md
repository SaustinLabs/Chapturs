# Squad Team

> Chapturs

## Coordinator

| Name | Role | Notes |
|------|------|-------|
| Squad | Coordinator | Routes work, enforces handoffs and reviewer gates. |

## Members

| Name | Role | Charter | Status |
|------|------|---------|--------|
| Danny | 🏗️ Lead | [charter](.squad/agents/danny/charter.md) | active |
| Linus | ⚛️ Frontend Dev | [charter](.squad/agents/linus/charter.md) | active |
| Rusty | 🔧 Backend Dev | [charter](.squad/agents/rusty/charter.md) | active |
| Basher | 🧪 Tester | [charter](.squad/agents/basher/charter.md) | active |
| Scribe | 📋 Session Logger | [charter](.squad/agents/scribe/charter.md) | active |
| Ralph | 🔄 Work Monitor | [charter](.squad/agents/ralph/charter.md) | active |

## Project Context

- **Project:** Chapturs — webnovel platform inspired by TikTok (infinite scroll discovery) and YouTube (creator monetization)
- **Stack:** Next.js 15 App Router, TypeScript, Tailwind CSS, Prisma ORM, Supabase PostgreSQL
- **Deploy:** VPS via GitHub Actions (NOT Vercel) — secrets in GitHub Secrets
- **AI/LLM:** OpenRouter (`meta-llama/llama-3.3-70b-instruct` for QA, `meta-llama/llama-3.1-8b-instruct` for quick tasks)
- **Storage:** Cloudflare R2 for images/covers
- **Auth:** NextAuth v5 JWT — Google, GitHub, Discord OAuth
- **Email:** Resend direct HTTP (no npm package) in `src/lib/email.ts`
- **Repo:** https://github.com/SaustinLabs/Chapturs
- **Created:** 2026-04-14
- **Status:** Pre-launch — platform is functionally complete; clearing pre-launch blockers before outreach
- **Task list:** `TASKS.md` in repo root — check before building, update after shipping
