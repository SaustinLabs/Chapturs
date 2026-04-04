# Security Audit — Chapturs Platform

**Date:** 2026-04-04  
**Commit:** `4ba1bbb`  
**Scope:** Full production-grade audit — authentication, authorisation, XSS, input validation, security headers, secrets exposure, cron auth  
**Status:** All HIGH and MEDIUM priority findings resolved and deployed ✅

---

## Summary

| Severity | Count | Fixed |
|----------|-------|-------|
| HIGH | 2 | 2 ✅ |
| MEDIUM | 5 | 5 ✅ |
| LOW | 2 | 2 ✅ |
| INFO | 3 | — |

---

## HIGH Priority (Resolved)

### H-1: Broken Admin Role Check — Reports Open to All Authenticated Users
- **File:** `src/app/api/admin/reports/route.ts`
- **Root Cause:** Guard was `role === 'user'` which evaluated to `false` for `undefined` (role was never populated in the JWT). This meant any authenticated user could access the admin reports endpoint.
- **Additionally:** `src/app/api/admin/payouts/route.ts` checked `role !== 'ADMIN'` (uppercase), while the DB stores `'admin'` (lowercase), permanently blocking the admin.
- **Fix Applied:**
  - `reports/route.ts`: `role === 'user'` → `role !== 'admin'`
  - `payouts/route.ts`: `role !== 'ADMIN'` → `role !== 'admin'`
  - `auth.ts` JWT callback now loads `role` from the DB on sign-in and caches it in the JWT token. Session callback now propagates `role` to `session.user`.
- **Impact before fix:** Admin report and moderation queue exposed to any logged-in user.

### H-2: Stored XSS in Chapter Content Renderer
- **Files:** `src/components/ChapterBlockRenderer.tsx`, `src/components/HtmlWithHighlights.tsx`, `src/components/HtmlWithGlossary.tsx`
- **Root Cause:** All `dangerouslySetInnerHTML` calls rendered raw user-authored chapter content without any sanitization. A creator could embed `<script>` tags or event-handler attributes in chapter blocks.
- **Fix Applied:**
  - Added `src/lib/sanitize.ts` — a centralized utility that uses DOMPurify (client) and a conservative regex strip (SSR).
  - Wrapped all 10 `dangerouslySetInnerHTML` sites across the three components with `sanitizeHtml()`.
- **Impact before fix:** Persistent XSS — any creator could inject scripts executed in every reader's browser.

---

## MEDIUM Priority (Resolved)

### M-1: OAuth `accessToken` Stored in JWT Cookie
- **File:** `auth.ts`
- **Root Cause:** JWT callback stored `token.accessToken = account.access_token`. The NextAuth JWT is stored in a cookie accessible to client-side code. The underlying OAuth provider token was therefore exposed.
- **Fix Applied:** Removed the `token.accessToken` assignment. The OAuth token is no longer persisted anywhere.

### M-2: Cron Auth Guards Were Fail-Open
- **Files:** `src/app/api/cron/process-assessments/route.ts`, `src/app/api/cron/flush-analytics/route.ts`
- **Root Cause:** Guard was `if (cronSecret && authHeader !== ...)` — when `CRON_SECRET` env var was not set, the entire condition was `false` (because `cronSecret` is falsy), so **no auth check ran at all**. Anyone with the URL could trigger AI processing and DB writes.
- **Fix Applied:** Both guards changed to `if (!cronSecret || authHeader !== \`Bearer ${cronSecret}\`)` — fail-closed: if the secret is unset the endpoint rejects all requests.

### M-3: No Content-Security-Policy Header
- **File:** `next.config.js`
- **Root Cause:** Previous headers config only applied three headers to `/api/:path*`; no CSP was set; `X-XSS-Protection` (deprecated) was included.
- **Fix Applied:** Replaced with a global `/(.*)`-matched header block that includes:
  - `Content-Security-Policy` (restricts scripts, styles, images, frames, objects)
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy: camera=(), microphone=(), geolocation=()`
  - `X-DNS-Prefetch-Control: on`
  - Removed deprecated `X-XSS-Protection`

### M-4: No Input Validation on Creator Profile Update
- **File:** `src/app/api/creator/profile/route.ts`
- **Root Cause:** PATCH handler deserialized `request.json()` directly into `updateData` with no length, type, or format checks.
- **Fix Applied:** Added a Zod schema (`profileUpdateSchema`) validated before any DB write:
  - `displayName`: max 100 chars
  - `bio`: max 2 000 chars
  - `profileImage` / `coverImage`: must be valid URL, max 500 chars (or empty/null)
  - `accentColor`: hex color regex (`#rrggbb`)
  - `blocks`: array max 50 elements with typed fields

