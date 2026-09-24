import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { nowInSeconds } from '@/shared/lib/datetime'
import { formatPhone, normalizePhone, toChatId } from '@/shared/lib/phone'
import type { Chat } from './types'

interface EnsureChatParams {
  /** chatId из уведомления: в MAX это числовой идентификатор, а не телефон. */
  chatId: string
  phone?: string
  name?: string
}

interface RegisterMessageParams {
  phone: string
  text: string
  timestamp: number
  /** Входящее в неоткрытый чат увеличивает счётчик непрочитанных. */
  incoming: boolean
}

interface ChatsState {
  chats: Chat[]
  activePhone: string | null
  /** Создаёт или открывает чат по номеру, введённому пользователем. */
  openChat: (rawPhone: string, name?: string) => Chat
  /**
   * Находит чат для входящего уведомления, при необходимости создаёт его
   * и подменяет временный `<телефон>@c.us` на настоящий chatId.
   */
  ensureChat: (params: EnsureChatParams) => Chat
  setActivePhone: (phone: string | null) => void
  linkChatId: (phone: string, chatId: string) => void
  /** Обновляет превью в списке и счётчик непрочитанных. */
  registerMessage: (params: RegisterMessageParams) => void
  removeChat: (phone: string) => void
  clear: () => void
}

function sortChats(chats: Chat[]): Chat[] {
  return [...chats].sort(
    (a, b) => (b.lastMessageAt ?? b.createdAt) - (a.lastMessageAt ?? a.createdAt),
  )
}

export const useChatsStore = create<ChatsState>()(
  persist(
    (set, get) => ({
      chats: [],
      activePhone: null,

      openChat: (rawPhone, name) => {
        const phone = normalizePhone(rawPhone)
        const existing = get().chats.find((chat) => chat.phone === phone)

        if (existing) {
          get().setActivePhone(phone)
          return existing
        }

        const chat: Chat = {
          phone,
          chatId: toChatId(phone),
          name: name ?? formatPhone(phone),
          createdAt: nowInSeconds(),
          unreadCount: 0,
        }
        set((state) => ({
          chats: sortChats([chat, ...state.chats]),
          activePhone: phone,
        }))
        return chat
      },

      ensureChat: ({ chatId, phone, name }) => {
        const normalizedPhone = phone ? normalizePhone(phone) : ''
        const { chats } = get()

        const byChatId = chats.find((chat) => chat.chatId === chatId)
        if (byChatId) return byChatId

        const byPhone = normalizedPhone
          ? chats.find((chat) => chat.phone === normalizedPhone)
          : undefined

        if (byPhone) {
          const updated = { ...byPhone, chatId }
          set((state) => ({
            chats: state.chats.map((chat) =>
              chat.phone === byPhone.phone ? updated : chat,
            ),
          }))
          return updated
        }

        const chat: Chat = {
          phone: normalizedPhone || chatId,
          chatId,
          name: name ?? (normalizedPhone ? formatPhone(normalizedPhone) : chatId),
          createdAt: nowInSeconds(),
          unreadCount: 0,
        }
        set((state) => ({ chats: sortChats([chat, ...state.chats]) }))
        return chat
      },

      setActivePhone: (phone) =>
        set((state) => ({
          activePhone: phone,
          // Открытый чат считается прочитанным.
          chats: state.chats.map((chat) =>
            chat.phone === phone ? { ...chat, unreadCount: 0 } : chat,
          ),
        })),

      linkChatId: (phone, chatId) =>
        set((state) => ({
          chats: state.chats.map((chat) =>
            chat.phone === phone ? { ...chat, chatId } : chat,
          ),
        })),

      registerMessage: ({ phone, text, timestamp, incoming }) =>
        set((state) => ({
          chats: sortChats(
            state.chats.map((chat) => {
              if (chat.phone !== phone) return chat

              const isUnread = incoming && state.activePhone !== phone

              return {
                ...chat,
                lastMessageText: text,
                lastMessageAt: timestamp,
                unreadCount: isUnread ? chat.unreadCount + 1 : chat.unreadCount,
              }
            }),
          ),
        })),

      removeChat: (phone) =>
        set((state) => ({
          chats: state.chats.filter((chat) => chat.phone !== phone),
          activePhone: state.activePhone === phone ? null : state.activePhone,
        })),

      clear: () => set({ chats: [], activePhone: null }),
    }),
    { name: 'max-chat/chats' },
  ),
)

export function selectActiveChat(state: ChatsState): Chat | null {
  return state.chats.find((chat) => chat.phone === state.activePhone) ?? null
}
