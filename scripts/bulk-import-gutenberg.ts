/**
 * Bulk Gutenberg import — seeds 20 more public domain works.
 * Run: OPENROUTER_API_KEY=... DATABASE_URL=... DIRECT_URL=... npx tsx scripts/bulk-import-gutenberg.ts
 */
import { runGutenbergImport } from '../src/lib/gutenberg-import/importer'

// 20 well-known public domain works across genres — good variety for a library
const BULK_IMPORTS = [
  { id: 43,    name: 'Dr Jekyll and Mr Hyde',              author: 'Robert Louis Stevenson' },
  { id: 164,   name: 'Twenty Thousand Leagues Under the Sea', author: 'Jules Verne' },
  { id: 174,   name: 'The Picture of Dorian Gray',          author: 'Oscar Wilde' },
  { id: 11,    name: 'Alice in Wonderland',                 author: 'Lewis Carroll' },
  { id: 2701,  name: 'Moby Dick',                           author: 'Herman Melville' },
  { id: 98,    name: 'A Tale of Two Cities',                author: 'Charles Dickens' },
  { id: 1400,  name: 'Great Expectations',                  author: 'Charles Dickens' },
  { id: 2600,  name: 'War and Peace',                       author: 'Leo Tolstoy' },
  { id: 4300,  name: 'Ulysses',                             author: 'James Joyce' },
  { id: 1260,  name: 'Jane Eyre',                           author: 'Charlotte Bronte' },
  { id: 768,   name: 'Wuthering Heights',                   author: 'Emily Bronte' },
  { id: 5200,  name: 'Metamorphosis',                       author: 'Franz Kafka' },
  { id: 74,    name: 'The Adventures of Tom Sawyer',        author: 'Mark Twain' },
  { id: 76,    name: 'Adventures of Huckleberry Finn',      author: 'Mark Twain' },
  { id: 55,    name: 'The Wonderful Wizard of Oz',          author: 'L Frank Baum' },
  { id: 20203, name: 'Autobiography of Benjamin Franklin',   author: 'Benjamin Franklin' },
  { id: 1952,  name: 'The Yellow Wallpaper',                author: 'Charlotte Perkins Gilman' },
  { id: 2542,  name: 'A Dolls House',                       author: 'Henrik Ibsen' },
  { id: 408,   name: 'The Souls of Black Folk',             author: 'WEB Du Bois' },
  { id: 244,   name: 'A Study in Scarlet',                  author: 'Arthur Conan Doyle' },
]

async function main() {
  console.log(`=== Bulk Gutenberg Import ===`)
  console.log(`Works to import: ${BULK_IMPORTS.length}\n`)

  let imported = 0
  let skipped = 0
  let failed = 0
  const startAll = Date.now()

  for (const work of BULK_IMPORTS) {
    process.stdout.write(`${work.name} (#${work.id})... `)

    try {
      const t0 = Date.now()
      const result = await runGutenbergImport(work.id)
      const secs = ((Date.now() - t0) / 1000).toFixed(0)

      if (result.status === 'already_imported') {
        console.log(`skip (already imported)`)
        skipped++
      } else {
        console.log(`done (${secs}s, ${result.sectionsCreated} ch)`)
        imported++
      }
    } catch (err: any) {
      console.log(`FAILED: ${err.message}`)
      failed++
    }
  }

  const total = ((Date.now() - startAll) / 60000).toFixed(1)
  console.log(`\n=== Done in ${total}m ===`)
  console.log(`Imported: ${imported} | Skipped: ${skipped} | Failed: ${failed}`)
}

main().catch(console.error)
