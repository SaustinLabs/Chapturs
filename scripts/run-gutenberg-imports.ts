/**
 * Gutenberg import runner — seeds the production DB with public domain works.
 * Run: OPENROUTER_API_KEY=... DATABASE_URL=... DIRECT_URL=... npx tsx scripts/run-gutenberg-imports.ts
 */
import { runGutenbergImport } from '../src/lib/gutenberg-import/importer'

const IMPORTS = [
  { id: 345,   name: 'Dracula',                  author: 'Bram Stoker' },
  { id: 1342,  name: 'Pride and Prejudice',       author: 'Jane Austen' },
  { id: 1184,  name: 'The Count of Monte Cristo', author: 'Alexandre Dumas' },
  { id: 84,    name: 'Frankenstein',              author: 'Mary Shelley' },
  { id: 1661,  name: 'The Adventures of Sherlock Holmes', author: 'Arthur Conan Doyle' },
]

async function main() {
  console.log(`=== Gutenberg Import Runner ===`)
  console.log(`Works to import: ${IMPORTS.length}\n`)

  for (const work of IMPORTS) {
    console.log(`\n--- Importing ${work.name} (#${work.id}) ---`)

    try {
      const start = Date.now()
      const result = await runGutenbergImport(work.id)
      const elapsed = ((Date.now() - start) / 1000).toFixed(1)

      if (result.status === 'already_imported') {
        console.log(`  ⏭️  Already imported (${result.workId})`)
      } else {
        console.log(`  ✅ Imported in ${elapsed}s`)
        console.log(`     Work ID: ${result.workId}`)
        console.log(`     Chapters: ${result.sectionsCreated}`)
      }
    } catch (err: any) {
      console.error(`  ❌ FAILED: ${err.message}`)
      if (err.stack) {
        console.error(`     ${err.stack.split('\n').slice(0, 3).join('\n     ')}`)
      }
    }
  }

  console.log(`\n=== Done ===`)
}

main().catch(console.error)
