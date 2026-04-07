import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import GitHub from "next-auth/providers/github"
import Discord from "next-auth/providers/discord"

// Support both NextAuth v5 names and legacy names used in older docs.
const authSecret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET
const googleClientId = process.env.AUTH_GOOGLE_ID || process.env.GOOGLE_CLIENT_ID
const googleClientSecret = process.env.AUTH_GOOGLE_SECRET || process.env.GOOGLE_CLIENT_SECRET

// Validate required environment variables
const missingVars = [
  !authSecret ? 'AUTH_SECRET (or NEXTAUTH_SECRET)' : null,
  !googleClientId ? 'AUTH_GOOGLE_ID (or GOOGLE_CLIENT_ID)' : null,
  !googleClientSecret ? 'AUTH_GOOGLE_SECRET (or GOOGLE_CLIENT_SECRET)' : null,
].filter(Boolean)

const isBuildPhase =
  process.env.NEXT_PHASE === 'phase-production-build' ||
  process.env.npm_lifecycle_event === 'build'

if (missingVars.length > 0 && !isBuildPhase) {
  console.error('❌ Missing required auth environment variables:', missingVars.join(', '))
  console.error('Set these in your runtime environment (.env.production, PM2 ecosystem, or platform env vars):')
  console.error('- AUTH_SECRET (or NEXTAUTH_SECRET)')
  console.error('- AUTH_GOOGLE_ID (or GOOGLE_CLIENT_ID)')
  console.error('- AUTH_GOOGLE_SECRET (or GOOGLE_CLIENT_SECRET)')
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: authSecret,
  trustHost: true,
  providers: [
    // Google OAuth (primary recommended option)
    Google({
      clientId: googleClientId,
      clientSecret: googleClientSecret,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
    }),
    
    // GitHub OAuth (optional - fast setup, no verification needed)
    ...(process.env.AUTH_GITHUB_ID ? [
      GitHub({
        clientId: process.env.AUTH_GITHUB_ID,
        clientSecret: process.env.AUTH_GITHUB_SECRET,
      })
    ] : []),
    
    // Discord OAuth (optional - popular with webnovel readers)
    ...(process.env.AUTH_DISCORD_ID ? [
      Discord({
        clientId: process.env.AUTH_DISCORD_ID,
        clientSecret: process.env.AUTH_DISCORD_SECRET,
      })
    ] : []),
  ],
  callbacks: {
    async signIn({ account, profile, user }) {
      // Support multiple providers (Google, GitHub, Discord)
      const email = profile?.email
      const emailVerified = profile?.email_verified ?? true // GitHub/Discord don't have this field
      
      console.log('🔐 Sign-in attempt:', {
        provider: account?.provider,
        email,
        emailVerified,
        nextAuthUserId: user.id
      })
      
      if (!email) {
        console.error('❌ Sign-in rejected: No email in profile')
        return false
      }
      
      if (!emailVerified) {
        console.error('❌ Sign-in rejected: Email not verified')
        return false
      }
      
      try {
        console.log('📝 Attempting to create/update user in database...')

        // Load Prisma lazily so middleware/edge auth paths don't import it.
        const { prisma } = await import('@/lib/database/PrismaService')
        
        // Bound DB wait time so OAuth callback cannot hang indefinitely.
        await Promise.race([
          prisma.user.upsert({
            where: { email },
            update: {
              displayName: profile.name || undefined,
              avatar: (profile as any).picture || (profile as any).avatar_url || (profile as any).image || undefined,
            },
            create: {
              id: user.id,
              email,
              username: email.split('@')[0] + '_' + Date.now(),
              displayName: profile.name || undefined,
              avatar: (profile as any).picture || (profile as any).avatar_url || (profile as any).image || undefined,
            },
          }),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Sign-in database timeout')), 8000)
          )
        ])
        
        console.log('✅ User upserted.')
        return true
      } catch (error) {
        console.error('❌ Sign-in callback database error:', error)
        return false
      }
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub
        // Propagate role so admin checks work on the client and in API routes
        ;(session.user as any).role = (token as any).role ?? 'user'
        // Propagate onboarding state — defaults true so old JWTs don't redirect
        ;(session.user as any).hasSetUsername = (token as any).hasSetUsername ?? true
      }
      return session
    },
    async jwt({ token, account, user, trigger, session }: any) {
      // Handle client-triggered session update (e.g. after completing onboarding)
      if (trigger === 'update' && session?.hasSetUsername !== undefined) {
        (token as any).hasSetUsername = session.hasSetUsername
        return token
      }

      // Only runs on the initial sign-in (account is null on subsequent requests).
      // Pin token.sub to the real DB user ID (by email) so re-sign-ins don't
      // generate a new UUID that mismatches the DB record.
      if (account) {
        try {
          const { prisma } = await import('@/lib/database/PrismaService')
          // First try: look up by email so we always get the canonical DB ID
          const email = user?.email
          if (email) {
            const dbUser = await prisma.user.findUnique({
              where: { email },
              select: { id: true, role: true, username: true },
            })
            if (dbUser) {
              token.sub = dbUser.id          // pin JWT sub to actual DB ID
              ;(token as any).role = dbUser.role ?? 'user'
              // Track whether user has set a real username (not auto-generated)
              ;(token as any).hasSetUsername = !/_\d+$/.test(dbUser.username ?? '')
              return token
            }
          }
          // Fallback: look up by the sub NextAuth assigned
          const dbUser = await prisma.user.findUnique({
            where: { id: token.sub! },
            select: { role: true, username: true },
          })
          ;(token as any).role = dbUser?.role ?? 'user'
          ;(token as any).hasSetUsername = !/_\d+$/.test(dbUser?.username ?? '')
        } catch {
          ;(token as any).role = 'user'
          ;(token as any).hasSetUsername = true // safe default: don't block on error
        }
      }
      return token
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
  session: {
    strategy: 'jwt',
  },
})
