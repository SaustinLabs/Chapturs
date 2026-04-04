import type { Metadata } from 'next'
import { prisma } from '@/lib/database/PrismaService'

interface Props {
  children: React.ReactNode
  params: Promise<{ username: string }>
}

export async function generateMetadata({ params }: { params: Promise<{ username: string }> }): Promise<Metadata> {
  const { username } = await params

  try {
    const user = await prisma.user.findUnique({
      where: { username },
      select: { displayName: true, bio: true, avatar: true, username: true },
    })

    if (!user) return { title: 'Profile Not Found | Chapturs' }

    const name = user.displayName ?? user.username
    const description = user.bio
      ? user.bio.slice(0, 160)
      : `Read works by ${name} on Chapturs.`

    return {
      title: `${name} on Chapturs`,
      description,
      openGraph: {
        title: `${name} on Chapturs`,
        description,
        type: 'profile',
        ...(user.avatar && { images: [{ url: user.avatar, width: 400, height: 400, alt: name }] }),
      },
      twitter: {
        card: 'summary',
        title: `${name} on Chapturs`,
        description,
        ...(user.avatar && { images: [user.avatar] }),
      },
    }
  } catch {
    return { title: 'Chapturs' }
  }
}

export default function ProfilePageLayout({ children }: Props) {
  return <>{children}</>
}
