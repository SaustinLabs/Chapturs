# Gutenberg / Open Library Import Pipeline — Technical Specification

**Author:** Danny (Lead/Architect)  
**Date:** 2026-04-14  
**Status:** Ready for implementation  
**Implements:** TASKS.md #21 · #22 · #23  

---

## 1. Overview & Goals

The Gutenberg Import Pipeline lets an admin paste a Project Gutenberg or Open Library URL into an admin tool and walk away. By the time it's done, the platform has a fully-formed, published Work with chapters, a bot-author profile, AI-generated glossary entries, AI-generated character profiles, a cover image, and a quality assessment score — all without human intervention beyond pasting the URL.

**Goals**
- Give the platform demo-quality, copyright-safe seed content before first users arrive.
- Exercise and validate all three AI pipelines (glossary, characters, QA) against real literary text.
- Be idempotent: re-submitting the same URL must update, not duplicate.
- Not break anything already in production. The new endpoint is additive only.

**Non-goals**
- This is admin-only. No reader-facing imports.
- No support for copyrighted works. Only Project Gutenberg URLs and Open Library metadata for confirmed public-domain texts are accepted.
- No real-time progress SSE stream (v1 is synchronous with a long timeout; background job queue is a v2 concern).

---

## 2. External Data Sources

### 2a. Project Gutenberg

**Plain-text CDN (primary — no auth, no API key)**
```
https://www.gutenberg.org/cache/epub/{gutenberg_id}/pg{gutenberg_id}.txt
```
Example: `https://www.gutenberg.org/cache/epub/1184/pg1184.txt`

**Alternate text mirror (fallback if cache CDN fails)**
```
https://www.gutenberg.org/files/{gutenberg_id}/{gutenberg_id}-0.txt
```
Example: `https://www.gutenberg.org/files/345/345-0.txt`

**ebooks page URL patterns (all resolve to the same book)**
```
https://www.gutenberg.org/ebooks/{id}
https://www.gutenberg.org/ebooks/{id}.txt.utf-8
https://gutenberg.org/ebooks/{id}
https://www.gutenberg.org/cache/epub/{id}/pg{id}.txt
```

**Metadata API (no auth)**
```
https://gutendex.com/books/{gutenberg_id}
```
Returns JSON with: `title`, `authors[].name`, `subjects[]`, `bookshelves[]`, `formats`, `download_count`.  
Use this for title, author name, and subject genres. Do not parse the plain text for metadata.

**Cover image from Gutendex**
The `formats` object in the Gutendex response includes:
```json
{ "image/jpeg": "https://www.gutenberg.org/cache/epub/{id}/pg{id}.cover.medium.jpg" }
```
If `formats["image/jpeg"]` exists, use that URL to download the cover.

### 2b. Open Library (optional — for supplementary metadata)

**Work record**
```
https://openlibrary.org/works/{ol_work_id}.json
```
Example: `https://openlibrary.org/works/OL166894W.json`

**Cover art**
```
https://covers.openlibrary.org/b/id/{cover_id}-L.jpg
```

**Note:** Open Library support is a nice-to-have. The primary flow uses Gutenberg only. If the admin pastes an Open Library URL, extract the `OL\d+W` work ID, look up the Gutenberg ISBN cross-reference via Open Library's `/api/books?bibkeys=ISBN:{isbn}&format=json`, then proceed as a normal Gutenberg import. If no Gutenberg ID is found, return a 400 — Open Library full-text is not in scope for v1.

---

## 3. Gutenberg URL Parsing

Write a pure function `parseGutenbergId(url: string): number | null`. It must handle all known URL patterns without network calls.

```typescript
// src/lib/gutenberg-import/parse-url.ts

export function parseGutenbergId(url: string): number | null {
  try {
    const u = new URL(url)
    
    // Pattern 1: /ebooks/{id}  or  /ebooks/{id}.txt.utf-8
    const ebooksMatch = u.pathname.match(/\/ebooks\/(\d+)/)
    if (ebooksMatch) return parseInt(ebooksMatch[1], 10)
    
    // Pattern 2: /cache/epub/{id}/pg{id}.txt
    const cacheMatch = u.pathname.match(/\/cache\/epub\/(\d+)\//)
    if (cacheMatch) return parseInt(cacheMatch[1], 10)
    
    // Pattern 3: /files/{id}/{id}-0.txt
    const filesMatch = u.pathname.match(/\/files\/(\d+)\//)
    if (filesMatch) return parseInt(filesMatch[1], 10)
  } catch {
    // Invalid URL
  }
  return null
}
```

