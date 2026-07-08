/**
 * Batch alias generator — populates glossary entry aliases for all Gutenberg works.
 * Asks the LLM directly since it knows all classic literature.
 * 
 * Run: DATABASE_URL=... DIRECT_URL=... OPENROUTER_API_KEY=... npx tsx scripts/generate-aliases.ts
 */
import { PrismaClient } from '@prisma/client'

const LLM_MODEL = process.env.LLM_QA_MODEL || 'meta-llama/llama-3.3-70b-instruct'
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY!

const prisma = new PrismaClient()

async function generateAliases(term: string, definition: string, workTitle: string): Promise<string[]> {
  const prompt = `You are a literary scholar. Given a glossary term from "${workTitle}", generate search aliases so readers can find this term in the text even when it's written differently.

Term: "${term}"
Definition: "${definition}"

Rules:
- For character names (e.g. "Clerval, Henry"): add aliases like "Clerval", "Henry Clerval", "Henry"
- For titles/prefixes (e.g. "Professor Abraham Van Helsing"): add "Van Helsing", "Abraham", "Professor Van Helsing"  
- For concepts/places (e.g. "The Demogorgon"): add common shorthand and alternate spellings
- Include the original term as-is as the first alias
- Don't add aliases that would match common words or be false positives
- Return ONLY a JSON array of strings, nothing else

Example output: ["Clerval, Henry", "Clerval", "Henry Clerval", "Henry"]`

  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: LLM_MODEL,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1,
        max_tokens: 500,
      }),
    })

    const data = await res.json() as any
    const text = data.choices?.[0]?.message?.content?.trim() || '[]'
    
    // Extract JSON array from response
    const match = text.match(/\[[\s\S]*\]/)
    if (!match) return [term]
    
    return JSON.parse(match[0])
  } catch (err) {
    console.error(`  Failed to generate aliases for "${term}":`, err instanceof Error ? err.message : err)
    return [term]
  }
}

async function main() {
  if (!OPENROUTER_API_KEY) {
    console.error('OPENROUTER_API_KEY not set')
    process.exit(1)
  }

  // Get all Gutenberg works
  const works = await prisma.work.findMany({
    where: { tags: { contains: 'gutenberg' } },
    select: { id: true, title: true, _count: { select: { glossaryEntries: true } } },
  })

  console.log(`=== Glossary Alias Generator ===`)
  console.log(`Works: ${works.length}\n`)

  let totalGenerated = 0
  let totalSkipped = 0

  for (const work of works) {
    // Only get entries WITHOUT aliases
    const entries = await prisma.glossaryEntry.findMany({
      where: {
        workId: work.id,
        aliases: null,
      },
      select: { id: true, term: true, definition: true },
    })

    if (entries.length === 0) {
      console.log(`${work.title}: all ${work._count.glossaryEntries} entries already have aliases`)
      continue
    }

    console.log(`${work.title}: generating aliases for ${entries.length}/${work._count.glossaryEntries} entries...`)

    for (const entry of entries) {
      process.stdout.write(`  ${entry.term}... `)
      const aliases = await generateAliases(entry.term, entry.definition, work.title)
      
      await prisma.glossaryEntry.update({
        where: { id: entry.id },
        data: { aliases: JSON.stringify(aliases) },
      })

      console.log(`${aliases.length} aliases`)
      totalGenerated++
      
      // Rate limit: 200ms between API calls
      await new Promise(r => setTimeout(r, 200))
    }
  }

  console.log(`\n=== Done ===`)
  console.log(`Generated: ${totalGenerated} | Total in DB: ${await prisma.glossaryEntry.count()}`)
}

main().then(() => prisma.$disconnect()).catch(e => { console.error(e); prisma.$disconnect() })
