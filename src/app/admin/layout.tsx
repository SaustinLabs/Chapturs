import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { headers } from 'next/headers'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const headersList = await headers()
  const pathname =
    headersList.get('x-pathname') ??
    headersList.get('next-url') ??
    ''
  const isBootstrapRoute = pathname.includes('/admin/bootstrap')

  // /admin/bootstrap is open to all authenticated users — exempt it here
  if (isBootstrapRoute) {
    return <>{children}</>
  }

  const session = await auth()

  if (!session?.user) {
    redirect('/auth/signin?callbackUrl=/admin')
  }

  const role = (session.user as any).role
  if (role !== 'admin' && role !== 'superadmin') {
    // If we cannot reliably determine the current path, avoid triggering
    // a potential redirect loop and let middleware remain the source of truth.
    if (!pathname) {
      return <>{children}</>
    }
    redirect('/admin/bootstrap')
  }

  return <>{children}</>
}