If `parseGutenbergId` returns `null`, the import endpoint returns HTTP 400: `{ error: "Could not extract a Gutenberg book ID from the provided URL" }`.

---

## 4. Bot Author Strategy

Public-domain works need an author record in the DB but no real Chapturs user account.

**Strategy: single platform bot user + one Author record per real-world author name.**

1. On first import, look up (or create) a platform User with:
   - `email`: `bot-imports@chapturs.com`  ← non-routable internal address
   - `username`: `chapturs_classics`
   - `displayName`: `Chapturs Classics`
   - `bio`: `Public domain literary works imported from Project Gutenberg.`
   - `role`: `user`
   - `verified`: `true`

2. On first import for a given real-world author name (e.g. "Bram Stoker"):
   - Look up an Author record where `user.username = 'chapturs_classics'` AND the Work's title already exists  
   - Actually: all Gutenberg works share **one** Author record tied to the bot User. The real-world author's name is stored in `Work.description` as attribution text and in the `Work.tags` JSON as `["imported", "classic", "public domain", "author:Bram Stoker"]`.  
   - This keeps the model simple: one bot user, one Author record, many Works. The real author's name is discoverable via search/tags without polluting the Author table.

3. Idempotency check for the bot user uses `upsert` on `email` uniqueness.

**Prisma field mapping for the bot User:**

```typescript
const botUser = await prisma.user.upsert({
  where: { email: 'bot-imports@chapturs.com' },
  create: {
    email:       'bot-imports@chapturs.com',
    username:    'chapturs_classics',
    displayName: 'Chapturs Classics',
    bio:         'Public domain literary works imported from Project Gutenberg.',
    verified:    true,
    role:        'user',
  },
  update: {}, // never overwrite
})

const botAuthor = await prisma.author.upsert({
  where: { userId: botUser.id },
  create: { userId: botUser.id, verified: true },
  update: {},
})
```

---

## 5. Step-by-Step Data Flow

### Step 0 — Idempotency Check

Before doing any work:
```typescript
const idempotencyTag = `gutenberg:${gutenbergId}`
const existing = await prisma.work.findFirst({
  where: { tags: { contains: idempotencyTag } }
})
```
If found, skip straight to Step 6 (AI pipelines) for any steps not yet completed, using the existing `workId`. Return `{ status: 'already_imported', workId: existing.id }` if everything is already done.

**Implementation note:** Store the idempotency tag in the `tags` JSON array field as `"gutenberg:1184"`. This is searchable via `contains` without a schema change.

### Step 1 — Fetch Metadata

Call Gutendex:
```
GET https://gutendex.com/books/{gutenbergId}
```
Response fields used:
| Gutendex field | Mapped to |
|----------------|-----------|
| `title` | `Work.title` |
| `authors[0].name` | attribution tag + bot author display |
| `subjects[]` | genre matching (see §5 genre mapping) |
| `bookshelves[]` | additional tags |
| `formats["image/jpeg"]` | cover image URL |

**Genre mapping from subjects/bookshelves:**
Map Gutenberg subject strings to platform genres with a simple lookup table:
```typescript
const GENRE_MAP: Record<string, string> = {
  'adventure':       'Adventure',
  'horror':          'Horror',
  'gothic':          'Gothic',
  'romance':         'Romance',
  'mystery':         'Mystery',
  'science fiction': 'Science Fiction',
  'historical':      'Historical Fiction',
  'fantasy':         'Fantasy',
}
```
Iterate `subjects` and `bookshelves`, lowercase each, and test for substring matches. Collect unique matches, cap at 3 genres, default to `['Classic', 'Literature']` if nothing matches.

**Description:** Use `"A classic work of {genre} literature by {author}. Originally published in {year}. Public domain — imported from Project Gutenberg (Book #{id})."`. Year can be extracted from subjects if present (e.g. "1897"), otherwise omit.

### Step 2 — Create Work Record

```typescript
const work = await prisma.work.upsert({
  where: {
    // There's no natural unique key — use a workaround:
    // upsert on id using the existing id from idempotency check, or use create.
    // For a clean first import, just use create.
  },
  // Preferred: look up by tags containing idempotencyTag above; if not found, create.
})
```

