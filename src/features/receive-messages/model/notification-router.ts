import type { QueryClient } from '@tanstack/react-query'
import { MESSAGES_QUERY_SCOPE } from '@/entities/message'
import type { Message } from '@/entities/message'

/**
 * Ищет, в ленте какого чата лежит сообщение с таким idMessage.
 *
 * Нужно для уведомлений, где есть только id сообщения и «сырой» chatId:
 * так статус доставки попадает в нужный чат, а уведомление о своём
 * отправленном сообщении позволяет узнать настоящий chatId собеседника.
 */
export function findChatPhoneByMessageId(
  queryClient: QueryClient,
  idMessage: string,
): string | null {
  const entries = queryClient.getQueriesData<Message[]>({
    queryKey: MESSAGES_QUERY_SCOPE,
  })

  for (const [queryKey, messages] of entries) {
    if (!messages?.some((message) => message.id === idMessage)) continue

    const phone = queryKey[1]
    if (typeof phone === 'string') return phone
  }

  return null
}
