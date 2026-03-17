import { notFound } from 'next/navigation'
import AppLayout from '@/components/AppLayout'
import ProfileLayout from '@/components/profile/ProfileLayout'
import ProfileSidebar from '@/components/profile/ProfileSidebar'
import FeaturedSpace from '@/components/profile/FeaturedSpace'
import BlockGrid from '@/components/profile/BlockGrid'
import { prisma } from '@/lib/database/PrismaService'
import { auth } from '@/auth'

interface ProfilePageProps {
  params: Promise<{
    username: string
  }>
}

async function ProfilePageContent({ params }: ProfilePageProps) {
  const { username } = await params
  
  // Get current session to check if viewer is the profile owner
  const session = await auth()
  const sessionUsername = session?.user?.id 
    ? (await prisma.user.findUnique({ where: { id: session.user.id }, select: { username: true } }))?.username
    : null
  const isOwner = sessionUsername === username

  // Fetch user and profile data
  const user = await prisma.user.findUnique({
    where: { username },
    include: {
      authorProfile: {
        include: {
          creatorProfile: {
            include: {
              blocks: {
                where: { isVisible: true },
                orderBy: { order: 'asc' }
              }
            }
          }
        }
      }
    }
  })

  if (!user) {
    notFound()
  }

  const profile = user.authorProfile?.creatorProfile
  const isPublished = profile?.isPublished ?? false

  // If profile exists but not published, show unpublished state
  if (profile && !isPublished) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-100 mb-2">
            Profile Not Published
          </h1>
          <p className="text-gray-400">
            This creator hasn't published their profile yet.
          </p>
        </div>
      </div>
    )
  }

  // Fetch featured work if applicable
  let featuredWork = null
  if (profile?.featuredType === 'work' && profile.featuredWorkId) {
    featuredWork = await prisma.work.findUnique({
      where: { id: profile.featuredWorkId },
      select: {
        id: true,
        title: true,
        description: true,
        coverImage: true,
        genres: true,
        status: true
      }
    })
  }

  // Track profile view (increment view count)
  if (profile) {
    await prisma.creatorProfile.update({
      where: { id: profile.id },
      data: {
        profileViews: { increment: 1 },
        lastViewedAt: new Date()
      }
    })
  }

  return (
    <ProfileLayout
      sidebar={
        <ProfileSidebar
          profileImage={profile?.profileImage || user.avatar || undefined}
          displayName={profile?.displayName || user.displayName || user.username}
          username={user.username}
          bio={profile?.bio || undefined}
          isOwner={isOwner}
        />
      }
      featured={
        <FeaturedSpace
          type={profile?.featuredType as 'work' | 'block' | 'none' || 'none'}
          workData={featuredWork ? {
            id: featuredWork.id,
            title: featuredWork.title,
            coverImage: featuredWork.coverImage || undefined,
            description: featuredWork.description,
            genres: typeof featuredWork.genres === 'string' 
              ? JSON.parse(featuredWork.genres) 
              : featuredWork.genres,
            status: featuredWork.status
          } : undefined}
          isOwner={isOwner}
        />
      }
      blocks={
        <BlockGrid
          blocks={profile?.blocks || []}
          isOwner={isOwner}
        />
      }
    />
  )
}

export default function ProfilePage(props: ProfilePageProps) {
  return (
    <AppLayout>
      <ProfilePageContent {...props} />
    </AppLayout>
  )
}
