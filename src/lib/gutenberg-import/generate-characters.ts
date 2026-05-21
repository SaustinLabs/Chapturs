/**
 * AI character profile generation for Gutenberg imports.
 * For classic literature, the LLM already knows the characters intimately.
 * Just ask directly — no need to make it guess from raw text samples.
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

export async function generateCharactersForWork(
  workId: string,
  workTitle: string,
  authorName: string
): Promise<number> {
  const prompt = `You are a literary scholar creating character profiles for "${workTitle}" by ${authorName}.

Extract 5–10 of the most significant characters. For each, provide a concise but insightful profile suitable for readers encountering the work for the first time. Keep descriptions spoiler-free — describe the character as they appear early in the work.

Return a JSON array only:
[
  {
    "name": "Elizabeth Bennet",
    "role": "protagonist",
    "quickGlance": "The witty and independent second daughter of the Bennet family, whose sharp judgment of character is both her greatest strength and her central flaw.",
    "backstory": "Elizabeth is the favorite daughter of Mr. Bennet, sharing his sharp wit and disdain for social pretension. She lives at Longbourn with her parents and four sisters, facing the pressure of finding a suitable marriage in a society where the family estate is entailed away from the female line. Her intelligence and lively spirit set her apart from the conventional expectations of a Regency-era young woman.",
    "personalityTraits": ["Intelligent", "Witty", "Independent", "Prejudiced", "Principled"],
    "firstAppearance": 1
  }
]

Each profile should feel like it was written by someone who genuinely knows and loves the book. Definitions should be 1-3 sentences for quickGlance, 2-4 for backstory.`

  const resp = await client.chat.completions.create({
    model: MODEL,
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 2000,
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

  let created = 0
  for (const char of characters) {
    if (!char.name) continue

    try {
      await prisma.$executeRawUnsafe(
        `INSERT INTO character_profiles (
          id, "workId", name, role, "quickGlance", backstory,
          "personalityTraits", "firstAppearance", "allowUserSubmissions",
          "createdAt", "updatedAt"
        )
        VALUES (
          gen_random_uuid()::text, $1, $2, $3, $4, $5,
          $6, $7, false, NOW(), NOW()
        )
        ON CONFLICT DO NOTHING`,
        workId,
        char.name,
        char.role ?? 'supporting',
        char.quickGlance ?? null,
        char.backstory ?? null,
        JSON.stringify(char.personalityTraits ?? []),
        char.firstAppearance ?? 1
      )
      created++
    } catch (err) {
      console.error(`Failed to insert character "${char.name}":`, err)
    }
  }

  return created
}
