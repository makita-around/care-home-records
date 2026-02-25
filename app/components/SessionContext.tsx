'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

type SessionUser = { staffId: number; name: string; isAdmin: boolean; staffCreatedAt?: string } | null

const SessionContext = createContext<SessionUser>(null)

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<SessionUser>(null)

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.ok ? r.json() : null)
      .then((data) => setSession(data))
      .catch(() => setSession(null))
  }, [])

  return <SessionContext.Provider value={session}>{children}</SessionContext.Provider>
}

export function useSession() {
  return useContext(SessionContext)
}
