/**
 * Strip Gutenberg artifacts from existing imported works (chapters only — doesn't re-import).
 * Run: DATABASE_URL=... DIRECT_URL=... npx tsx scripts/strip-gutenberg-artifacts.ts
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const works = await prisma.work.findMany({
    where: { tags: { contains: 'gutenberg' } },
    select: { id: true, title: true },
  })

  console.log(`=== Stripping Gutenberg artifacts from ${works.length} works ===\n`)

  let totalFixed = 0

  for (const work of works) {
    const sections = await prisma.section.findMany({
      where: { workId: work.id },
      select: { id: true, title: true, content: true, chapterNumber: true },
    })

    let fixed = 0
    for (const s of sections) {
      const oldTitle = s.title
      const newTitle = oldTitle
        .replace(/\[Illustration\]\s*/gi, '')
        .replace(/^Chapter\s+([IVXLCDM]+|\d+):\s*\[?Illustration:?\s*\]?\s*/i, 'Chapter $1: ')
        .replace(/\s*\[_?Illustration[^\]]*\]\s*/gi, '')
        .trim()

      // Parse and clean content
      let content: any
      try { content = typeof s.content === 'string' ? JSON.parse(s.content) : s.content }
      catch { continue }

      let contentChanged = false
      if (content?.blocks) {
        for (const block of content.blocks) {
          if (typeof block.text === 'string') {
            const old = block.text
            block.text = block.text
              .replace(/\[_Copyright[^\]]*\]\s*/gi, '')
              .replace(/\[_?Illustration[^\]]*\]\s*/gi, '')
              .replace(/\[_?Illustration\][^\n]*/gi, '')
              .replace(/\n{3,}/g, '\n\n')
            if (block.text !== old) contentChanged = true
          }
        }
      }

      if (newTitle !== oldTitle || contentChanged) {
        await prisma.section.update({
          where: { id: s.id },
          data: {
            title: newTitle,
            ...(contentChanged ? { content: JSON.stringify(content) } : {}),
          },
        })
        fixed++
      }
    }

    console.log(`${work.title}: cleaned ${fixed}/${sections.length} chapters`)
    totalFixed += fixed
  }

  console.log(`\nTotal chapters cleaned: ${totalFixed}`)
}

main().then(() => prisma.$disconnect()).catch(e => { console.error(e); prisma.$disconnect() })
