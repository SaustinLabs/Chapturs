import { prisma } from '@/lib/database/PrismaService'

/**
 * Ensure the bot user and author record exist for Gutenberg imports.
 * All imported works share one bot User + one Author record.
 */
export async function ensureBotAuthor() {
  const BOT_EMAIL = 'bot-imports@chapturs.com'
  const BOT_USERNAME = 'chapturs_classics'

  // Upsert the bot user (never overwrite existing data)
  let botUser = await prisma.user.upsert({
    where: { email: BOT_EMAIL },
    create: {
      email:       BOT_EMAIL,
      username:    BOT_USERNAME,
      displayName: 'Chapturs Classics',
      bio:         'Public domain literary works imported from Project Gutenberg.',
      verified:    true,
      role:        'user',
    },
    update: {}, // never overwrite
  })

  // Upsert the bot author record (never overwrite existing data)
  let botAuthor = await prisma.author.upsert({
    where: { userId: botUser.id },
    create: { userId: botUser.id, verified: true },
    update: {},
  })

  return { botUser, botAuthor }
}