**Since `Work` has no external-key unique constraint, use create after the idempotency check in Step 0:**

```typescript
const work = await prisma.work.create({
  data: {
    title:          metadata.title,
    description:    buildDescription(metadata),
    authorId:       botAuthor.id,
    formatType:     'novel',
    coverImage:     null,          // filled in Step 4
    status:         'draft',       // promoted to 'completed' in Step 8
    maturityRating: 'PG',          // override per-work if needed (see §8 work list)
    aiUseDisclosure: 'none',       // public domain, no AI writing involved
    genres:         JSON.stringify(mappedGenres),
    tags:           JSON.stringify([
                      'imported',
                      'classic',
                      'public domain',
                      `author:${metadata.authors[0]?.name ?? 'Unknown'}`,
                      `gutenberg:${gutenbergId}`,   // idempotency tag
                    ]),
    statistics:     JSON.stringify({ views: 0, likes: 0, comments: 0 }),
    glossary:       null,
    viewCount:      0,
  }
})
```

### Step 3 — Fetch and Parse the Text

**Fetch:**
```typescript
async function fetchGutenbergText(id: number): Promise<string> {
  // Try primary CDN first
  const primary = `https://www.gutenberg.org/cache/epub/${id}/pg${id}.txt`
  try {
    const res = await fetch(primary, { signal: AbortSignal.timeout(30_000) })
    if (res.ok) return await res.text()
  } catch {}
  
  // Fallback
  const fallback = `https://www.gutenberg.org/files/${id}/${id}-0.txt`
  const res = await fetch(fallback, { signal: AbortSignal.timeout(30_000) })
  if (!res.ok) throw new Error(`Could not fetch Gutenberg text for book ${id}: ${res.status}`)
  return await res.text()
}
```

**Strip Gutenberg header/footer:**
All Gutenberg .txt files have a preamble that ends with `*** START OF THE PROJECT GUTENBERG EBOOK` and a footer that starts with `*** END OF THE PROJECT GUTENBERG EBOOK`. Strip everything outside these markers:
```typescript
function stripGutenbergWrapper(raw: string): string {
  const startMarker = /\*{3}\s*START OF (?:THE |THIS )?PROJECT GUTENBERG/i
  const endMarker   = /\*{3}\s*END OF (?:THE |THIS )?PROJECT GUTENBERG/i
  const startIdx = raw.search(startMarker)
  const endIdx   = raw.search(endMarker)
  if (startIdx === -1) return raw   // No marker — return as-is
  const afterStart = raw.indexOf('\n', startIdx) + 1
  return endIdx === -1 ? raw.slice(afterStart) : raw.slice(afterStart, endIdx)
}
```

**Chapter splitting:**

Use the following priority:

1. **Primary regex** (covers 95% of Gutenberg books):
   ```
   /^(?:CHAPTER|Chapter|BOOK|PART)\s+([IVXLCDM]+|\d+)[\s.:\-–—]*(.*)?$/m
   ```
2. **Fallback 1 — Roman numeral headings only:**
   ```
   /^([IVXLCDM]{1,8})\.?\s*$/m
   ```
3. **Fallback 2 — Word-count chunking** (last resort for books without chapter headings):
   Split into chunks of `MAX_WORDS_PER_CHAPTER` words (default: 3000). Title each chunk "Part N".

```typescript
const MAX_WORDS_PER_CHAPTER = 3000
const MAX_CHAPTERS = 150

function splitIntoChapters(text: string): Array<{ title: string; content: string }> {
  // Try primary pattern
  const PRIMARY = /^(?:CHAPTER|Chapter|BOOK|PART)\s+([IVXLCDM]+|\d+)[\s.:\-–—]*(.*)?$/m
  let parts = text.split(PRIMARY)
  
  if (parts.length > 3) {
    return buildChapterList(parts, ['number', 'subtitle'])
  }
  
  // Try roman numeral fallback
  const ROMAN = /^([IVXLCDM]{1,8})\.?\s*$/m
  parts = text.split(ROMAN)
  if (parts.length > 3) {
    return buildChapterList(parts, ['number'])
  }
  
  // Word-count fallback
  return wordCountFallback(text, MAX_WORDS_PER_CHAPTER)
}
```

`buildChapterList` reassembles the split array (accounting for capture groups appearing in the array) into `{ title, content }` pairs. Cap at `MAX_CHAPTERS` to avoid runaway imports.

### Step 4 — Upload Cover Image

```typescript
import { r2Client, getR2PublicUrl } from '@/lib/r2'
import { PutObjectCommand } from '@aws-sdk/client-s3'

