export const runtime = 'edge'

import { NextResponse } from 'next/server'

// Minimal Node.js route - no imports beyond NextResponse
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    runtime: 'nodejs',
    timestamp: new Date().toISOString(),
    nodeVersion: process.version,
  })
}
