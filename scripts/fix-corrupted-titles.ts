/**
 * Fix corrupted Gutenberg chapter titles — merges leaked narrative text back
 * into content blocks and sets clean titles.
 * Run: DATABASE_URL=... DIRECT_URL=... npx tsx scripts/fix-corrupted-titles.ts
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function fixCorruptedTitles(workTitle: string) {
  const work = await prisma.work.findFirst({
    where: { title: { contains: workTitle } },
    select: { id: true, title: true },
  })
  if (!work) { console.log(`${workTitle}: not found`); return { fixed: 0, skipped: 0 } }

  const sections = await prisma.section.findMany({
    where: { workId: work.id },
    select: { id: true, title: true, content: true, chapterNumber: true },
    orderBy: { chapterNumber: 'asc' },
  })

  const corrupted = sections.filter(s => s.title.length > 50)
  if (corrupted.length === 0) {
    console.log(`${work.title}: clean — 0/${sections.length} corrupted`)
    return { fixed: 0, skipped: sections.length }
  }

  let fixed = 0
  for (const s of corrupted) {
    const match = s.title.match(/^(Chapter [IVXLCDM]+):?\s*(.*)$/i)
    if (!match) continue

    const cleanTitle = match[1] // "Chapter I"
    const leakedText = match[2] // narrative text that leaked into title

    // Parse content
    let content: any
    try {
      content = typeof s.content === 'string' ? JSON.parse(s.content) : s.content
    } catch { continue }

    // Prepend leaked text to first prose block
    if (content?.blocks?.length > 0 && content.blocks[0].type === 'prose') {
      content.blocks[0].text = leakedText + ' ' + content.blocks[0].text
    }

    await prisma.section.update({
      where: { id: s.id },
      data: { title: cleanTitle, content: JSON.stringify(content) },
    })
    fixed++
  }

  console.log(`${work.title}: fixed ${fixed}/${corrupted.length} corrupted of ${sections.length} chapters`)
  return { fixed, skipped: sections.length - corrupted.length }
}

async function main() {
  // Only fix the 2 works with confirmed title corruption
  const targets = ['Dorian Gray', 'War and Peace']

  let totalFixed = 0
  for (const t of targets) {
    const r = await fixCorruptedTitles(t)
    totalFixed += r.fixed
  }

  console.log(`\nTotal fixed: ${totalFixed} chapters`)
}

main().then(() => prisma.$disconnect()).catch(e => { console.error(e); prisma.$disconnect() })
