import OpenAI from 'openai'

const client = new OpenAI({
  apiKey:   process.env.OPENROUTER_API_KEY,
  baseURL:  'https://openrouter.ai/api/v1',
  defaultHeaders: {
    'HTTP-Referer': 'https://chapturs.com',
    'X-Title':      'Chapturs',
  },
})

/**
 * Extract character profiles from the first ~3000 words of a work.
 */
export async function generateCharactersForWork(
  workId: string,
  workTitle: string,
  sampleText: string,
): Promise<number> {
  const prompt = `You are a literary analyst. Read the following excerpt from "${workTitle}" and extract the 4-8 most significant characters. Return a JSON array only:
[
  {
    "name": "...",
    "role": "protagonist|antagonist|supporting",
    "quickGlance": "One-sentence description (max 100 chars)",
    "backstory": "2-3 sentence background",
    "personalityTraits": ["trait1", "trait2", "trait3"],
    "firstAppearance": 1
  }
]
Excerpt:
${sampleText.slice(0, 4000)}`

  try {
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

    let count = 0
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
      count++
    }

    return count
  } catch (err) {
    console.error('[Characters] Error generating characters:', err)
    return 0 // Non-fatal: work is imported without character profiles
  }
}