### M-5: No Length Limit on Comment Text
- **File:** `src/app/api/comments/route.ts`
- **Root Cause:** POST handler accepted any string for `text` with no length validation, enabling DB bloat or abuse.
- **Fix Applied:** Added check after existing required-field guard — comment must be 1–5 000 characters; rejects with HTTP 400 otherwise.

---

## LOW Priority (Resolved)

### L-1: Work Status / MaturityRating Accept Arbitrary Strings
- **File:** `src/app/api/works/[id]/route.ts`
- **Root Cause:** PUT handler directly assigned `status` and `maturityRating` from the request body into the Prisma update without validating against the allowed enum values.
- **Fix Applied:** Added enum allow-lists before the update:
  - Valid statuses: `draft`, `ongoing`, `completed`, `hiatus`, `unpublished`, `published`
  - Valid ratings: `G`, `PG`, `PG-13`, `R`, `NC-17`
  - Returns HTTP 400 for unrecognised values.
- Also: removed `error.message` from the 500 response body (was leaking internal DB error text to callers).

### L-2: Health Endpoint Discloses Environment Info
- **File:** `src/app/api/health/route.ts`
- **Root Cause:** Unauthenticated GET returned `nodeEnv` and `hasDatabaseUrl` — confirming environment type and DB connectivity to any caller.
- **Fix Applied:** Response now returns only `{ status, timestamp }`.

---

## INFO (No Action Required)

### I-1: In-Memory Rate Limiting Not Distributed
- **File:** `src/lib/api/errorHandling.ts`
- Rate limit counters are stored in a `Map` in process memory. Resets on every deploy/cold start, and does not share state across serverless function instances.
- **Recommendation:** For production scale, replace with Redis-backed rate limiting (e.g. `@upstash/ratelimit`). Not a security vulnerability at current traffic levels.

### I-2: `ignoreBuildErrors: true` in TypeScript Config
- **File:** `next.config.js`
- Type errors are suppressed during builds. This can mask security-relevant type mismatches.
- **Recommendation:** Incrementally fix TS errors and enable strict type checking before v1.0 launch.

### I-3: `console.log` Calls in API Routes
- Several API routes log internal IDs and session data to stdout.
- **Recommendation:** Replace with a structured logger (e.g. `pino`) that can be silenced in production builds.

---

## Files Changed in This Audit

| File | Change |
|------|--------|
| `src/lib/sanitize.ts` | **New** — DOMPurify-based HTML sanitizer (SSR + client) |
| `auth.ts` | Load role from DB in JWT callback; remove accessToken; propagate role to session |
| `next.config.js` | Global CSP + security headers on all routes |
| `src/app/api/health/route.ts` | Remove env disclosure |
| `src/app/api/cron/process-assessments/route.ts` | Fail-closed cron auth |
| `src/app/api/cron/flush-analytics/route.ts` | Fail-closed cron auth |
| `src/app/api/admin/reports/route.ts` | Fix `role === 'user'` → `role !== 'admin'` |
| `src/app/api/admin/payouts/route.ts` | Fix `'ADMIN'` → `'admin'` case |
| `src/app/api/creator/profile/route.ts` | Add Zod schema validation |
| `src/app/api/comments/route.ts` | Add 5 000-char text limit |
| `src/app/api/works/[id]/route.ts` | Add status/rating enum guards; remove error detail in 500 |
| `src/components/ChapterBlockRenderer.tsx` | Wrap 4 `dangerouslySetInnerHTML` sites with `sanitizeHtml()` |
| `src/components/HtmlWithHighlights.tsx` | Wrap 3 `dangerouslySetInnerHTML` sites with `sanitizeHtml()` |
| `src/components/HtmlWithGlossary.tsx` | Wrap 3 `dangerouslySetInnerHTML` sites with `sanitizeHtml()` |

---

## Prerequisites Set Up

```bash
npm install dompurify @types/dompurify
```

---

## OWASP Top 10 Coverage

| OWASP Category | Status |
|----------------|--------|
| A01 Broken Access Control | ✅ Fixed (admin role, cron auth) |
| A02 Cryptographic Failures | ✅ Fixed (removed accessToken from JWT) |
| A03 Injection (XSS) | ✅ Fixed (DOMPurify sanitization) |
| A04 Insecure Design | ✅ Improved (input validation, fail-closed guards) |
| A05 Security Misconfiguration | ✅ Fixed (CSP headers, health endpoint) |
| A06 Vulnerable Components | ℹ️ 10 pre-existing npm audit advisories (investigate separately) |
| A07 Auth Failures | ✅ Fixed (role propagation in JWT/session) |
| A08 Software Integrity | ℹ️ No SAST/dependency pinning yet |
| A09 Logging Failures | ℹ️ console.log in routes (see I-3) |
| A10 SSRF | ℹ️ Image remotePatterns in next.config.js restrict external hosts |
