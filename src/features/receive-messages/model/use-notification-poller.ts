import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { QueryClient } from '@tanstack/react-query'
import { GreenApiError, isFatal, toErrorMessage } from '@/shared/api/green-api'
import { MIN_POLL_INTERVAL_MS } from '@/shared/config/env'
import { logNotification } from '@/shared/lib/debug'
import type {
  GreenApiClient,
  NotificationBody,
  OutgoingMessageStatusWebhook,
} from '@/shared/api/green-api'
import { useChatsStore } from '@/entities/chat'
import {
  messageFromNotification,
  patchMessageInCache,
  pushMessageToCache,
} from '@/entities/message'
import { useGreenApiClient } from '@/entities/session'
import { findChatPhoneByMessageId } from './notification-router'

const BASE_RETRY_DELAY_MS = 1000
const MAX_RETRY_DELAY_MS = 30_000

function isStatusWebhook(
  body: NotificationBody,
): body is OutgoingMessageStatusWebhook {
  return body.typeWebhook === 'outgoingMessageStatus'
}

function delay(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    const timer = setTimeout(resolve, ms)
    signal.addEventListener('abort', () => {
      clearTimeout(timer)
      resolve()
    })
  })
}

/**
 * Опрос очереди уведомлений GREEN-API. Работает, пока есть хотя бы один чат:
 * входящие раскладываются по всем чатам, а не только по открытому.
 *
 * Цикл: receiveNotification -> обработка -> deleteNotification, без которого
 * очередь встанет -> следующий запрос. Если уведомление пришло, следующий
 * запрос уходит сразу, если очередь пуста — не чаще, чем раз в
 * MIN_POLL_INTERVAL_MS. При сетевых ошибках — экспоненциальная пауза.
 */
export function useNotificationPoller(): { error: string | null } {
  const client = useGreenApiClient()
  const hasChats = useChatsStore((state) => state.chats.length > 0)
  const queryClient = useQueryClient()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!client || !hasChats) return

    const controller = new AbortController()

    void poll(client, queryClient, controller.signal, setError)

    return () => controller.abort()
  }, [client, hasChats, queryClient])

  return { error }
}

async function poll(
  client: GreenApiClient,
  queryClient: QueryClient,
  signal: AbortSignal,
  setError: (message: string | null) => void,
): Promise<void> {
  let attempt = 0

  while (!signal.aborted) {
    const startedAt = Date.now()

    try {
      const notification = await client.receiveNotification(signal)
      attempt = 0
      setError(null)

      if (notification) {
        logNotification('уведомление из очереди', notification.body)
        handleNotification(queryClient, notification.body)
        // Подтверждаем любое уведомление, даже чужое: пока оно висит в
        // очереди, следующие сообщения не придут.
        await client.deleteNotification(notification.receiptId, signal)
        continue
      }

      const elapsed = Date.now() - startedAt
      if (elapsed < MIN_POLL_INTERVAL_MS) {
        await delay(MIN_POLL_INTERVAL_MS - elapsed, signal)
      }
    } catch (caught) {
      if (signal.aborted) return
      if (caught instanceof GreenApiError && caught.kind === 'aborted') return

      setError(toErrorMessage(caught))
      if (isFatal(caught)) return

      attempt += 1
      const timeout = Math.min(
        BASE_RETRY_DELAY_MS * 2 ** (attempt - 1),
        MAX_RETRY_DELAY_MS,
      )
      await delay(timeout, signal)
    }
  }
}

function handleNotification(
  queryClient: QueryClient,
  body: NotificationBody,
): void {
  const { ensureChat, linkChatId, registerMessage } = useChatsStore.getState()

  if (isStatusWebhook(body)) {
    if (body.status !== 'delivered' && body.status !== 'read') return

    const phone = findChatPhoneByMessageId(queryClient, body.idMessage)
    if (!phone) return

    patchMessageInCache(queryClient, phone, body.idMessage, { status: body.status })
    return
  }

  const message = messageFromNotification(body)
  if (!message) {
    logNotification(`пропущено: не текстовое сообщение (${body.typeWebhook})`)
    return
  }

  if (message.direction === 'outgoing') {
    // Своё сообщение мы уже показали оптимистично. Ценность уведомления в
    // том, что оно называет настоящий chatId собеседника.
    const phone = findChatPhoneByMessageId(queryClient, message.id)
    if (phone) linkChatId(phone, message.chatId)
    return
  }

  // Чат находится по телефону отправителя, а незнакомый номер заводит новый:
  // уведомление всё равно удаляется из очереди, и без этого оно пропало бы.
  const chat = ensureChat({
    chatId: message.chatId,
    phone: message.senderPhone,
    name: message.senderName,
  })

  logNotification(`добавлено в чат ${chat.name}`, message.text)
  pushMessageToCache(queryClient, chat.phone, message)
  registerMessage({
    phone: chat.phone,
    text: message.text,
    timestamp: message.timestamp,
    incoming: true,
  })
}
