import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/creator/', '/admin/'],
      },
    ],
    sitemap: 'https://chapturs.com/sitemap.xml',
  }
}
