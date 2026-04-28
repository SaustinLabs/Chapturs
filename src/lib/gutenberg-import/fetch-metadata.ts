import { prisma } from '@/lib/database/PrismaService'

const GENRE_MAP: Record<string, string> = {
  'adventure':       'Adventure',
  'horror':          'Horror',
  'gothic':          'Gothic',
  'romance':         'Romance',
  'mystery':         'Mystery',
  'science fiction': 'Science Fiction',
  'historical':      'Historical Fiction',
  'fantasy':         'Fantasy',
}

export interface GutendexBook {
  id: number
  title: string
  authors: Array<{ name: string }>
  subjects: string[]
  bookshelves: string[]
  formats: Record<string, string>
  download_count?: number
}

export async function fetchGutendexMetadata(gutenbergId: number): Promise<GutendexBook | null> {
  try {
    const res = await fetch(`https://gutendex.com/books/${gutenbergId}`, {
      signal: AbortSignal.timeout(15_000),
    })
    if (!res.ok) return null
    return (await res.json()) as GutendexBook
  } catch {
    return null
  }
}

export function mapGenres(metadata: GutendexBook): string[] {
  const combined = [...metadata.subjects, ...metadata.bookshelves]
  const matches: string[] = []

  for (const subject of combined) {
    const lower = subject.toLowerCase()
    for (const [key, genre] of Object.entries(GENRE_MAP)) {
      if (lower.includes(key) && !matches.includes(genre)) {
        matches.push(genre)
      }
    }
  }

  // Cap at 3 genres, default to Classic/Literature if nothing matched
  const result = matches.slice(0, 3)
  return result.length > 0 ? result : ['Classic', 'Literature']
}

export function buildDescription(metadata: GutendexBook): string {
  const author = metadata.authors[0]?.name ?? 'Unknown'
  const genres = mapGenres(metadata)
  const genreStr = genres.join(' & ')

  // Try to extract year from subjects (e.g., "1897", "20th century")
  let yearStr = ''
  for (const subject of metadata.subjects) {
    const yearMatch = subject.match(/\b(1[7-9]\d{3}|20(0[0-9]|1[0-9]))\b/)
    if (yearMatch) {
      yearStr = ` Originally published in ${yearMatch[1]}.`
      break
    }
  }

  return `A classic work of ${genreStr} literature by ${author}.${yearStr} Public domain — imported from Project Gutenberg (Book #${metadata.id}).`
}

export function getCoverUrl(metadata: GutendexBook): string | null {
  const formats = metadata.formats || {}
  // Try image/jpeg first, then any image format
  return formats['image/jpeg'] ?? Object.values(formats).find(v => v.includes('cover')) ?? null
}
