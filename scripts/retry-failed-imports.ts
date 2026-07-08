/**
 * Retry failed Gutenberg imports.
 * Run: DATABASE_URL=... DIRECT_URL=... OPENROUTER_API_KEY=... npx tsx scripts/retry-failed-imports.ts
 */
import { runGutenbergImport } from '../src/lib/gutenberg-import/importer'

const RETRIES = [
  { id: 174,   name: 'The Picture of Dorian Gray',      author: 'Oscar Wilde' },
  { id: 2600,  name: 'War and Peace',                    author: 'Leo Tolstoy' },
  { id: 4300,  name: 'Ulysses',                          author: 'James Joyce' },
  { id: 1952,  name: 'The Yellow Wallpaper',             author: 'Charlotte Perkins Gilman' },
  { id: 2542,  name: 'A Dolls House',                    author: 'Henrik Ibsen' },
]

async function main() {
  console.log(`=== Retrying ${RETRIES.length} Failed Gutenberg Imports ===\n`)
  let success = 0, failed = 0

  for (const work of RETRIES) {
    process.stdout.write(`${work.name} (#${work.id})... `)
    try {
      const t0 = Date.now()
      const result = await runGutenbergImport(work.id)
      const secs = ((Date.now() - t0) / 1000).toFixed(0)
      if (result.status === 'already_imported') {
        console.log(`skip (already imported)`)
      } else {
        console.log(`done (${secs}s, ${result.sectionsCreated} ch)`)
        success++
      }
    } catch (err: any) {
      console.log(`FAILED: ${err.message}`)
      failed++
    }
  }

  console.log(`\n=== Done ===`)
  console.log(`Imported: ${success} | Failed: ${failed}`)
}

main().catch(console.error)
