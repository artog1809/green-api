import { describe, expect, it } from 'vitest'
import type { ChatHistoryItem, NotificationBody } from '@/shared/api/green-api'
import { messageFromHistoryItem, messageFromNotification, upsertMessage } from './mappers'
import type { Message } from './types'

const incoming: NotificationBody = {
  typeWebhook: 'incomingMessageReceived',
  timestamp: 1763115112,
  idMessage: 'MSG-1',
  senderData: {
    chatId: '10000000',
    sender: '10000000',
    senderName: 'Иван',
    senderPhoneNumber: 79991234567,
  },
  messageData: {
    typeMessage: 'textMessage',
    textMessageData: { textMessage: 'Привет' },
  },
}

describe('messageFromNotification', () => {
  it('разбирает входящее текстовое сообщение', () => {
    expect(messageFromNotification(incoming)).toEqual({
      id: 'MSG-1',
      chatId: '10000000',
      text: 'Привет',
      direction: 'incoming',
      timestamp: 1763115112,
      status: 'delivered',
      senderName: 'Иван',
      senderPhone: '79991234567',
    })
  })

  it('читает текст из extendedTextMessageData', () => {
    const body = {
      ...incoming,
      messageData: {
        typeMessage: 'extendedTextMessage',
        extendedTextMessageData: { text: 'Ссылка' },
      },
    } as NotificationBody

    expect(messageFromNotification(body)?.text).toBe('Ссылка')
  })

  it('помечает исходящее уведомление как outgoing', () => {
    const body = { ...incoming, typeWebhook: 'outgoingAPIMessageReceived' } as NotificationBody

    expect(messageFromNotification(body)?.direction).toBe('outgoing')
  })

  it('игнорирует нетекстовые уведомления', () => {
    const status: NotificationBody = {
      typeWebhook: 'outgoingMessageStatus',
      timestamp: 1763115112,
      idMessage: 'MSG-1',
      status: 'delivered',
    }

    expect(messageFromNotification(status)).toBeNull()
  })

  it('игнорирует сообщение без текста', () => {
    const body = {
      ...incoming,
      messageData: { typeMessage: 'imageMessage' },
    } as NotificationBody

    expect(messageFromNotification(body)).toBeNull()
  })
})

describe('messageFromHistoryItem', () => {
  it('разбирает исходящее сообщение истории', () => {
    const item: ChatHistoryItem = {
      type: 'outgoing',
      idMessage: 'MSG-2',
      timestamp: 1763115200,
      typeMessage: 'textMessage',
      chatId: '10000000',
      textMessage: 'Как дела?',
      statusMessage: 'read',
    }

    expect(messageFromHistoryItem(item)).toMatchObject({
      id: 'MSG-2',
      direction: 'outgoing',
      status: 'read',
      text: 'Как дела?',
    })
  })

  it('для входящих подставляет статус delivered', () => {
    const item: ChatHistoryItem = {
      type: 'incoming',
      idMessage: 'MSG-3',
      timestamp: 1763115300,
      typeMessage: 'textMessage',
      chatId: '10000000',
      textMessage: 'Норм',
    }

    expect(messageFromHistoryItem(item)?.status).toBe('delivered')
  })
})

describe('upsertMessage', () => {
  const base: Message = {
    id: 'MSG-1',
    chatId: '10000000',
    text: 'Привет',
    direction: 'outgoing',
    timestamp: 100,
    status: 'sending',
  }

  it('добавляет новое сообщение и сортирует по времени', () => {
    const older: Message = { ...base, id: 'MSG-0', timestamp: 50 }

    expect(upsertMessage([base], older).map((message) => message.id)).toEqual([
      'MSG-0',
      'MSG-1',
    ])
  })

  it('не дублирует сообщение с тем же id, а обновляет его', () => {
    const result = upsertMessage([base], { ...base, status: 'delivered' })

    expect(result).toHaveLength(1)
    expect(result[0]?.status).toBe('delivered')
  })
})
