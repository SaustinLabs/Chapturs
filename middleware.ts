import { auth } from './src/auth-edge'
import { NextResponse } from 'next/server'

export default auth(function middleware(req) {
  const { pathname } = req.nextUrl
  const role = (req.auth?.user as any)?.role as string | undefined

  // /admin/bootstrap is the escape hatch — any authenticated user may reach it
  // so they can elevate themselves if they know the PIN.
  if (pathname.startsWith('/admin/bootstrap')) {
    if (!req.auth) {
      return NextResponse.redirect(new URL('/auth/signin', req.url))
    }
    return NextResponse.next()
  }

  // All other /admin/* routes are strictly admin-only.
  if (pathname.startsWith('/admin')) {
    if (!req.auth) {
      const url = new URL('/auth/signin', req.url)
      url.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(url)
    }
    if (role !== 'admin' && role !== 'superadmin') {
      return NextResponse.redirect(new URL('/admin/bootstrap', req.url))
    }
  }

  return NextResponse.next()
})

export const config = {
  // https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.[^/]+$).*)',
  ],
}
