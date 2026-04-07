import { auth } from '@/auth-edge'
import { redirect } from 'next/navigation'
import OnboardingForm from '@/components/onboarding/OnboardingForm'

export default async function OnboardingPage() {
  const session = await auth()
  if (!session?.user) {
    redirect('/auth/signin?callbackUrl=/onboarding')
  }
  return <OnboardingForm />
}