async function uploadCoverToR2(
  gutenbergId: number,
  coverUrl: string
): Promise<string | null> {
  try {
    const res = await fetch(coverUrl, { signal: AbortSignal.timeout(15_000) })
    if (!res.ok) return null
    
    const buf = Buffer.from(await res.arrayBuffer())
    const key = `covers/gutenberg-${gutenbergId}.jpg`
    
    await r2Client.send(new PutObjectCommand({
      Bucket:      process.env.R2_BUCKET_NAME!,
      Key:         key,
      Body:        buf,
      ContentType: 'image/jpeg',
    }))
    
    return `${getR2PublicUrl()}/${key}`
  } catch {
    return null   // Non-fatal: work is created without cover
  }
}
```

Once uploaded, update the Work:
```typescript
if (coverUrl) {
  await prisma.work.update({
    where: { id: work.id },
    data:  { coverImage: coverUrl },
  })
}
```

**Placeholder fallback:** If no cover is available (Gutendex has no `image/jpeg`), leave `coverImage: null`. The UI already renders a default cover placeholder.

### Step 5 — Create Section Records

For each parsed chapter (capped at `MAX_CHAPTERS`):

```typescript
await prisma.section.create({
  data: {
    workId:        work.id,
    title:         chapter.title,
    content:       JSON.stringify({
                     blocks: [{ type: 'prose', text: chapter.content.trim() }]
                   }),
    wordCount:     countWords(chapter.content),
    chapterNumber: i + 1,
    status:        'published',
    publishedAt:   new Date(),
  }
})
```

**Word count helper:**
```typescript
function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length
}
```

**Content format note:** Use `{ blocks: [{ type: 'prose', text: '...' }] }` (wrapper object with `blocks` key). This is the format consumed by `extractTextFromChaptDoc` in `assessment-sync.ts` and the ChaptursReader block renderer.

Create sections sequentially (not `createMany`) so that if one fails the job can be resumed from the last successful chapter number.

### Step 6 — Trigger AI Glossary Generation

The glossary generation is driven by the LLM — it reads the first `N` chapters and extracts terms. Call it as an internal fetch against the existing glossary API, but since this runs server-side (inside the API route), call the service function directly.

**Use the existing `POST /api/works/[id]/glossary` route logic (not an HTTP call — replicate the Prisma write directly or extract it to a shared service).**

Prompt strategy (call OpenRouter with `meta-llama/llama-3.1-8b-instruct`):

```typescript
// src/lib/gutenberg-import/generate-glossary.ts

import OpenAI from 'openai'

const client = new OpenAI({
  apiKey:   process.env.OPENROUTER_API_KEY,
  baseURL:  'https://openrouter.ai/api/v1',
  defaultHeaders: {
    'HTTP-Referer': 'https://chapturs.com',
    'X-Title':      'Chapturs',
  },
})

