import { auth } from '@/auth'
import AppLayout from '@/components/AppLayout'
import StoryManagement from '@/components/StoryManagement'

export default async function CreatorWorksPage() {
  const session = await auth()

  return (
    <AppLayout>
      <StoryManagement userId={session?.user?.id ?? null} isAuthenticated={!!session?.user} />
    </AppLayout>
  )
}
