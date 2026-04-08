import { auth } from '@/auth-edge'
import { redirect } from 'next/navigation'
import Script from 'next/script'
import OnboardingForm from '@/components/onboarding/OnboardingForm'

export default async function OnboardingPage() {
  const session = await auth()
  if (!session?.user) {
    redirect('/auth/signin?callbackUrl=/onboarding')
  }
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY
  return (
    <>
      {siteKey && (
        <Script
          src={`https://www.google.com/recaptcha/api.js?render=${siteKey}`}
          strategy="afterInteractive"
        />
      )}
      <OnboardingForm />
    </>
  )
}
