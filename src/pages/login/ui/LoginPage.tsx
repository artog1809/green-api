import { Navigate } from 'react-router-dom'
import { useSessionStore } from '@/entities/session'
import { LoginForm } from '@/features/auth'

export function LoginPage() {
  const credentials = useSessionStore((state) => state.credentials)

  if (credentials) return <Navigate to="/" replace />

  return <LoginForm />
}
