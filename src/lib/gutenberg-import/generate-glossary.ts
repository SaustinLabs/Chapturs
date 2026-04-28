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
 * Extract glossary terms from the first ~3000 words of a work.
 */
export async function generateGlossaryForWork(
  workId: string,
  workTitle: string,
  sampleText: string,
): Promise<number> {
  const prompt = `You are a literary analyst. Read the following excerpt from "${workTitle}" and extract 8-12 important terms: characters, places, organisations, objects, or concepts that a reader would benefit from having defined. Return a JSON array only, no prose:
[
  { "term": "...", "definition": "...", "type": "character|place|item|concept|term", "chapterIntroduced": 1 }
]
Excerpt:
${sampleText.slice(0, 4000)}`

  try {
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

    let count = 0
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
      count++
    }

    return count
  } catch (err) {
    console.error('[Glossary] Error generating glossary:', err)
    return 0 // Non-fatal: work is imported without glossary
  }
}
