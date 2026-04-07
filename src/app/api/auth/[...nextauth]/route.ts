// NextAuth route - uses full auth.ts (Node.js, includes Prisma DB callbacks)
export const runtime = 'nodejs'

import { handlers } from "@/auth"
export const { GET, POST } = handlers
