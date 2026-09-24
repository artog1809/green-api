import { useQueryClient } from '@tanstack/react-query'
import { useChatsStore } from '@/entities/chat'
import { useSessionStore } from '@/entities/session'

/** Выход чистит и сессию, и данные предыдущего инстанса. */
export function useLogout() {
  const signOut = useSessionStore((state) => state.signOut)
  const clearChats = useChatsStore((state) => state.clear)
  const queryClient = useQueryClient()

  return () => {
    signOut()
    clearChats()
    queryClient.clear()
  }
}
