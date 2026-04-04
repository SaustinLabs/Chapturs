import { MetadataRoute } from 'next'
import { prisma } from '@/lib/database/PrismaService'

const BASE_URL = 'https://chapturs.com'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${BASE_URL}/explore`, lastModified: new Date(), changeFrequency: 'hourly', priority: 0.8 },
    { url: `${BASE_URL}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
  ]

  try {
    const works = await prisma.work.findMany({
      where: { status: 'published' },
      select: { id: true, updatedAt: true },
    })

    const workRoutes: MetadataRoute.Sitemap = works.map((w) => ({
      url: `${BASE_URL}/story/${w.id}`,
      lastModified: w.updatedAt,
      changeFrequency: 'weekly',
      priority: 0.7,
    }))

    return [...staticRoutes, ...workRoutes]
  } catch {
    return staticRoutes
  }
}
