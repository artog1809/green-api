import type {
  ChatHistoryItem,
  MessageWebhook,
  NotificationBody,
} from '@/shared/api/green-api'
import type { Message, MessageStatus } from './types'

const MESSAGE_WEBHOOKS = new Set([
  'incomingMessageReceived',
  'outgoingMessageReceived',
  'outgoingAPIMessageReceived',
])

function isMessageWebhook(body: NotificationBody): body is MessageWebhook {
  return MESSAGE_WEBHOOKS.has(body.typeWebhook)
}

/** Текст лежит в разных полях в зависимости от типа сообщения. */
function extractText(data: MessageWebhook['messageData']): string | null {
  return (
    data.textMessageData?.textMessage ??
    data.extendedTextMessageData?.text ??
    null
  )
}

/**
 * Превращает уведомление в сообщение.
 * Возвращает null для всего, что не является текстовым сообщением
 * (статусы доставки, картинки, служебные события) — по условию задачи
 * интерфейс работает только с текстом.
 */
export function messageFromNotification(body: NotificationBody): Message | null {
  if (!isMessageWebhook(body)) return null

  const text = extractText(body.messageData)
  if (text === null) return null

  const phone = body.senderData.senderPhoneNumber

  return {
    id: body.idMessage,
    chatId: body.senderData.chatId,
    text,
    direction:
      body.typeWebhook === 'incomingMessageReceived' ? 'incoming' : 'outgoing',
    timestamp: body.timestamp,
    status: body.typeWebhook === 'incomingMessageReceived' ? 'delivered' : 'sent',
    senderName: body.senderData.senderName ?? body.senderData.senderContactName,
    senderPhone: phone === undefined ? undefined : String(phone),
  }
}

export function messageFromHistoryItem(item: ChatHistoryItem): Message | null {
  const text = item.textMessage ?? item.extendedTextMessage?.text ?? null
  if (text === null) return null

  const status: MessageStatus =
    item.type === 'incoming' ? 'delivered' : (item.statusMessage ?? 'sent')

  return {
    id: item.idMessage,
    chatId: item.chatId,
    text,
    direction: item.type,
    timestamp: item.timestamp,
    status,
    senderName: item.senderName,
  }
}

/** Сортировка по возрастанию времени: сверху старые, снизу свежие. */
export function byTimestampAsc(a: Message, b: Message): number {
  return a.timestamp - b.timestamp
}

/**
 * Добавляет сообщение в список, не допуская дублей:
 * одно и то же сообщение может прийти и из истории, и из очереди уведомлений.
 */
export function upsertMessage(messages: Message[], incoming: Message): Message[] {
  const index = messages.findIndex((message) => message.id === incoming.id)
  if (index === -1) return [...messages, incoming].sort(byTimestampAsc)

  const next = [...messages]
  next[index] = { ...messages[index], ...incoming }
  return next.sort(byTimestampAsc)
}
