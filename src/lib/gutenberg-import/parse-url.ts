export function parseGutenbergId(url: string): number | null {
  try {
    const u = new URL(url)

    // Pattern 1: /ebooks/{id} or /ebooks/{id}.txt.utf-8
    const ebooksMatch = u.pathname.match(/\/ebooks\/(\d+)/)
    if (ebooksMatch) return parseInt(ebooksMatch[1], 10)

    // Pattern 2: /cache/epub/{id}/pg{id}.txt
    const cacheMatch = u.pathname.match(/\/cache\/epub\/(\d+)\/\//)
    if (cacheMatch) return parseInt(cacheMatch[1], 10)

    // Pattern 3: /files/{id}/{id}-0.txt
    const filesMatch = u.pathname.match(/\/files\/(\d+)\//)
    if (filesMatch) return parseInt(filesMatch[1], 10)
  } catch {
    // Invalid URL
  }
  return null
}

export function parseOpenLibraryWorkId(url: string): string | null {
  try {
    const u = new URL(url)
    const match = u.pathname.match(/\/works\/(OL(\d+)W)/)
    if (match) return match[1]
  } catch {
    // Invalid URL
  }
  return null
}
