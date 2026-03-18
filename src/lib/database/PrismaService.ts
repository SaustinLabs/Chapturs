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

  static async getSectionsForWork(workId: string) {
    const sections = await prisma.section.findMany({
      where: { workId },
      orderBy: { createdAt: 'asc' }
    });
  return sections.map((section: any) => ({
      id: section.id,
      workId: section.workId,
      title: section.title,
      chapterNumber: 1, // TODO: Implement proper chapter numbering
      orderIndex: 0, // TODO: Implement proper ordering
      content: JSON.parse(section.content),
      wordCount: section.wordCount || 0,
      estimatedReadTime: Math.ceil((section.wordCount || 0) / 200), // Rough estimate
      publishedAt: section.publishedAt?.toISOString(),
      isPublished: section.status === 'published',
      definitions: [] // TODO: Implement definitions
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
    const section = await prisma.section.create({
      data: {
        workId: data.workId,
        title: data.title,
        content: JSON.stringify(data.content),
        wordCount: data.wordCount,
        status: data.status || 'draft'
      }
    });
    return {
      id: section.id,
      workId: section.workId,
      title: section.title,
      chapterNumber: 1,
      orderIndex: 0,
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
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            title: true,
            content: true,
            wordCount: true,
            status: true,
            publishedAt: true,
            createdAt: true,
            updatedAt: true
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

  static async toggleBookmark(workId: string, userId: string) {
    const existing = await prisma.bookmark.findFirst({ where: { workId, userId } })
    if (existing) {
      await prisma.bookmark.delete({ where: { id: existing.id } })
      return false
    }
    await prisma.bookmark.create({ data: { workId, userId } })
    return true
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
    // Minimal search shim: basic title/description contains search
    const where: any = { AND: [] }
    if (query) {
      where.AND.push({ OR: [{ title: { contains: query } }, { description: { contains: query } }] })
    }
    if (filters?.authorId) where.AND.push({ authorId: filters.authorId })
    const works = await prisma.work.findMany({ where, take: 50 })
    return works.map((w: any) => ({ id: w.id, title: w.title, status: w.status } as any))
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
}