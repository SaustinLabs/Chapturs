// Lightweight auth for edge runtime - JWT verification only, no Prisma
import NextAuth from "next-auth"
import Google from "next-auth/providers/google"

const authSecret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET
const googleClientId = process.env.AUTH_GOOGLE_ID || process.env.GOOGLE_CLIENT_ID
const googleClientSecret = process.env.AUTH_GOOGLE_SECRET || process.env.GOOGLE_CLIENT_SECRET

// Edge-compatible auth - no database, JWT only
const { auth, handlers, signIn, signOut } = NextAuth({
  secret: authSecret,
  trustHost: true,
  providers: [
    Google({
      clientId: googleClientId,
      clientSecret: googleClientSecret,
    }),
  ],
  session: { strategy: "jwt" },
  pages: { signIn: "/auth/signin" },
  callbacks: {
    jwt({ token, account, profile }) {
      if (account && profile) {
        token.email = profile.email
        token.name = profile.name
        token.picture = (profile as any).picture
      }
      return token
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub as string
      }
      return session
    },
  },
})

export { auth, handlers, signIn, signOut }
