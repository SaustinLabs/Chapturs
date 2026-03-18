export const runtime = 'edge'

import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import DatabaseService, { prisma } from '@/lib/database/PrismaService'

export async function GET() {
  try {
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Endpoint disabled' }, { status: 503 })
    }

    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    if (!adminUser || adminUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    console.log('Testing database connection...')
    const works = await DatabaseService.getAllWorks()
    console.log(`Found ${works.length} works in database`)
    
    return NextResponse.json({ 
      success: true,
      worksCount: works.length,
      works: works.slice(0, 2) // Return first 2 works as sample
    })
  } catch (error) {
    console.error('Database test error:', error)
    return NextResponse.json({ 
      error: 'Database connection failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
