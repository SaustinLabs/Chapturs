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
│   ├── api/                # API routes (route.ts files)
│   │   └── work/[id]/      # Work-specific endpoints
│   ├── creator/            # Creator hub pages
│   ├── reader/             # Reader hub pages
│   ├── story/              # Story detail pages
│   └── ...                 # Other route groups (admin, auth, etc.)
├── components/             # React components (.tsx)
│   └── ui/                 # Shared UI primitives
├── hooks/                  # Custom React hooks (.ts/.tsx)
├── lib/                    # Business logic & utilities
│   ├── api/errorHandling.ts  # Centralized error/response helpers
│   ├── database/PrismaService.ts  # Prisma singleton (globalForPrisma)
│   ├── redis.ts            # Redis client wrapper
│   └── recommendations/    # Recommendation engine
├── types/                  # TypeScript type definitions
└── auth.ts                 # NextAuth config
```

## Conventions

### API Routes (`src/app/api/[...]/route.ts`)
- Use `GET`, `POST`, `PUT`, `DELETE` exports (not `app.get()` Express style)
- Always import from `@/lib/api/errorHandling` for standardized responses:
  - `createSuccessResponse(data)` — `{ success: true, data }`
  - `createErrorResponse(code, message)` — `{ error, message, code }`
- Validate all input with Zod schemas before processing
- Use shared Prisma via `@/lib/database/PrismaService` (never create new instances)
- Rate limiting via `checkRateLimitAsync(key, limit, windowMs)` from errorHandling
- Auth via `import { auth } from '@/auth'` or edge variant

### Components
- Named exports only (no default exports)
- File naming: PascalCase (`FeedCard.tsx`, `ChapterReader.tsx`)
- Props interface before component definition
- Use Tailwind classes directly; avoid arbitrary values unless necessary
- Import from `@/components/ui` for shared primitives

### Database (Prisma)
- Models defined in `/prisma/schema.prisma`
- Always use the singleton: `import { prisma } from '@/lib/database/PrismaService'`
- Use Prisma's generated types from `@prisma/client`
- For raw queries, prefer Prisma's query builder over raw SQL

### Types (`src/types/index.ts`)
- Domain types live here (Work, FeedItem, Author, User, etc.)
- Extend or add new types alongside existing ones
- Don't duplicate types that already exist in Prisma client

### Environment Variables
- `DATABASE_URL` — PostgreSQL connection string (Supabase)
- `REDIS_URL` / `REDIS_HOST` — Redis connection
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` — Stripe integration
- `S3_BUCKET`, `S3_REGION`, `S3_ACCESS_KEY`, `S3_SECRET_KEY` — Storage
- `NEXTAUTH_SECRET` — NextAuth signing key

## How to Add New Features

1. **New API endpoint**: Create `src/app/api/[path]/route.ts` with Zod validation, Prisma queries, and standardized error handling.
2. **New page/route**: Create folder under `src/app/` with `page.tsx`. Use server components by default; add `'use client'` only when needed.
3. **New component**: Add to `src/components/`, export from index if shared.
4. **New database field**: Update `schema.prisma`, run migration, then update relevant types in `src/types/`.
5. **New hook**: Add to `src/hooks/`, follow naming convention (`useXxx`).

## Testing & Quality

- E2E tests: Playwright (`npm run test:e2e`)
- Linting: Next.js built-in lint (`npm run lint`)
- Build: `npm run build` (Prisma generate + Next.js build)
- No Jest unit tests found — focus on E2E and manual verification

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
