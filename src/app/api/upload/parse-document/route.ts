export const runtime = 'nodejs'

// ============================================================================
// DOCUMENT PARSING ENDPOINT
// Accepts .docx and .pdf uploads, extracts raw text, returns it to the client
// so the existing chapter-splitting logic can process it normally.
// ============================================================================

import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'

const MAX_BYTES = 20 * 1024 * 1024 // 20 MB hard cap

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: 'File exceeds 20 MB limit' }, { status: 413 })
    }

    const name = file.name.toLowerCase()
    const buffer = Buffer.from(await file.arrayBuffer())

    if (name.endsWith('.docx')) {
      // mammoth extracts text from .docx (Word 2007+)
      const mammoth = (await import('mammoth')).default
      const result = await mammoth.extractRawText({ buffer })
      return NextResponse.json({ text: result.value, warnings: result.messages.map(m => m.message) })
    }

    if (name.endsWith('.pdf')) {
      // pdf-parse extracts text from text-based PDFs
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pdfParse = require('pdf-parse') as (buf: Buffer) => Promise<{ text: string; numpages: number }>
      const data = await pdfParse(buffer)
      return NextResponse.json({ text: data.text, pageCount: data.numpages })
    }

    return NextResponse.json(
      { error: 'Unsupported file type. Only .docx and .pdf are accepted.' },
      { status: 415 }
    )
  } catch (error) {
    console.error('[parse-document] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to parse document' },
      { status: 500 }
    )
  }
}
