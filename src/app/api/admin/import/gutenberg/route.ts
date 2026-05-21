export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { parseGutenbergId } from '@/lib/gutenberg-import/parse-url'
import { runGutenbergImport } from '@/lib/gutenberg-import/importer'

export async function POST(request: NextRequest) {
  const session = await auth()
  const role = (session?.user as any)?.role
  if (!session?.user || (role !== 'admin' && role !== 'superadmin')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { url, options = {} } = body

  if (!url || typeof url !== 'string') {
    return NextResponse.json({ error: 'url is required' }, { status: 400 })
  }

  const gutenbergId = parseGutenbergId(url)
  if (!gutenbergId) {
    return NextResponse.json(
      { error: 'Could not extract a Gutenberg book ID from the provided URL' },
      { status: 400 }
    )
  }

  try {
    const result = await runGutenbergImport(gutenbergId, options)
    return NextResponse.json(result)
  } catch (err: any) {
    console.error('[GutenbergImport]', err)
    return NextResponse.json(
      { error: err.message ?? 'Import failed' },
      { status: 500 }
    )
  }
}
