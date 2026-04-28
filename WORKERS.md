# Chapturs — Workers & Agents Reference

> Last updated: April 28, 2026
> **Purpose**: Document all workers, agents, and automated systems that operate within or against the Chapturs codebase.

---

## Squad Multi-Agent Team (`.squad/`)

The project uses a structured multi-agent development team orchestrated through VS Code Agent mode / Copilot Chat. All agents are cast as members of an "Ocean's Eleven" heist crew.

### Coordinator
| Name | Role | Function |
|------|------|----------|
| Squad | 🎯 Coordinator | Routes work items, enforces handoffs between agents, manages reviewer gates and task assignment |

### Team Members
| Name | Role | Charter | Key Responsibilities |
|------|------|---------|---------------------|
| **Danny** | 🏗️ Lead Architect | `.squad/agents/danny/charter.md` | Architecture decisions, system design reviews, code review approvals, cross-cutting concerns |
| **Linus** | ⚛️ Frontend Developer | `.squad/agents/linus/charter.md` | React components, Next.js pages, UI implementation, Tailwind styling, client-side state management |
| **Rusty** | 🔧 Backend Developer | `.squad/agents/rusty/charter.md` | API routes, Prisma models, database migrations, server-side logic, external service integrations |
| **Basher** | 🧪 Tester | `.squad/agents/basher/charter.md` | Jest unit tests, Playwright E2E tests, regression testing, mobile smoke tests |
| **Scribe** | 📋 Session Logger | `.squad/agents/scribe/charter.md` | Logs agent sessions, maintains decision history, tracks task progress across sessions |
| **Ralph** | 🔄 Work Monitor | `.squad/agents/ralph/charter.md` | Monitors work item status, ensures tasks move through pipeline, flags blockers |

### Squad Files
- `.squad/config.json` — Agent orchestration configuration (version 1)
- `.squad/team.md` — Team roster and project context
- `.squad/routing.md` — Work routing rules and handoff protocols
- `.squad/decisions.md` — Architecture and design decisions log
- `.squad/wisdom.md` — Lessons learned, patterns, and anti-patterns
- `.squad/ceremonies.md` — Team ceremonies (standups, retrospectives)
- `.squad/log/` — Session logs directory
- `.squad/orchestration-log/` — Orchestration event log
- `.squad/templates/` — Agent prompt templates
- `.squad/identity/` — Agent identity files
- `.squad/casting/` — Agent casting documents

---

## Automated Workers & Cron Jobs

### GitHub Actions Workers

| Workflow | File | Schedule | Purpose |
|----------|------|----------|---------|
| Recommendation Refresh | `.github/workflows/recommendation-refresh.yml` | `0 */6 * * *` (every 6 hours) | Runs collaborative + reader-to-reader recommendation signals via `POST /api/admin/collaborative-signals` with `x-scheduler-secret` header |
| Squad Heartbeat | `.github/workflows/squad-heartbeat.yml` | `*/30 * * * *` (every 30 min) | Ralph agent heartbeat — reacts to issues/PRs, keeps squad alive |
| Squad Issue Assign | `.github/workflows/squad-issue-assign.yml` | On issue events | Auto-assigns work items to squad agents |
| Squad Triage | `.github/workflows/squad-triage.yml` | On label/events | Triages and routes squad issues |
| Sync Squad Labels | `.github/workflows/sync-squad-labels.yml` | On demand | Syncs labels across repos for squad tracking |

### Next.js Route Workers (Server-Side Scheduled Tasks)

| Route | Path | Trigger | Purpose |
|-------|------|---------|---------|
| Weekly Digest | `src/app/api/cron/weekly-digest/route.ts` | Cron-triggered | Sends weekly email digest of activity on followed works |
| Process Assessments | `src/app/api/cron/process-assessments/route.ts` | Cron-triggered | Processes queued quality assessment jobs |
| Flush Analytics | `src/app/api/cron/flush-analytics/route.ts` | Cron-triggered | Aggregates and flushes analytics data |

### Admin Route Workers (Triggered by GitHub Actions)

| Route | Path | Trigger | Purpose |
|-------|------|---------|---------|
| Collaborative Signals | `src/app/api/admin/collaborative-signals/route.ts` | Scheduled cron (`0 */6 * * *`) | Runs collaborative + reader-to-reader recommendation signals via POST with `x-scheduler-secret` header |

### External Workers (Scripts)

| Script | Path | Purpose |
|--------|------|---------|
| Queue Processor | `scripts/process-queue.js` | Process queued jobs (QA queue, moderation queue) |
| DB Test Runner | `scripts/test-db.ts` | Database connectivity and schema validation tests |
| Deployment Tester | `scripts/test-deploy.sh` | End-to-end deployment verification |
| Stripe Webhook Verifier | `scripts/verify-stripe-webhook.ps1` | Verify Stripe webhook signature and event processing |
| Codebase Auditor | `scripts/auditor.py` | Autonomous codebase auditor — scans src/, compares against docs |
| Echo Worker | `scripts/echo_worker.py` | Echo documentation maintainer for autonomous development |
| Hermes Worker | `scripts/hermes_worker.py` | Hermes agent worker for autonomous tasks |
| Safety Rule Adder | `scripts/addSafetyRule.mjs` | Add content safety rules to validation |
| R2 URL Fixer | `scripts/fix-r2-urls.js` | Fix R2 image URL references in database |

