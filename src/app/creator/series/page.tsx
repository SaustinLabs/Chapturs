import AppLayout from '@/components/AppLayout'
import SeriesManager from '@/components/SeriesManager'
import { auth } from '@/auth-edge'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/database/PrismaService'

export default async function CreatorSeriesPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const author = await prisma.author.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  })

  if (!author) redirect('/creator/dashboard')

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Series Manager</h1>
          <p className="text-gray-400 text-sm mt-1">
            Group your works into multi-volume series. Readers can subscribe to a series to follow all works at once.
          </p>
        </div>
        <SeriesManager authorId={author.id} />
      </div>
    </AppLayout>
  )
}
