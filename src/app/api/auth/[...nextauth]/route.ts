// Edge-only NextAuth route - uses auth-edge.ts (no Prisma)
export const runtime = 'edge'

import { handlers } from "@/auth-edge"
export const { GET, POST } = handlers
