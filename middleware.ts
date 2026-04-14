import { auth } from './src/auth-edge'
import { NextResponse } from 'next/server'

export default auth(function middleware(req) {
  const { pathname } = req.nextUrl
  const role = (req.auth?.user as any)?.role as string | undefined
  const username = (req.auth?.user as any)?.username as string | undefined
  const hasSetUsername = (req.auth?.user as any)?.hasSetUsername as boolean | undefined
  const inferredHasSetUsername =
    typeof hasSetUsername === 'boolean'
      ? hasSetUsername
      : typeof username === 'string'
        ? !/_\d+$/.test(username)
        : undefined

  // /admin/bootstrap is the escape hatch — any authenticated user may reach it
  // so they can elevate themselves if they know the PIN.
  if (pathname.startsWith('/admin/bootstrap')) {
    if (!req.auth) {
      return NextResponse.redirect(new URL('/auth/signin', req.url))
    }
    // Forward pathname so the admin layout can exempt this route
    const res = NextResponse.next({
      request: { headers: new Headers({ ...Object.fromEntries(req.headers), 'x-pathname': pathname }) },
    })
    return res
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

  // New user onboarding: redirect to /onboarding if username is still auto-generated.
  // hasSetUsername defaults to true for existing JWTs without the claim, so this only
  // triggers for users who signed in after this feature was deployed.
  if (req.auth && inferredHasSetUsername === false) {
    if (!pathname.startsWith('/onboarding') && !pathname.startsWith('/auth')) {
      return NextResponse.redirect(new URL('/onboarding', req.url))
    }
  }

  // Forward pathname for all passing requests so layouts can read it
  return NextResponse.next({
    request: { headers: new Headers({ ...Object.fromEntries(req.headers), 'x-pathname': pathname }) },
  })
})

export const config = {
  // https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.[^/]+$).*)',
  ],
}
