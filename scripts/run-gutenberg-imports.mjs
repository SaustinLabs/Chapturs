/**
 * Standalone Gutenberg import runner.
 * Usage: DATABASE_URL=... OPENROUTER_API_KEY=... node scripts/run-gutenberg-imports.mjs
 */

import { runGutenbergImport } from '../src/lib/gutenberg-import/importer.ts'

const BOOKS = [
  { id: 345,  title: 'Dracula',                    author: 'Bram Stoker' },
  { id: 1342, title: 'Pride and Prejudice',        author: 'Jane Austen' },
  { id: 84,   title: 'Frankenstein',               author: 'Mary Shelley' },
  { id: 1661, title: 'Adventures of Sherlock Holmes', author: 'Arthur Conan Doyle' },
  { id: 1184, title: 'The Count of Monte Cristo',  author: 'Alexandre Dumas' },
]

async function main() {
  console.log('📚 Gutenberg Import Runner')
  console.log('=' .repeat(50))

  for (const book of BOOKS) {
    console.log(`\n📖 Importing: ${book.title} by ${book.author} (ID: ${book.id})`)
    console.log('-'.repeat(40))

    try {
      const result = await runGutenbergImport(book.id, {
        maxChapters: 100,
        maturityRating: 'PG',
      })

      console.log('✅ Result:', JSON.stringify(result, null, 2))
    } catch (err) {
      console.error(`❌ Failed to import ${book.title}:`, err.message)
    }
  }

  console.log('\n✨ All imports complete!')
}

main().catch(console.error)
