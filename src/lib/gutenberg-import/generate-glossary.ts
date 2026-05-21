/**
 * AI glossary generation for Gutenberg imports.
 * For classic literature, the LLM already knows the work — no need to parse raw text.
 * Just ask it directly for high-quality literary analysis.
 */

import OpenAI from 'openai'
import { prisma } from '@/lib/database/PrismaService'

const MODEL = process.env.LLM_QA_MODEL || 'anthropic/claude-sonnet-4'

const client = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: 'https://openrouter.ai/api/v1',
  defaultHeaders: {
    'HTTP-Referer': 'https://chapturs.com',
    'X-Title': 'Chapturs',
  },
})

export async function generateGlossaryForWork(
  workId: string,
  workTitle: string,
  authorName: string
): Promise<number> {
  const prompt = `You are a literary scholar creating a reader's glossary for "${workTitle}" by ${authorName}.

Extract 12–18 important terms that a first-time reader would benefit from having defined. Include:
- Key characters (with brief context — who they are, their role)
- Important locations and their significance
- Historical or cultural references that modern readers might miss
- Unique concepts, items, or terminology from the work

Return a JSON array only:
[
  {
    "term": "Count Dracula",
    "definition": "An ancient Transylvanian nobleman and vampire who moves to England to spread his curse. The novel's primary antagonist.",
    "type": "character",
    "chapterIntroduced": 1
  }
]

Prioritize terms that are essential to understanding the story. Definitions should be 1-3 sentences, informative but spoiler-free for the chapter they're introduced.`

  const resp = await client.chat.completions.create({
    model: MODEL,
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 2000,
    temperature: 0.3,
  })

  const raw = resp.choices[0]?.message?.content ?? '[]'

  let entries: any[]
  try {
    // Extract JSON array from response (may have surrounding text)
    const match = raw.match(/\[[\s\S]*\]/)
    entries = match ? JSON.parse(match[0]) : []
  } catch {
    entries = []
  }

  let created = 0
  for (const entry of entries) {
    if (!entry.term || !entry.definition) continue

    try {
      await prisma.$executeRawUnsafe(
        `INSERT INTO glossary_entries (id, "workId", term, definition, type, "chapterIntroduced", "createdAt", "updatedAt")
         VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, NOW(), NOW())
         ON CONFLICT DO NOTHING`,
        workId,
        entry.term,
        entry.definition,
        entry.type ?? 'term',
        entry.chapterIntroduced ?? 1
      )

      const inserted = await prisma.glossaryEntry.findFirst({
        where: { workId, term: entry.term },
      })
      if (inserted) {
        await prisma.$executeRawUnsafe(
          `INSERT INTO glossary_definition_versions (id, "glossaryEntryId", definition, "fromChapter", "createdAt")
           VALUES (gen_random_uuid()::text, $1, $2, $3, NOW())
           ON CONFLICT DO NOTHING`,
          inserted.id,
          entry.definition,
          entry.chapterIntroduced ?? 1
        )
      }
      created++
    } catch (err) {
      console.error(`Failed to insert glossary entry "${entry.term}":`, err)
    }
  }

  return created
}
