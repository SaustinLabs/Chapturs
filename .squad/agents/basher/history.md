2026-04-14: Wrote comprehensive suggestion test suite (6 files, 40+ cases)
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

### Achievements system — 2026-04-14

**Test coverage gaps discovered:**
- `AchievementsBlock` and `FeaturedAchievements` components existed with no Playwright or unit test coverage.
- `checkAndAwardFoundingCreator` has a race-condition footgun at the 100-chapter boundary — no transaction wrapping. Filed in security inbox.
- `/api/achievements/[userId]/featured` PATCH endpoint (cap enforcement) is not yet implemented — client-side cap only. Flagged as server must enforce.
- `AchievementBadge` tier-ring CSS classes (`ring-amber-600`, `ring-yellow-400`, etc.) are the most stable selector targets for e2e badge tier assertions — prefer over text content.

**Patterns for writing tests against parallel implementations:**
- Use `Object.values(EXPORTED_CONST)[0]` to avoid hardcoding enum values when the exact key names are unknown.
- Mock the PrismaService singleton (`src/lib/database/PrismaService`) rather than `@prisma/client` directly — the project uses a singleton proxy wrapper.
- `jest.mock` factory is hoisted; access mock functions via `require()` after import statements resolve, using `prisma.model.fn.mockResolvedValue(...)`.
- Test behavioral contracts (what the function must do), not internal Prisma call shapes — except for idempotency assertions where the `.create` call count IS the contract.
- For Playwright on this project: always mock both `/api/profile/[username]` AND the feature's own API, because the profile page resolves `userId` from the profile API before the feature component can fetch its data.
