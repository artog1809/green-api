import { beforeEach, describe, expect, it, vi } from 'vitest'
import { waitFor } from '@testing-library/react'
import { renderWithProviders } from '@/shared/lib/testing/render-with-providers'
import type { Chat } from '@/entities/chat'
import { useChatsStore } from '@/entities/chat'
import { messagesQueryKey } from '@/entities/message'
import type { Message } from '@/entities/message'
import { useSessionStore } from '@/entities/session'
import { useNotificationPoller } from './use-notification-poller'

function Poller() {
  useNotificationPoller()
  return null
}

function chatFor(phone: string, chatId = `${phone}@c.us`): Chat {
  return {
    phone,
    chatId,
    name: phone,
    createdAt: 1763115000,
    unreadCount: 0,
  }
}

const active = chatFor('79991234567')
const background = chatFor('79995550011')

function notificationFrom(phone: number, text: string, idMessage: string) {
  return {
    receiptId: 42,
    body: {
      typeWebhook: 'incomingMessageReceived',
      timestamp: 1763115112,
      idMessage,
      senderData: {
        chatId: '10000000',
        sender: '10000000',
        senderName: 'Иван',
        senderPhoneNumber: phone,
      },
      messageData: {
        typeMessage: 'textMessage',
        textMessageData: { textMessage: text },
      },
    },
  }
}

/** Отдаёт уведомление один раз, затем «висит», как длинный опрос. */
function mockQueue(notification: unknown) {
  let receiveCalls = 0

  const fetchMock = vi.fn((url: URL) => {
    if (url.pathname.includes('/receiveNotification/')) {
      receiveCalls += 1
      if (receiveCalls > 1) return new Promise<Response>(() => {})
      return Promise.resolve(
        new Response(JSON.stringify(notification), { status: 200 }),
      )
    }
    return Promise.resolve(new Response('{}', { status: 200 }))
  })

  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

describe('useNotificationPoller', () => {
  beforeEach(() => {
    vi.unstubAllGlobals()
    localStorage.clear()
    useChatsStore.setState({
      chats: [active, background],
      activePhone: active.phone,
    })
    useSessionStore.setState({
      credentials: {
        idInstance: '1101000001',
        apiTokenInstance: 'secret-token',
        apiUrl: 'https://api.green-api.com',
      },
    })
  })

  it('не опрашивает очередь, пока нет ни одного чата', async () => {
    useChatsStore.setState({ chats: [], activePhone: null })
    const fetchMock = mockQueue(notificationFrom(79991234567, 'Привет', 'MSG-IN'))

    renderWithProviders(<Poller />)
    await new Promise((resolve) => setTimeout(resolve, 200))

    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('доставляет сообщение в фоновый чат и считает его непрочитанным', async () => {
    const fetchMock = mockQueue(
      notificationFrom(79995550011, 'Пишу во второй чат', 'MSG-BG'),
    )

    const { queryClient } = renderWithProviders(<Poller />)

    await waitFor(() => {
      const messages = queryClient.getQueryData<Message[]>(
        messagesQueryKey(background.phone),
      )
      expect(messages).toMatchObject([
        { id: 'MSG-BG', text: 'Пишу во второй чат', direction: 'incoming' },
      ])
    })

    const chats = useChatsStore.getState().chats
    expect(chats.find((chat) => chat.phone === background.phone)).toMatchObject({
      unreadCount: 1,
      chatId: '10000000',
      lastMessageText: 'Пишу во второй чат',
    })

    // Открытый чат не трогаем: ни сообщений, ни счётчика.
    expect(
      queryClient.getQueryData<Message[]>(messagesQueryKey(active.phone)),
    ).toBeUndefined()
    expect(
      chats.find((chat) => chat.phone === active.phone)?.unreadCount,
    ).toBe(0)

    await waitFor(() => {
      const deleteCall = fetchMock.mock.calls.find(([url]) =>
        String(url).includes('/deleteNotification/'),
      )
      expect(String(deleteCall?.[0])).toBe(
        'https://api.green-api.com/waInstance1101000001/deleteNotification/secret-token/42',
      )
    })
  })

  it('не считает непрочитанным сообщение в открытый чат', async () => {
    mockQueue(notificationFrom(79991234567, 'Ответ в открытый чат', 'MSG-ACTIVE'))

    renderWithProviders(<Poller />)

    await waitFor(() => {
      expect(
        useChatsStore.getState().chats.find((chat) => chat.phone === active.phone)
          ?.lastMessageText,
      ).toBe('Ответ в открытый чат')
    })

    expect(
      useChatsStore.getState().chats.find((chat) => chat.phone === active.phone)
        ?.unreadCount,
    ).toBe(0)
  })

  it('заводит чат для незнакомого номера', async () => {
    mockQueue(notificationFrom(79998887766, 'Первое сообщение', 'MSG-NEW'))

    renderWithProviders(<Poller />)

    await waitFor(() => {
      expect(useChatsStore.getState().chats).toHaveLength(3)
    })

    const created = useChatsStore
      .getState()
      .chats.find((chat) => chat.phone === '79998887766')
    expect(created).toMatchObject({ name: 'Иван', unreadCount: 1 })
  })

  it('не уходит в непрерывный опрос, если сервер отвечает пустым телом сразу', async () => {
    // Шлюз GREEN-API может проигнорировать receiveTimeout и ответить мгновенно.
    const fetchMock = vi.fn(() => Promise.resolve(new Response('', { status: 200 })))
    vi.stubGlobal('fetch', fetchMock)

    renderWithProviders(<Poller />)

    await waitFor(() => expect(fetchMock).toHaveBeenCalled())
    await new Promise((resolve) => setTimeout(resolve, 300))

    expect(fetchMock.mock.calls.length).toBeLessThanOrEqual(2)
  })
})
