import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/database/PrismaService'

// Check if user has premium subscription (for ad-free experience)
export async function GET() {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ isPremium: false })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { isPremium: true },
    })

    return NextResponse.json({ 
      isPremium: user?.isPremium || false 
    })
  } catch (error) {
    console.error('Premium status check error:', error)
    return NextResponse.json({ isPremium: false })
  }
}
