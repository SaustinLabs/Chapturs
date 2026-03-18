import NextAuth from "next-auth"
import Google from "next-auth/providers/google"

export const runtime = 'edge'

const authSecret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET
const googleClientId = process.env.AUTH_GOOGLE_ID || process.env.GOOGLE_CLIENT_ID
const googleClientSecret = process.env.AUTH_GOOGLE_SECRET || process.env.GOOGLE_CLIENT_SECRET

const { handlers, auth, signIn, signOut } = NextAuth({
  secret: authSecret,
  trustHost: true,
  providers: [
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
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth/signin",
  },
  callbacks: {
    async jwt({ token, account, profile }) {
      // Persist Google profile info in the JWT
      if (account && profile) {
        token.email = profile.email
        token.name = profile.name
        token.picture = (profile as any).picture
      }
      return token
    },
    async session({ session, token }) {
      // Send properties to the client
      if (session.user) {
        session.user.id = token.sub as string
        session.user.email = token.email as string
        session.user.name = token.name as string
        session.user.image = token.picture as string
      }
      return session
    },
  },
})

export { auth, signIn, signOut }
export const { GET, POST } = handlers
