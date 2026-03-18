'use client'

import { SessionProvider } from "next-auth/react"
import { Session } from "next-auth"
import { UserProvider } from '@/hooks/useUser'
import { UserSync } from './UserSync'

export function AuthProvider({ 
  children, 
  session 
}: { 
  children: React.ReactNode
  session: Session | null
}) {
  return (
    <SessionProvider session={session}>
      <UserProvider>
        <UserSync />
        {children}
      </UserProvider>
    </SessionProvider>
  )
}