export async function generateGlossaryForWork(
  workId: string,
  workTitle: string,
  sampleText: string,   // first ~3000 words of the work
): Promise<void> {
  const prompt = `You are a literary analyst. Read the following excerpt from "${workTitle}" and extract 8–12 important terms: characters, places, organisations, objects, or concepts that a reader would benefit from having defined. Return a JSON array only, no prose:
[
  { "term": "...", "definition": "...", "type": "character|place|item|concept|term", "chapterIntroduced": 1 }
]
Excerpt:
${sampleText.slice(0, 4000)}`

  const resp = await client.chat.completions.create({
    model:       'meta-llama/llama-3.1-8b-instruct',
    messages:    [{ role: 'user', content: prompt }],
    max_tokens:  1000,
    temperature: 0.3,
  })
  
  const raw = resp.choices[0]?.message?.content ?? '[]'
  
  let entries: any[]
  try {
    // Extract JSON from possible surrounding text
    const match = raw.match(/\[[\s\S]*\]/)
    entries = match ? JSON.parse(match[0]) : []
  } catch {
    entries = []
  }
  
  for (const entry of entries) {
    if (!entry.term || !entry.definition) continue
    await prisma.$executeRaw`
      INSERT INTO glossary_entries (id, "workId", term, definition, type, "chapterIntroduced", "createdAt", "updatedAt")
      VALUES (gen_random_uuid()::text, ${workId}, ${entry.term}, ${entry.definition}, ${entry.type ?? 'term'}, ${entry.chapterIntroduced ?? 1}, NOW(), NOW())
      ON CONFLICT DO NOTHING
    `
    // Also insert a definition version
    const inserted = await prisma.glossaryEntry.findFirst({ where: { workId, term: { equals: entry.term, mode: 'insensitive' } } })
    if (inserted) {
      await prisma.$executeRaw`
        INSERT INTO glossary_definition_versions (id, "glossaryEntryId", definition, "fromChapter", "createdAt")
        VALUES (gen_random_uuid()::text, ${inserted.id}, ${entry.definition}, ${entry.chapterIntroduced ?? 1}, NOW())
        ON CONFLICT DO NOTHING
      `
    }
  }
}
```

**Sample text:** Concatenate `section.content` blocks for chapters 1–3 (or until 3000 words are accumulated). Extract plain text via a stripped-down version of `extractTextFromChaptDoc`.

### Step 7 — Trigger Character Profile Generation

Similar pattern to glossary — LLM extracts characters from sample text.

```typescript
// src/lib/gutenberg-import/generate-characters.ts

export async function generateCharactersForWork(
  workId: string,
  workTitle: string,
  sampleText: string,
): Promise<void> {
  const prompt = `You are a literary analyst. Read the following excerpt from "${workTitle}" and extract the 4–8 most significant characters. Return a JSON array only:
[
  {
    "name": "...",
    "role": "protagonist|antagonist|supporting",
    "quickGlance": "One-sentence description (max 100 chars)",
    "backstory": "2–3 sentence background",
    "personalityTraits": ["trait1", "trait2", "trait3"],
    "firstAppearance": 1
  }
]
Excerpt:
${sampleText.slice(0, 4000)}`

  const resp = await client.chat.completions.create({
    model:       'meta-llama/llama-3.1-8b-instruct',
    messages:    [{ role: 'user', content: prompt }],
    max_tokens:  1200,
    temperature: 0.3,
  })

  const raw = resp.choices[0]?.message?.content ?? '[]'
  
  let characters: any[]
  try {
    const match = raw.match(/\[[\s\S]*\]/)
    characters = match ? JSON.parse(match[0]) : []
  } catch {
    characters = []
  }
  
  for (const char of characters) {
    if (!char.name) continue
    await prisma.$executeRaw`
      INSERT INTO character_profiles (
        id, "workId", name, role, "quickGlance", backstory,
        "personalityTraits", "firstAppearance", "allowUserSubmissions",
        "createdAt", "updatedAt"
      )
      VALUES (
        gen_random_uuid()::text, ${workId}, ${char.name}, ${char.role ?? 'supporting'},
        ${char.quickGlance ?? null}, ${char.backstory ?? null},
        ${JSON.stringify(char.personalityTraits ?? [])},
        ${char.firstAppearance ?? 1}, false, NOW(), NOW()
      )
      ON CONFLICT DO NOTHING
    `
  }
}
```

### Step 8 — Trigger Quality Assessment

Queue only the **first section** for QA, per platform rules:

```typescript
import { queueForAssessment } from '@/lib/quality-assessment/assessment-service'

const firstSection = sections[0]   // saved from Step 5

