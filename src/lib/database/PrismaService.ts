import * as PrismaPkg from '@prisma/client'
import { Work, FeedItem, Author, User } from '@/types'

// Some environments may not expose named exports properly; use the namespace import as a fallback.
const PrismaClient: any = (PrismaPkg as any).PrismaClient || (PrismaPkg as any).default

// Global Prisma instance with connection pooling for Supabase
const globalForPrisma = global as unknown as { prisma: any }

// Lazily initialize Prisma  Edefers construction until first use.
// This prevents Next.js static page collection from failing when DATABASE_URL
// is not set in the build environment.
function getPrismaClient() {
  if (!globalForPrisma.prisma) {
    const dbUrl = process.env.DATABASE_URL
    
    if (!dbUrl) {
      console.error('❁EPrisma Error: DATABASE_URL is not defined in the environment.')
      if (process.env.NODE_ENV === 'production') {
        throw new Error('Critical: DATABASE_URL missing in production.')
      }
    }

    globalForPrisma.prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
      datasources: {
        db: {
          url: dbUrl || 'postgresql://placeholder:5432/placeholder', // Fallback for build time
        },
      },
    })
  }
  return globalForPrisma.prisma
}

export const prisma: any = new Proxy({} as any, {
  get(_target, prop) {
    return getPrismaClient()[prop]
  }
})


// Connection health check with retry
export async function ensureConnection(retries = 3): Promise<boolean> {
  for (let i = 0; i < retries; i++) {
    try {
      await prisma.$queryRaw`SELECT 1`
      return true
    } catch (error) {
      console.error(`Database connection attempt ${i + 1} failed:`, error)
      if (i < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1))) // Exponential backoff
      }
    }
  }
  return false
}

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect()
})



export default class DatabaseService {
  static async getUserByEmail(email: string): Promise<User | null> {
    const user = await prisma.user.findUnique({
      where: { email },
    });
    if (!user) return null;
    return this.mapPrismaUserToUser(user);
  }

