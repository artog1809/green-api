import { useMemo } from 'react'
import { createGreenApiClient } from '@/shared/api/green-api'
import type { GreenApiClient } from '@/shared/api/green-api'
import { useSessionStore } from './session-store'

/** Клиент API текущей сессии; null, если пользователь не вошёл. */
export function useGreenApiClient(): GreenApiClient | null {
  const credentials = useSessionStore((state) => state.credentials)

  return useMemo(
    () => (credentials ? createGreenApiClient(credentials) : null),
    [credentials],
  )
}

/** То же самое для экранов за авторизацией, где клиент гарантированно есть. */
export function useAuthorizedGreenApiClient(): GreenApiClient {
  const client = useGreenApiClient()
  if (!client) {
    throw new Error('GREEN-API клиент недоступен: нет активной сессии')
  }
  return client
}
