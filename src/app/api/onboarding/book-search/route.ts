import { NextRequest, NextResponse } from 'next/server'

// Platform genre taxonomy
const PLATFORM_GENRES = [
  'Fantasy', 'Romance', 'Science Fiction', 'Mystery', 'Thriller',
  'Horror', 'Adventure', 'Comedy', 'Drama', 'Historical', 'LitRPG', 'Isekai',
]

function mapToGenres(categories: string[]): string[] {
  const found = new Set<string>()
  for (const cat of categories) {
    const lower = cat.toLowerCase()
    if (lower.includes('fantasy')) found.add('Fantasy')
    if (lower.includes('romance') || lower.includes('love stories')) found.add('Romance')
    if (lower.includes('science fiction') || lower.includes('sci-fi') || lower.includes('space opera')) found.add('Science Fiction')
    if (lower.includes('mystery') || lower.includes('detective') || lower.includes('crime')) found.add('Mystery')
    if (lower.includes('thriller') || lower.includes('suspense')) found.add('Thriller')
    if (lower.includes('horror') || lower.includes('ghost stories') || lower.includes('occult')) found.add('Horror')
    if (lower.includes('adventure') || lower.includes('action')) found.add('Adventure')
    if (lower.includes('humor') || lower.includes('comedy') || lower.includes('comic') || lower.includes('satire') || lower.includes('humorous')) found.add('Comedy')
    if (lower.includes('drama') || lower.includes('literary fiction')) found.add('Drama')
    if (lower.includes('historical') || lower.includes('history') || lower.includes('period piece')) found.add('Historical')
    // LitRPG & Isekai aren't in Google Books taxonomy; infer from game-adjacent fiction
    if (lower.includes('game') && lower.includes('fiction')) found.add('LitRPG')
  }
  // Filter to only platform-supported genres
  return [...found].filter(g => PLATFORM_GENRES.includes(g))
}

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q')?.trim()

  if (!q || q.length < 2) {
    return NextResponse.json({ books: [] })
  }

  try {
    const apiUrl = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q)}&maxResults=6&printType=books&langRestrict=en`
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000)
    const res = await fetch(apiUrl, {
      signal: controller.signal,
      next: { revalidate: 300 },
    }).finally(() => clearTimeout(timeout))

    if (!res.ok) {
      return NextResponse.json({ books: [] })
    }

    const data = await res.json()
    const books = (data.items ?? []).map((item: any) => {
      const info = item.volumeInfo ?? {}
      // Google Books sometimes uses http thumbnail URLs — upgrade to https
      const rawCover: string | undefined = info.imageLinks?.thumbnail ?? info.imageLinks?.smallThumbnail
      const cover = rawCover ? rawCover.replace(/^http:\/\//, 'https://') : null

      return {
        googleId: item.id as string,
        title: (info.title as string) ?? 'Unknown Title',
        authors: (info.authors as string[]) ?? [],
        cover,
        genres: mapToGenres((info.categories as string[]) ?? []),
      }
    })

    return NextResponse.json({ books })
  } catch {
    return NextResponse.json({ books: [] })
  }
}