---

## AI/LLM Workers (Runtime)

### Quality Assessment Worker
- **Model**: `meta-llama/llama-3.3-70b-instruct` (configurable via `LLM_QA_MODEL`)
- **Location**: `src/lib/quality-assessment/assessment-service.ts`, `llm-service.ts`
- **Function**: Evaluates first chapters across 6 dimensions (Writing Quality, Storytelling, Characterization, World-Building, Engagement, Originality) with weighted scoring (0–100 per dimension)
- **Output**: Quality tier assignment (Exceptional/Strong/Developing/Needs Work), visibility boost multiplier, discovery tags (5–15 AI-generated tags)

### Translation Worker
- **Model**: `meta-llama/llama-3.1-8b-instruct` (configurable via `LLM_TRANSLATION_MODEL`)
- **Location**: `src/lib/translation.ts`
- **Function**: Translates chapter content to 10 supported languages (`es`, `fr`, `de`, `ja`, `zh`, `pt`, `ko`, `it`, `ru`, `ar`)
- **Features**: Batch translation, chunked processing (>50 blocks), in-memory caching, rate limiting (20 req/hr per IP)

### Lore Master Worker
- **Model**: OpenRouter (configurable)
- **Location**: `src/lib/living-world/lore-master-client.ts`
- **Function**: AI agent for writer queries and contradiction scanning within Living World lore
- **Endpoint**: `POST /api/living-world/[worldId]/lore-master`

### Review Worker
- **Model**: `meta-llama/llama-3.1-8b-instruct` (configurable via `LLM_REVIEW_MODEL`)
- **Location**: `src/lib/quality-assessment/cumulative-review.ts`
- **Function**: Aggregates reader reviews into cumulative quality scores

---

## Background Processes & Services

### Redis Worker (Raw Fetch — no SDK)
- **Location**: `src/lib/redis.ts`
- **Purpose**: Cache operations for social data, feed caching, rate limiting
- **Note**: Uses raw HTTP fetch to avoid @upstash/redis SDK dependency issues on VPS standalone builds

### Pusher Realtime Worker
- **Location**: `src/lib/realtime.ts`
- **Purpose**: WebSocket-based real-time notifications and live updates
- **Integration**: Used for notification bell updates, collaboration presence indicators

---

## Deployment Workers (CI/CD Pipeline)

### GitHub Actions Runner
| Step | Action | Details |
|------|--------|---------|
| Checkout | `actions/checkout@v4` | Fetches latest main branch |
| Setup Node | `actions/setup-node@v4` | Node.js 20.x |
| Install & Build | Standalone output | `npm ci --omit=dev`, `next build` (standalone mode) |
| Prisma Generate | `prisma generate` | Generates client for standalone bundle |
| Prisma Push | `prisma db push` | Runs on runner, not VPS |
| Rsync to VPS | Custom rsync script | Syncs `.next/standalone`, `public/`, `nginx/`, ecosystem config |
| PM2 Reload | `pm2 startOrReload` | Hot-reloads application on VPS |

### Key Deployment Notes
- **NOT deployed on Vercel** — uses VPS with GitHub Actions runner
- Standalone output mode for zero-dependency deployment
- Prisma client generated standalone and rsynced to VPS
- `ecosystem.config.js` provides explicit working directory (`cwd`) for PM2
- Both `DATABASE_URL` and `DIRECT_URL` set on runner for `prisma db push`

---

## Worker Status Summary

| Worker | Type | Status | Notes |
|--------|------|--------|-------|
| Squad Team (6 agents) | Multi-agent dev team | ✅ Active | VS Code Agent mode, Ocean's Eleven universe cast |
| Recommendation Refresh | GitHub Actions cron | ✅ Active | Every 6 hours |
| Weekly Digest | Next.js route worker | ⬜ Not yet implemented | Schema exists, batching logic needed |
| Process Assessments | Next.js route worker | ✅ Available | Quality assessment queue processor |
| Flush Analytics | Next.js route worker | ✅ Available | Analytics aggregation |
| QA Worker (70B) | LLM runtime | ✅ Available | `meta-llama/llama-3.3-70b-instruct` |
| Translation Worker (8B) | LLM runtime | ✅ Available | 10 languages, batch + chunked |
| Lore Master Worker | LLM runtime | ✅ Available | Living World contradiction scanning |
| Redis Cache Worker | Background service | ✅ Available | Raw fetch, no SDK dependency |
| Pusher Realtime | WebSocket service | ✅ Available | Live notifications and presence |
