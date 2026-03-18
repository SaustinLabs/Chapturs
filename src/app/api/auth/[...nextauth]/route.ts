// Edge-only NextAuth route - uses auth-edge.ts (no Prisma)
export const runtime = 'nodejs'

import { handlers } from "@/auth-edge"
export const { GET, POST } = handlers
