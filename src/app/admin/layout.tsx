import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { headers } from 'next/headers'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const headersList = await headers()
  const pathname = headersList.get('x-pathname') ?? ''

  // /admin/bootstrap is open to all authenticated users — exempt it here
  if (pathname.startsWith('/admin/bootstrap')) {
    return <>{children}</>
  }

  const session = await auth()

  if (!session?.user) {
    redirect('/auth/signin?callbackUrl=/admin')
  }

  const role = (session.user as any).role
  if (role !== 'admin' && role !== 'superadmin') {
    redirect('/admin/bootstrap')
  }

  return <>{children}</>
}
