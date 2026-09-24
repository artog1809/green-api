import { Navigate } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useSessionStore } from '@/entities/session'

interface RequireAuthProps {
  children: ReactNode
}

export function RequireAuth({ children }: RequireAuthProps) {
  const credentials = useSessionStore((state) => state.credentials)

  if (!credentials) return <Navigate to="/login" replace />

  return children
}
