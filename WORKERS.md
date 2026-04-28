# Chapturs — Worker Instructions

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15+ (App Router, Turbopack) |
| Language | TypeScript (strict mode) |
| Database | PostgreSQL via Prisma ORM (Supabase hosted) |
| Cache | Redis (via `@/lib/redis`) |
| Validation | Zod schemas |
| Styling | Tailwind CSS + Headless UI + Heroicons |
| Auth | NextAuth v5 (`src/auth.ts` / `src/auth-edge.ts`) |
| Storage | AWS S3/R2 (`@aws-sdk/client-s3`) |
| Payments | Stripe |
| Monitoring | Sentry (`@sentry/nextjs`) |

## Project Structure

```
/mnt/c/Users/Smccr/Documents/Chapturs/src/
├── app/                    # Next.js App Router pages & API routes
│   ├── api/                # API routes (route.ts files) — 172+ endpoints
│   │   └── work/[id]/      # Work-specific endpoints
│   ├── creator/            # Creator hub pages
│   ├── reader/             # Reader hub pages
│   ├── story/              # Story detail pages
│   ├── admin/              # Admin panel pages
│   ├── contributor/        # Contributor profiles & boards
│   └── ...                 # Other route groups (auth, browse, etc.)
├── components/             # React components (.tsx/.ts) — 158 files
│   ├── ui/                 # Shared UI primitives (Modal, Tooltip, Toast, etc.)
│   ├── ads/                # Ad-related components (7 files)
│   ├── editor/             # TipTap editor extensions & converters (3 files)
│   ├── profile/            # Profile blocks/configs/editors (28 files)
│   └── ...                 # Other components (reader, creator, admin, etc.)
├── hooks/                  # Custom React hooks (.ts/.tsx) — 4 files
├── lib/                    # Business logic & utilities — 63 files (+ 15 subdirs)
│   ├── api/                # API helpers (errorHandling, schemas, DataService)
│   ├── database/           # PrismaService singleton + schema.sql
│   ├── recommendations/    # Recommendation engine (ML-based)
│   ├── living-world/       # Canon, contradiction scanner, lore master
│   ├── quality-assessment/ # LLM-powered QA pipeline (+ types)
│   ├── achievements/       # Points system & achievement logic
│   ├── ads/                # Ad eligibility & density calculator
│   ├── digest/             # Weekly email digest batching
│   ├── emoji/              # Custom emoji system (customEmojis, emojiData)
│   ├── observability/      # Monitoring logs (monetization, scheduler, world)
│   └── analytics/          # View counter utilities
├── types/                  # TypeScript type definitions — 7 files
└── auth.ts                 # NextAuth config
```

## Key Files to Reference

| File | Purpose |
|------|---------|
| `DESIGN.md` | Full design system spec (colors, typography, components) |
| `TASKS.md` | Active development tasks and priorities |
| `CODEBASE_MAP.md` | Detailed architecture map of routes/models/services |
| `chapturs_auto_translation_system_design.md` | Auto-translation pipeline design |

## Anti-Patterns to Avoid

- Never create new Prisma client instances (use the singleton)
- Don't bypass Zod validation on API inputs
- Don't use inline styles; prefer Tailwind classes
- Don't add pay-per-read features (violates VISION.md principle #1)
- Don't over-engineer author-facing tools (principle: "if it's hard for an author, don't build it")

## Task Sync with TASKS.md

Workers automatically sync between `TASKS.md` (master task list in repo) and `TASK_QUEUE.md` (worker queue):

- On each run, workers read `TASKS.md` and add any new HIGH/MEDIUM priority tasks to the queue
- Only 3 new tasks are added per run (to avoid overwhelming the queue)
- Tasks already in the queue are skipped (dedup by title similarity or task ID)
- The auditor syncs completion status back: when a worker completes a TASKS.md task, its ✅ status is updated

This means workers always have fresh priorities from your master list without manual intervention.

## Squad Multi-Agent Team

The repo uses the Squad framework for multi-agent development:
- `.squad/` directory contains team configuration and orchestration files
- Agents are cast as characters (Danny Lead, Linus Frontend, Rusty Backend, Basher Tester)
- Team identity: Ocean's Eleven heist crew
- Decisions, routing rules, and wisdom are tracked in `.squad/decisions.md`, `.squad/routing.md`, `.squad/wisdom.md`

## No Off-Limits Restrictions

**Nothing is off-limits.** Workers may build, modify, or improve any system in the codebase including:
- Living World system (lore master, canon graph, contradiction scanner, etc.)
- AI story writer bots and content generation tools
- Any other feature or subsystem

Workers have full autonomy to explore and implement whatever they think would benefit the platform. This policy was established after reviewing the current state of all systems — every subsystem has been deemed ready for autonomous development.