await queueForAssessment({
  workId:    work.id,
  sectionId: firstSection.id,
  content:   firstSection.content,
  metadata: {
    title:         work.title,
    genres:        JSON.parse(work.genres),
    tags:          JSON.parse(work.tags),
    formatType:    work.formatType,
    maturityRating: work.maturityRating,
  },
  priority: 'normal',
})
```

QA runs asynchronously via the existing queue processor. The import does **not** wait for QA to complete before marking the work as published.

### Step 9 — Publish the Work

Mark the Work as complete and visible in the feed:
```typescript
await prisma.work.update({
  where: { id: work.id },
  data: {
    status:    'completed',   // public domain works are "completed"
    updatedAt: new Date(),
  }
})
```

All sections were already created with `status: 'published'` in Step 5.

---

## 6. The Admin API Endpoint

**File:** `src/app/api/admin/import/gutenberg/route.ts`

### Auth guard

Follow the double-guard pattern. The route itself checks session + admin role:
```typescript
const session = await auth()
const role = (session?.user as any)?.role
if (!session?.user || (role !== 'admin' && role !== 'superadmin')) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
```
The `src/app/admin/layout.tsx` server layout provides the second guard for any UI component in the admin tree.

### `POST /api/admin/import/gutenberg`

**Request:**
```json
{
  "url": "https://www.gutenberg.org/ebooks/345",
  "options": {
    "maxChapters": 150,
    "maturityRating": "PG-13",
    "dryRun": false
  }
}
```

All `options` fields are optional. `dryRun: true` parses the URL and fetches metadata but creates nothing in the DB — useful for previewing before committing.

**Response (success):**
```json
{
  "status": "imported",
  "workId": "clxxx...",
  "title": "Dracula",
  "author": "Bram Stoker",
  "sectionsCreated": 27,
  "glossaryTermsQueued": 10,
  "charactersCreated": 6,
  "coverUploaded": true,
  "qaQueued": true
}
```

**Response (already imported):**
```json
{
  "status": "already_imported",
  "workId": "clxxx...",
  "title": "Dracula"
}
```

**Response (dry run):**
```json
{
  "status": "dry_run",
  "gutenbergId": 345,
  "title": "Dracula",
  "author": "Bram Stoker",
  "estimatedChapters": 27,
  "coverAvailable": true
}
```

**Response (errors):**
```json
{ "error": "Could not extract a Gutenberg book ID from the provided URL" }   // 400
{ "error": "Could not fetch book metadata from Gutendex" }                   // 502
{ "error": "Could not fetch book text from Project Gutenberg" }              // 502
```

### Complete route skeleton

```typescript
// src/app/api/admin/import/gutenberg/route.ts
export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/database/PrismaService'
import { parseGutenbergId } from '@/lib/gutenberg-import/parse-url'
import { runGutenbergImport } from '@/lib/gutenberg-import/importer'

