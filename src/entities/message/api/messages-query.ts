import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { QueryClient } from '@tanstack/react-query'
import { isFatal } from '@/shared/api/green-api'
import type { GreenApiClient } from '@/shared/api/green-api'
import { byTimestampAsc, messageFromHistoryItem, upsertMessage } from '../model/mappers'
import type { Message } from '../model/types'

/** Общий префикс ключей кэша сообщений — по нему ищем чат по idMessage. */
export const MESSAGES_QUERY_SCOPE = ['messages'] as const

/**
 * Ключ кэша — телефон, а не chatId: chatId меняется, когда MAX присылает
 * настоящий идентификатор чата вместо временного `<телефон>@c.us`.
 */
export function messagesQueryKey(phone: string) {
  return [...MESSAGES_QUERY_SCOPE, phone] as const
}

interface MessagesQueryParams {
  phone: string
  chatId: string
}

/** История чата из журналов GREEN-API — источник сообщений при открытии чата. */
export function useMessagesQuery(
  client: GreenApiClient,
  params: MessagesQueryParams | null,
) {
  const queryClient = useQueryClient()

  return useQuery({
    queryKey: messagesQueryKey(params?.phone ?? ''),
    enabled: params !== null,
    // История не устаревает сама: новые сообщения приносит очередь уведомлений.
    staleTime: Infinity,
    // Но при открытии чата её надо запросить, даже если в кэше уже что-то есть:
    // туда могли попасть сообщения из очереди, пока чат был закрыт.
    refetchOnMount: 'always',
    retry: (failureCount, error) => !isFatal(error) && failureCount < 2,
    queryFn: async ({ signal }) => {
      const history = await client.getChatHistory({ chatId: params!.chatId }, signal)
      const fromServer = history
        .map(messageFromHistoryItem)
        .filter((message): message is Message => message !== null)

      // Пока чат не был открыт, в его кэш уже могли попасть сообщения из
      // очереди уведомлений. История их не отменяет, а дополняет: сервер
      // отдаёт свежие сообщения с задержкой, и замена кэша стёрла бы их.
      const known = queryClient.getQueryData<Message[]>(
        messagesQueryKey(params!.phone),
      )

      if (!known?.length) return fromServer.sort(byTimestampAsc)

      return fromServer.reduce(upsertMessage, known)
    },
  })
}

export function pushMessageToCache(
  queryClient: QueryClient,
  phone: string,
  message: Message,
): void {
  queryClient.setQueryData<Message[]>(messagesQueryKey(phone), (previous) =>
    upsertMessage(previous ?? [], message),
  )
}

export function patchMessageInCache(
  queryClient: QueryClient,
  phone: string,
  messageId: string,
  patch: Partial<Message>,
): void {
  queryClient.setQueryData<Message[]>(messagesQueryKey(phone), (previous) =>
    (previous ?? []).map((message) =>
      message.id === messageId ? { ...message, ...patch } : message,
    ),
  )
}

export function removeMessageFromCache(
  queryClient: QueryClient,
  phone: string,
  messageId: string,
): void {
  queryClient.setQueryData<Message[]>(messagesQueryKey(phone), (previous) =>
    (previous ?? []).filter((message) => message.id !== messageId),
  )
}