  static async updateUserMonetization(userId: string, adSupportLevel?: string, isPremium?: boolean): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: {
        ...(adSupportLevel ? { adSupportLevel } : {}),
        ...(typeof isPremium === 'boolean' ? { isPremium } : {}),
      },
    });
  }

  static mapPrismaUserToUser(prismaUser: any): User {
    return {
      id: prismaUser.id,
      email: prismaUser.email,
      name: prismaUser.displayName || prismaUser.username || '',
      image: prismaUser.avatar,
      createdAt: prismaUser.createdAt,
      readingHistory: [],
      subscriptions: [],
      bookmarks: [],
      preferences: {
        preferredFormats: [],
        mutedFormats: [],
        readingMode: 'scroll',
        theme: 'light',
        autoPlayComics: false,
        glossaryTooltips: true,
        contentFilters: {
          maturityLevel: 'all',
          languages: [],
          excludedGenres: []
        }
      },
      adSupportLevel: prismaUser.adSupportLevel as 'normal' | 'boosted' | 'video',
      isPremium: prismaUser.isPremium || false,
    };
  }

  /**
   * Lightweight list — returns metadata only (no chapter content).
   * Use for TOC / chapter lists. Avoids fetching potentially megabytes of
   * chapter JSON just to render a list of titles.
   */
  static async getSectionsList(workId: string) {
    const sections = await prisma.section.findMany({
      where: { workId },
      orderBy: [{ chapterNumber: 'asc' }, { createdAt: 'asc' }],
      select: {
        id: true,
        workId: true,
        title: true,
        wordCount: true,
        status: true,
        publishedAt: true,
        createdAt: true,
        updatedAt: true,
        chapterNumber: true,
      }
    });
    return sections.map((section: any, i: number) => ({
      id: section.id,
      workId: section.workId,
      title: section.title,
      chapterNumber: section.chapterNumber ?? (i + 1),
      orderIndex: i,
      wordCount: section.wordCount || 0,
      estimatedReadTime: Math.ceil((section.wordCount || 0) / 200),
      publishedAt: section.publishedAt?.toISOString(),
      isPublished: section.status === 'published',
      status: section.status,
    }));
  }

  /** Full sections — includes chapter content. Use only when content is needed (e.g. reading a chapter). */
  static async getSectionsForWork(workId: string) {
    const sections = await prisma.section.findMany({
      where: { workId },
      orderBy: [{ chapterNumber: 'asc' }, { createdAt: 'asc' }],
    });
    return sections.map((section: any, i: number) => ({
      id: section.id,
      workId: section.workId,
      title: section.title,
      chapterNumber: section.chapterNumber ?? (i + 1),
      orderIndex: i,
      content: JSON.parse(section.content),
      wordCount: section.wordCount || 0,
      estimatedReadTime: Math.ceil((section.wordCount || 0) / 200),
      publishedAt: section.publishedAt?.toISOString(),
      isPublished: section.status === 'published',
      definitions: []
    }));
  }

  static sectionTitle(section: { id: number; title?: string }) {
    return section.title ?? ''
  }

  static async createSection(data: {
    workId: string;
    title: string;
    content: any;
    wordCount: number;
    status?: string;
  }) {
    const existingCount = await prisma.section.count({ where: { workId: data.workId } });
    const nextChapterNumber = existingCount + 1;
    const section = await prisma.section.create({
      data: {
        workId: data.workId,
        title: data.title,
        content: JSON.stringify(data.content),
        wordCount: data.wordCount,
        status: data.status || 'draft',
        chapterNumber: nextChapterNumber,
      }
    });
    return {
      id: section.id,
      workId: section.workId,
      title: section.title,
      chapterNumber: section.chapterNumber ?? nextChapterNumber,
      orderIndex: existingCount,
      content: JSON.parse(section.content),
      wordCount: section.wordCount || 0,
      estimatedReadTime: Math.ceil((section.wordCount || 0) / 200),
      publishedAt: section.publishedAt?.toISOString(),
      isPublished: section.status === 'published',
      definitions: []
    };
  }

  // --- Lightweight shims to satisfy existing callers (map Prisma records to app types) ---
  static async getWork(workId: string) {
    const work = await prisma.work.findUnique({
      where: { id: workId },
      include: { 
        author: { include: { user: true } },
        sections: {
          where: { status: 'published' },
          orderBy: [{ chapterNumber: 'asc' }, { createdAt: 'asc' }],
          select: {
            id: true,
            title: true,
            // content intentionally excluded — story landing page only needs the chapter list
            wordCount: true,
            status: true,
            publishedAt: true,
            createdAt: true,
            updatedAt: true,
            chapterNumber: true,
          }
        }
      }
    })
    if (!work) return null
    const authorUser = (work as any).author?.user
    return {
      id: work.id,
      title: work.title,
      description: work.description,
      author: authorUser
        ? {
            id: authorUser.id,
            username: authorUser.username,
            displayName: authorUser.displayName,
            avatar: authorUser.avatar,
            verified: authorUser.verified || false
          }
        : null,
      authorId: work.authorId,
      formatType: work.formatType,
      coverImage: work.coverImage,
      status: work.status,
      maturityRating: work.maturityRating,
      aiUseDisclosure: (work as any).aiUseDisclosure ?? 'none',
      genres: JSON.parse((work as any).genres || '[]'),
      tags: JSON.parse((work as any).tags || '[]'),
      statistics: JSON.parse((work as any).statistics || '{}'),
      createdAt: work.createdAt,
      updatedAt: work.updatedAt,
      languages: [],
      thumbnails: [],
      sections: (work as any).sections || [],
      glossary: undefined
    } as any
  }

  static async toggleBookmark(workId: string, userId: string, shelf = 'reading') {
    const existing = await prisma.bookmark.findFirst({ where: { workId, userId } })
    if (existing) {
      await prisma.bookmark.delete({ where: { id: existing.id } })
      return false
    }
    await prisma.bookmark.create({ data: { workId, userId, shelf } })
    return true
  }

  static async updateBookmarkShelf(workId: string, userId: string, shelf: string) {
    await prisma.bookmark.updateMany({ where: { workId, userId }, data: { shelf } })
  }

  static async checkUserBookmark(userId: string, workId: string) {
    const existing = await prisma.bookmark.findFirst({ where: { userId, workId } })
    return !!existing
  }

  static async toggleSubscription(authorId: string, userId: string) {
    const existing = await prisma.subscription.findFirst({ where: { authorId, userId } })
    if (existing) {
      await prisma.subscription.delete({ where: { id: existing.id } })
      return false
    }
    await prisma.subscription.create({ data: { authorId, userId } })
    return true
  }

  static async checkUserSubscription(userId: string, authorId: string) {
    const existing = await prisma.subscription.findFirst({ where: { userId, authorId } })
    return !!existing
  }

  static async searchWorks(query: string, filters: any) {
    const where: any = { AND: [{ status: 'published' }] }

    if (query) {
      where.AND.push({
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
        ],
      })
    }

    if (filters?.authorId) where.AND.push({ authorId: filters.authorId })
    if (filters?.formatType) where.AND.push({ formatType: filters.formatType })
    if (filters?.status && filters.status !== 'all') {
      where.AND.push({ status: filters.status })
    }

    const works = await prisma.work.findMany({
      where,
      take: 50,
      orderBy: { updatedAt: 'desc' },
      include: {
        author: { include: { user: { select: { id: true, username: true, displayName: true, avatar: true } } } },
        _count: { select: { sections: true, bookmarks: true, likes: true } },
      },
    })

    return works.map((w: any) => ({
      id: w.id,
      title: w.title,
      description: w.description,
      coverImage: w.coverImage,
      status: w.status,
      maturityRating: w.maturityRating,
      formatType: w.formatType,
      genres: typeof w.genres === 'string' ? JSON.parse(w.genres) : (w.genres || []),
      tags: typeof w.tags === 'string' ? JSON.parse(w.tags) : (w.tags || []),
      updatedAt: w.updatedAt,
      createdAt: w.createdAt,
      chapterCount: w._count?.sections || 0,
      bookmarkCount: w._count?.bookmarks || 0,
      likeCount: w._count?.likes || 0,
      author: w.author?.user
        ? {
            id: w.author.user.id,
            username: w.author.user.username,
            displayName: w.author.user.displayName,
            avatar: w.author.user.avatar,
          }
        : null,
    }))
  }

  static async getUser(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) return null
    return this.mapPrismaUserToUser(user)
  }

  static async toggleLike(workId: string, userId: string) {
    const existing = await prisma.like.findFirst({ where: { workId, userId } })
    if (existing) {
      await prisma.like.delete({ where: { id: existing.id } })
      return false
    }
    await prisma.like.create({ data: { workId, userId } })
    return true
  }

  static async checkUserLike(userId: string, workId: string) {
    const existing = await prisma.like.findFirst({ where: { userId, workId } })
    return !!existing
  }

  static async getAllWorks() {
    const works = await prisma.work.findMany({ take: 100 })
    return works.map((w: any) => ({ id: w.id, title: w.title, status: w.status } as any))
  }

  static async seedDatabase() {
    // Stub for seed script - implement actual seeding logic if needed
    console.log('Seed database called - implement seeding logic in prisma/seed.ts')
  }

  /** Fetch a single section with full content — for server-side chapter rendering. */
  static async getSection(workId: string, sectionId: string) {
    const section = await prisma.section.findFirst({
      where: { id: sectionId, workId }
    })
    if (!section) return null
    let content: any
    try {
      content = typeof section.content === 'string' ? JSON.parse(section.content) : section.content
    } catch {
      content = section.content
    }
    return {
      id: section.id,
      workId: section.workId,
      title: section.title,
      chapterNumber: section.chapterNumber ?? 1,
      orderIndex: 0,
      content,
      wordCount: section.wordCount || 0,
      estimatedReadTime: Math.ceil((section.wordCount || 0) / 200),
      publishedAt: section.publishedAt?.toISOString(),
      isPublished: section.status === 'published',
      status: section.status,
      definitions: [],
    }
  }
}