export async function POST(request: NextRequest) {
  const session = await auth()
  const role = (session?.user as any)?.role
  if (!session?.user || (role !== 'admin' && role !== 'superadmin')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { url, options = {} } = body

  if (!url || typeof url !== 'string') {
    return NextResponse.json({ error: 'url is required' }, { status: 400 })
  }

  const gutenbergId = parseGutenbergId(url)
  if (!gutenbergId) {
    return NextResponse.json(
      { error: 'Could not extract a Gutenberg book ID from the provided URL' },
      { status: 400 }
    )
  }

  try {
    const result = await runGutenbergImport(gutenbergId, options)
    return NextResponse.json(result)
  } catch (err: any) {
    console.error('[GutenbergImport]', err)
    return NextResponse.json({ error: err.message ?? 'Import failed' }, { status: 500 })
  }
}
```

The `runGutenbergImport` function in `src/lib/gutenberg-import/importer.ts` contains the full Step 0–9 pipeline.

---

## 7. File Structure

```
src/lib/gutenberg-import/
  parse-url.ts          ← parseGutenbergId()
  importer.ts           ← runGutenbergImport() — orchestrates Steps 0–9
  fetch-metadata.ts     ← Gutendex + Open Library fetch helpers
  parse-chapters.ts     ← stripGutenbergWrapper() + splitIntoChapters()
  generate-glossary.ts  ← generateGlossaryForWork() (Step 6)
  generate-characters.ts ← generateCharactersForWork() (Step 7)
  upload-cover.ts       ← uploadCoverToR2() (Step 4)
  bot-user.ts           ← ensureBotAuthor() — upserts bot User + Author (Step 0)

src/app/api/admin/import/gutenberg/
  route.ts              ← POST handler

src/app/admin/import/
  page.tsx              ← Admin UI (see §9)
```

---

## 8. Suggested Works to Import

These are the 5 recommended imports. Run them in this order — Dracula is the best showcase of the full pipeline (glossary, characters, cover) so import it first.

| Gutenberg ID | Title | Author | Genres | Maturity | Notes |
|---|---|---|---|---|---|
| 345 | Dracula | Bram Stoker | Horror, Gothic | PG-13 | Rich characters (Van Helsing, Mina, Lucy, Dracula). Strong glossary candidate. |
| 1184 | The Count of Monte Cristo | Alexandre Dumas | Adventure, Historical Fiction | PG-13 | 117 chapters. Longest import — test chapter cap. Use `maxChapters: 50` for v1. |
| 164 | Twenty Thousand Leagues Under the Sea | Jules Verne | Adventure, Science Fiction | PG | Good for sci-fi reader seeding. Clear chapter structure. |
| 1342 | Pride and Prejudice | Jane Austen | Romance, Classic | PG | Strong romance demographic. Simple chapter structure. |
| 43 | The Strange Case of Dr Jekyll and Mr Hyde | R.L. Stevenson | Horror, Thriller | PG-13 | Very short (10 chapters). Good smoke test for the pipeline. |

**Additional candidates for v2:**
- `174` · The Picture of Dorian Gray (Wilde) — Gothic, Philosophy
- `84` · Frankenstein (Shelley) — Gothic, Science Fiction
- `1260` · Jane Eyre (Brontë) — Romance, Gothic
- `2701` · Moby-Dick (Melville) — Adventure
- `98` · A Tale of Two Cities (Dickens) — Historical Fiction

---

## 9. Admin UI Component

**File:** `src/app/admin/import/page.tsx`

This is a simple server page with a client component for the form. Keep it minimal — no complex state management needed.

```typescript
// src/app/admin/import/page.tsx
import GutenbergImportForm from '@/components/admin/GutenbergImportForm'

export default function ImportPage() {
  return (
    <div className="max-w-xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-2">Import from Project Gutenberg</h1>
      <p className="text-gray-500 mb-6 text-sm">
        Paste a Gutenberg ebook URL. The import fetches the text, splits it into chapters,
        generates a glossary, extracts characters, and queues quality assessment.
        Takes ~30–60 seconds for large novels.
      </p>
      <GutenbergImportForm />
    </div>
  )
}
```

```typescript
// src/components/admin/GutenbergImportForm.tsx
'use client'

import { useState } from 'react'

export default function GutenbergImportForm() {
  const [url, setUrl] = useState('')
  const [maxChapters, setMaxChapters] = useState(150)
  const [dryRun, setDryRun] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setResult(null); setError(null)

    const res = await fetch('/api/admin/import/gutenberg', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ url, options: { maxChapters, dryRun } }),
    })
    const data = await res.json()
    setLoading(false)

    if (!res.ok) { setError(data.error ?? 'Import failed'); return }
    setResult(data)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Gutenberg URL</label>
        <input
          type="url"
          required
          value={url}
          onChange={e => setUrl(e.target.value)}
          placeholder="https://www.gutenberg.org/ebooks/345"
          className="w-full border rounded px-3 py-2 text-sm"
        />
      </div>
      <div className="flex gap-4 items-center">
        <label className="text-sm">
          Max chapters:
          <input type="number" value={maxChapters} min={1} max={500}
            onChange={e => setMaxChapters(Number(e.target.value))}
            className="ml-2 border rounded px-2 py-1 w-20 text-sm" />
        </label>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={dryRun} onChange={e => setDryRun(e.target.checked)} />
          Dry run (preview only)
        </label>
      </div>
      <button type="submit" disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded text-sm disabled:opacity-50">
        {loading ? 'Importing…' : 'Import'}
      </button>

      {error && <p className="text-red-600 text-sm">{error}</p>}
      {result && (
        <pre className="bg-gray-50 border rounded p-3 text-xs overflow-auto">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </form>
  )
}
```

Add a link to this page from `src/app/admin/page.tsx` or the admin sidebar.

---

## 10. Error Handling & Idempotency

| Failure point | Behaviour |
|---|---|
| Invalid URL / no Gutenberg ID | 400 immediately, no DB writes |
| Gutendex unreachable | 502, no DB writes |
| Gutenberg text CDN fail | Try fallback URL; if both fail, 502, no DB writes |
| Work already imported | Return `already_imported` with existing `workId`, skip all writes |
| Cover upload to R2 fails | Log warning, continue — cover stays null |
| LLM call for glossary fails | Log error, continue — work is imported without glossary |
| LLM call for characters fails | Log error, continue — work is imported without characters |
| QA queue fails | Log error, continue — QA can be manually re-queued |
| Any section create fails | Log and skip that section — do not abort the whole import |

**Re-import behaviour:** Re-submitting the same URL after a partial failure returns `already_imported` if a Work record exists with the idempotency tag. To force a re-import (e.g. to generate missing glossary), the implementation should accept an `options.force: true` flag that skips the idempotency check and re-runs missing steps only rather than re-creating the Work.

**Timeout:** The route is `runtime = 'nodejs'`. Set a hard cap via Next.js route segment config:
```typescript
export const maxDuration = 120   // seconds — sufficient for large novels on VPS
```

---

## 11. Environment Variables

No new env vars are required. All services are already configured:

| Var | Used for | Already in .env.example? |
|---|---|---|
| `OPENROUTER_API_KEY` | LLM calls (glossary + characters) | Yes |
| `R2_ACCOUNT_ID` | Cloudflare R2 cover upload | Yes |
| `R2_ACCESS_KEY_ID` | Cloudflare R2 cover upload | Yes |
| `R2_SECRET_ACCESS_KEY` | Cloudflare R2 cover upload | Yes |
| `R2_BUCKET_NAME` | Cloudflare R2 cover upload | Yes |
| `R2_PUBLIC_URL` | R2 public CDN base URL | Yes |
| `QA_PROCESSOR_SECRET` | QA queue auth (used internally) | Yes |

No new GitHub Secrets need to be added.

---

## 12. TASKS.md Updates

Replace task rows #21, #22, and #23 with the following verbatim text:

**Row #21** (replace):
```
| 21 | Import 3–5 public domain works from Project Gutenberg | 🔶 | Spec written at `docs/source/plans/gutenberg-import-pipeline.md`. Implement `POST /api/admin/import/gutenberg` + service in `src/lib/gutenberg-import/`. Suggested works: *Dracula* (#345), *Count of Monte Cristo* (#1184), *Twenty Thousand Leagues* (#164), *Pride and Prejudice* (#1342), *Jekyll and Hyde* (#43). |
```

**Row #22** (replace):
```
| 22 | Generate AI glossary entries for imported works | 🔶 | Covered by Gutenberg import pipeline spec (Step 6). Function: `generateGlossaryForWork()` in `src/lib/gutenberg-import/generate-glossary.ts`. Uses OpenRouter `meta-llama/llama-3.1-8b-instruct`. Writes directly to `glossary_entries` + `glossary_definition_versions` tables. |
```

**Row #23** (replace):
```
| 23 | Generate character profiles for imported works | 🔶 | Covered by Gutenberg import pipeline spec (Step 7). Function: `generateCharactersForWork()` in `src/lib/gutenberg-import/generate-characters.ts`. Uses OpenRouter `meta-llama/llama-3.1-8b-instruct`. Writes directly to `character_profiles` table. |
```

---

## 13. Implementation Checklist (for the implementing agent)

Complete these in order. Each step is testable independently.

- [ ] `src/lib/gutenberg-import/parse-url.ts` — `parseGutenbergId()` with unit tests
- [ ] `src/lib/gutenberg-import/fetch-metadata.ts` — Gutendex fetch + genre mapping
- [ ] `src/lib/gutenberg-import/parse-chapters.ts` — strip wrapper + split chapters
- [ ] `src/lib/gutenberg-import/bot-user.ts` — `ensureBotAuthor()` upsert
- [ ] `src/lib/gutenberg-import/upload-cover.ts` — R2 upload
- [ ] `src/lib/gutenberg-import/generate-glossary.ts` — LLM glossary extraction
- [ ] `src/lib/gutenberg-import/generate-characters.ts` — LLM character extraction
- [ ] `src/lib/gutenberg-import/importer.ts` — orchestrator (Steps 0–9)
- [ ] `src/app/api/admin/import/gutenberg/route.ts` — HTTP endpoint
- [ ] `src/components/admin/GutenbergImportForm.tsx` — UI form
- [ ] `src/app/admin/import/page.tsx` — Admin page
- [ ] Update TASKS.md rows #21, #22, #23 to 🔶
- [ ] Smoke test: import Gutenberg #43 (Jekyll and Hyde — short, 10 chapters)
- [ ] Full test: import Gutenberg #345 (Dracula — 27 chapters, rich characters)
- [ ] After both pass: mark #21, #22, #23 ✅ in TASKS.md
