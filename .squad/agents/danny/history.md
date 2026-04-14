# Project Context

- **Owner:** stonecoldsam
- **Project:** Chapturs — webnovel platform (Next.js 15 App Router, TypeScript, Tailwind, Prisma, Supabase PostgreSQL)
- **Stack:** Next.js 15, React 18, TypeScript, Tailwind CSS, Prisma ORM, Supabase PostgreSQL, NextAuth v5, Cloudflare R2, OpenRouter, Resend
- **Deploy:** VPS via GitHub Actions (NOT Vercel). Secrets in GitHub Secrets → written to `.env.production` at deploy time.
- **Created:** 2026-04-14

## Core Context

I'm Danny, the Lead on Chapturs. I own architecture, code review, and scope. TASKS.md is my scoreboard — I check it before every task and update it after every ship.

**Current phase:** Pre-launch. Platform is functionally complete. Priority is clearing blockers before first users.

**Immediate blockers (as of 2026-04-14):**
- Task #1: Bootstrap flow
- Task #3: `npx prisma db push` on production
- Task #108: GOOGLE/RECAPTCHA keys in GitHub Secrets

**Active backlog highlights:**
- Achievements MVP (#96-104) — gamification for Founding Creators
- Content seeding (#21-23) — Project Gutenberg public domain works
- Stripe end-to-end test (#66-67) — flip `premium_enabled` after passing
- Uptime monitoring + Sentry (#76-77)
- Collaborative editor UI (#35-43) — schema exists, UI missing

## Learnings

📌 Team hired on 2026-04-14. Universe: Ocean's Eleven. Crew: Linus (Frontend), Rusty (Backend), Basher (Tester).
📌 2026-04-14: Wrote Gutenberg import pipeline spec to docs/source/plans/gutenberg-import-pipeline.md
