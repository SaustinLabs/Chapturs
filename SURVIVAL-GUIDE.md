# Chapturs — Survival Guide for Less Capable Models

> Written by GLM 5.2 after a productive session. If you're a smaller model taking over, read this carefully. It will save you from repeating my mistakes.

## The 5 Things That Will Bite You

### 1. The patch tool backslash-escapes quotes in JSX

When you use the `patch` tool on `.tsx` files, it sometimes produces `className=\"foo\"` instead of `className="foo"`. This produces `TS1127: Invalid character` errors that cascade into dozens of parse failures.

**Fix:** After EVERY patch on a `.tsx` file, run:
```python
python3 -c "
with open('path/to/file.tsx') as f: c=f.read()
c=c.replace('\\\\\"', '\"')
open('path/to/file.tsx','w').write(c)
"
```
Then verify with `npx tsc --noEmit path/to/file.tsx 2>&1 | grep -v TS2307 | grep -v TS18028 | grep -v TS17004`

### 2. console.log stripping produces orphaned arguments

If you bulk-strip `console.log()` calls, multi-line calls like:
```js
console.log({
  storage: '...',
  images: 5,
})
```
...will have the `console.log(` line removed but the object literal left orphaned, producing `TS1109: Expression expected`.

**Fix:** After ANY bulk console.log stripping, run `npm run lint` and grep for `TS1109` and `TS1128`. Fix orphaned arguments manually. NEVER strip from `/observability/`, `/logger.ts`, or `/test/` dev pages.

### 3. JSDoc `*/` inside comments breaks TypeScript

Writing `* */5 * * * *` (a crontab schedule) inside a JSDoc block comment causes `*/` to be interpreted as end-of-comment. The rest becomes bare code.

**Fix:** Never put literal `*/` in JSDoc. Write "runs every 5 min" as text.

### 4. Next.js 15+ params are Promises

```typescript
// WRONG (will crash at runtime):
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const work = await prisma.work.findUnique({ where: { id: params.id } })
}

// CORRECT:
type Params = { params: Promise<{ id: string }> }
export async function GET(req: NextRequest, { params }: Params) {
  const { id } = await params
  const work = await prisma.work.findUnique({ where: { id } })
}
```

### 5. `@/` path aliases don't resolve in bare tsc

Running `npx tsc --noEmit some-file.ts` will report `TS2307: Cannot find module '@/lib/...'` for every import using the `@/` alias. This is expected — Next.js handles path aliases at build time. These are NOT real errors.

**Fix:** Filter them out:
```bash
npx tsc --noEmit 2>&1 | grep "your-file" | grep -v "TS2307\|TS18028\|TS17004"
```

## Verification Workflow

**ALWAYS verify after editing code. Don't claim success without running:**

```bash
# 1. Type check (filters known noise)
npx tsc --noEmit 2>&1 | grep "your-file" | grep -v "TS2307\|TS18028\|TS17004"

# 2. Lint (ESLint installed July 2026)
npm run lint 2>&1 | grep "your-file"

# 3. For JSX files: check for escaped quotes
python3 -c "
with open('your-file.tsx') as f: c=f.read()
print('Has backslash quotes:', '\\\\\"' in c)
"
```

If you see `TS17004` (Cannot use JSX unless --jsx flag), that's bare tsc lacking Next.js config — ignore it. If you see `TS1127` (Invalid character), that's escaped quotes — fix it.

## Things That Are Already Built (Don't Rebuild)

- Design system (`src/components/ui/`: Button, Card, Badge, Skeleton, EmptyState)
- DESIGN.md tokens wired into Tailwind config
- Auth (NextAuth v5, dual auth-edge/auth.ts pattern — don't mix them)
- PrismaService singleton (never `new PrismaClient()` outside it)
- Gutenberg import pipeline (with idempotency guard)
- Achievement system (all triggers wired, fire-and-forget)
- Translation system (persisted, rate-limited, chunked)
- Smart paste pipeline (Google Docs/Word HTML → blocks)
- Continuous scroll reader
- Promoted story system (inline blocks + work-level ad displacement)
- Early access chapters (7-day premium window, no microtransactions)
- Reading lists (schema + API + public page)
- Profile banner + social links
- Founding Creators pitch page at `/founding-creators`
- Written reviews (RateWorkModal has textarea, WorkRating.review is @db.Text)

## Production Access

You can query the production database directly:
```bash
cd /home/smccrary/chapturs
DATABASE_URL="postgresql://postgres.qogwxlvuznejnzhechoi:NHER7WXkTKHE1DDf@aws-1-us-east-2.pooler.supabase.com:5432/postgres" \
DIRECT_URL="postgresql://postgres.qogwxlvuznejnzhechoi:NHER7WXkTKHE1DDf@aws-1-us-east-2.pooler.supabase.com:5432/postgres" \
npx tsx -e '
import { PrismaClient } from "@prisma/client"
const p = new PrismaClient()
// query here
p.$disconnect()
'
```

VPS SSH: `ssh root@104.168.117.163 "command"` (key auth only — password auth disabled)

## Sam's Preferences

- **Skip the jargon.** Don't explain TypeScript error codes or build tooling. Say "it works" or "here's the bug."
- **Take initiative.** Build first, ask permission never. Worst case: `git revert`.
- **Don't estimate time.** Just do it.
- **Commit after every subtask.** Incremental commits are restore points.
- **Verify production, not TASKS.md.** The DB is source of truth.
- **Push to deploy.** `git push origin main` triggers GitHub Actions → VPS.
