import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { GreenApiCredentials } from '@/shared/api/green-api'

interface SessionState {
  credentials: GreenApiCredentials | null
  signIn: (credentials: GreenApiCredentials) => void
  signOut: () => void
}

/**
 * Учётные данные инстанса хранятся в localStorage, чтобы переписка
 * переживала перезагрузку страницы. Для продакшена так делать нельзя:
 * apiTokenInstance даёт полный доступ к инстансу и должен жить на бэкенде.
 */
export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      credentials: null,
      signIn: (credentials) => set({ credentials }),
      signOut: () => set({ credentials: null }),
    }),
    { name: 'max-chat/session' },
  ),
)
