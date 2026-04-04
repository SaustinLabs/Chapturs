import { MetadataRoute } from 'next'
import { prisma } from '@/lib/database/PrismaService'

const BASE_URL = process.env.NEXTAUTH_URL || 'https://chapturs.com'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${BASE_URL}/browse`, lastModified: new Date(), changeFrequency: 'hourly', priority: 0.9 },
    { url: `${BASE_URL}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/contests`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.6 },
    { url: `${BASE_URL}/fan-content`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.5 },
  ]

  try {
    const [works, users] = await Promise.all([
      prisma.work.findMany({
        where: { status: { in: ['published', 'ongoing', 'completed'] } },
        select: { id: true, updatedAt: true },
        orderBy: { updatedAt: 'desc' },
        take: 5000,
      }),
      prisma.user.findMany({
        select: { username: true, updatedAt: true },
        orderBy: { updatedAt: 'desc' },
        take: 5000,
      }),
    ])

    const workRoutes: MetadataRoute.Sitemap = works.map((w) => ({
      url: `${BASE_URL}/story/${w.id}`,
      lastModified: w.updatedAt,
      changeFrequency: 'weekly',
      priority: 0.8,
    }))

    const profileRoutes: MetadataRoute.Sitemap = users
      .filter((u) => u.username)
      .map((u) => ({
        url: `${BASE_URL}/profile/${u.username}`,
        lastModified: u.updatedAt,
        changeFrequency: 'weekly',
        priority: 0.7,
      }))

    return [...staticRoutes, ...workRoutes, ...profileRoutes]
  } catch {
    return staticRoutes
  }
}

