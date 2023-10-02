'use client'

import { SessionProvider } from 'next-auth/react'

type SessionProviderProps = {
  children: React.ReactNode
}

const Provider = ({ children }: SessionProviderProps) => {
  return <SessionProvider>{children}</SessionProvider>
}

export default Provider
