import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import GitHub from "next-auth/providers/github"
import Discord from "next-auth/providers/discord"
import { prisma } from '@/lib/database/PrismaService'

// Validate required environment variables
const requiredEnvVars = ['AUTH_SECRET', 'AUTH_GOOGLE_ID', 'AUTH_GOOGLE_SECRET']
const missingVars = requiredEnvVars.filter(varName => !process.env[varName])

if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingVars.join(', '))
  console.error('Please add these to your Vercel environment variables:')
  console.error('- AUTH_SECRET (generate with: openssl rand -base64 32)')
  console.error('- AUTH_GOOGLE_ID (from Google Cloud Console)')
  console.error('- AUTH_GOOGLE_SECRET (from Google Cloud Console)')
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: process.env.AUTH_SECRET,
  providers: [
    // Google OAuth (primary recommended option)
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
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
        
        // SIMPLIFIED: Only upsert user, defer author creation to session callback
        // This reduces cold start timeout issues on Vercel
        const dbUser = await prisma.user.upsert({
          where: { email },
          update: {
            displayName: profile.name || undefined,
            // Support different avatar field names across providers
            avatar: (profile as any).picture || (profile as any).avatar_url || (profile as any).image || undefined,
          },
          create: {
            id: user.id, // Use NextAuth's generated ID
            email,
            username: email.split('@')[0] + '_' + Date.now(), // Generate unique username
            displayName: profile.name || undefined,
            avatar: (profile as any).picture || (profile as any).avatar_url || (profile as any).image || undefined,
          },
        })
        
        console.log('✅ User successfully upserted into DB.')

        // Ensure user has an author profile
        console.log('📝 Checking for author profile...')
        const existingAuthor = await prisma.author.findUnique({
          where: { userId: dbUser.id }
        })

        if (!existingAuthor) {
          console.log('📝 Creating initial author profile...')
          await prisma.author.create({
            data: {
              userId: dbUser.id,
              verified: false,
              socialLinks: '[]'
            }
          })
          console.log('✅ Author profile created.')
        }
        
        return true
      } catch (error) {
        console.error('❌ Database error during sign-in callback:')
        if (error instanceof Error) {
          console.error(`- Message: ${error.message}`)
          if (error.message.includes('Can\'t reach database server')) {
            console.error('  👉 Possible cause: Wrong credentials or Supabase project is paused.')
          }
        }
        return false
      }
    },
    async session({ session, token }) {
      // Send properties to the client
      if (session.user && token.sub) {
        session.user.id = token.sub
        console.log('[Session Callback] Setting session.user.id from token.sub:', token.sub)
      } else {
        console.log('[Session Callback] Missing session.user or token.sub')
      }
      return session
    },
    async jwt({ token, account, profile }) {
      // Persist the OAuth access_token and/or the user id to the token right after signin
      if (account) {
        token.accessToken = account.access_token
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
