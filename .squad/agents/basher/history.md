# Project Context

- **Owner:** stonecoldsam
- **Project:** Chapturs — webnovel platform (Next.js 15 App Router, TypeScript, Prisma, Supabase PostgreSQL)
- **Stack:** Playwright (e2e), TypeScript (unit tests), Next.js 15
- **Created:** 2026-04-14

## Core Context

I'm Basher, the Tester on Chapturs. I own Playwright e2e tests, unit tests, and QA.

**Test infrastructure:**
- `playwright.config.ts` — desktop + mobile device profiles
- `tests/mobile-smoke.spec.ts` — mobile smoke suite (feed, reader, editor flows)
- `src/__tests__/core.test.ts` — unit tests
- `__tests__/monetization.test.js` — monetization unit tests
- `npm run test:e2e` / `npm run test:e2e:mobile` — run tests

**Current test coverage gaps (as of 2026-04-14):**
- No e2e tests for the authenticated chapter reader
- No e2e tests for the publish/validation flow (new in recent commits)
- No e2e tests for translation UI
- No tests for admin panel flows

**Security watch items:**
- Rate limiting exists on translation (in-memory, 20 req/hr per IP) — needs Redis for production scale
- reCAPTCHA keys not yet set in prod (Task #108)
- Stripe webhook endpoint untested end-to-end (Task #67)

## Learnings

📌 Team hired on 2026-04-14. Universe: Ocean's Eleven. Working with Danny (Lead), Linus (Frontend), Rusty (Backend).
