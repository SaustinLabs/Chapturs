import { auth } from '@/auth'
import { prisma } from '@/lib/database/PrismaService'
import { redirect } from 'next/navigation'
import AppLayout from '@/components/AppLayout'
import MonetizationContent from './MonetizationContent'

async function getCreatorWorks(userId: string) {
  try {
    // Get author record
    const author = await prisma.author.findUnique({
      where: { userId }
    })

    if (!author) {
      // Create author if they don't exist yet
      const newAuthor = await prisma.author.create({
        data: {
          userId,
          verified: false,
          socialLinks: '[]',
        }
      })
      return [] // No works yet for new author
    }

    // Get all works for monetization settings
    const works = await prisma.work.findMany({
      where: {
        authorId: author.id,
        status: { not: 'unpublished' } // Only published/draft works can have monetization
      },
      select: {
        id: true,
        title: true,
        coverImage: true,
        status: true,
        adSettings: true,
        _count: {
          select: {
            sections: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return works
  } catch (error) {
    console.error('Failed to fetch creator works for monetization:', error)
    // Re-throw to trigger error boundary
    throw new Error('Failed to load works for monetization settings')
  }
}

export default async function MonetizationPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect('/auth/signin')
  }

  const works = await getCreatorWorks(session.user.id)

  return (
    <AppLayout>
      <MonetizationContent works={works} />
    </AppLayout>
  )
}