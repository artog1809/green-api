import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toErrorMessage } from '@/shared/api/green-api'
import { nowInSeconds } from '@/shared/lib/datetime'
import type { Chat } from '@/entities/chat'
import { useChatsStore } from '@/entities/chat'
import {
  patchMessageInCache,
  pushMessageToCache,
  removeMessageFromCache,
} from '@/entities/message'
import type { Message } from '@/entities/message'
import { useAuthorizedGreenApiClient } from '@/entities/session'

interface SendVariables {
  text: string
  localId: string
}

interface Failure {
  localId: string
  text: string
  message: string
}

function createLocalId(): string {
  return `local-${crypto.randomUUID()}`
}

/**
 * Отправка с оптимистичным добавлением сообщения: пузырь появляется сразу,
 * а статус уточняется ответом GREEN-API.
 */
export function useSendMessage(chat: Chat) {
  const client = useAuthorizedGreenApiClient()
  const queryClient = useQueryClient()
  const registerMessage = useChatsStore((state) => state.registerMessage)
  const [failure, setFailure] = useState<Failure | null>(null)

  const mutation = useMutation({
    mutationFn: ({ text }: SendVariables) =>
      client.sendMessage({ chatId: chat.chatId, message: text }),

    onMutate: ({ text, localId }) => {
      const optimistic: Message = {
        id: localId,
        chatId: chat.chatId,
        text,
        direction: 'outgoing',
        timestamp: nowInSeconds(),
        status: 'sending',
      }
      pushMessageToCache(queryClient, chat.phone, optimistic)
      registerMessage({
        phone: chat.phone,
        text,
        timestamp: optimistic.timestamp,
        incoming: false,
      })
    },

    onSuccess: ({ idMessage }, { localId }) => {
      patchMessageInCache(queryClient, chat.phone, localId, {
        id: idMessage,
        status: 'sent',
      })
    },

    onError: (error, { localId, text }) => {
      patchMessageInCache(queryClient, chat.phone, localId, { status: 'failed' })
      setFailure({ localId, text, message: toErrorMessage(error) })
    },
  })

  const send = (text: string) => {
    const trimmed = text.trim()
    if (!trimmed) return

    setFailure(null)
    mutation.mutate({ text: trimmed, localId: createLocalId() })
  }

  const retry = () => {
    if (!failure) return

    removeMessageFromCache(queryClient, chat.phone, failure.localId)
    send(failure.text)
  }

  return { send, retry, failure, isSending: mutation.isPending }
}
