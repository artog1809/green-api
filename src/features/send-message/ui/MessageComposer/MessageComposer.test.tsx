import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/shared/lib/testing/render-with-providers'
import type { Chat } from '@/entities/chat'
import { useChatsStore } from '@/entities/chat'
import { messagesQueryKey } from '@/entities/message'
import type { Message } from '@/entities/message'
import { useSessionStore } from '@/entities/session'
import { MessageComposer } from './MessageComposer'

const chat: Chat = {
  phone: '79991234567',
  chatId: '79991234567@c.us',
  name: '+7 999 123-45-67',
  createdAt: 1763115000,
  unreadCount: 0,
}

function mockFetch(response: Response) {
  const fetchMock = vi.fn((_url: URL, _init?: RequestInit) => Promise.resolve(response))
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

describe('MessageComposer', () => {
  beforeEach(() => {
    vi.unstubAllGlobals()
    localStorage.clear()
    useChatsStore.setState({ chats: [chat], activePhone: chat.phone })
    useSessionStore.setState({
      credentials: {
        idInstance: '1101000001',
        apiTokenInstance: 'secret-token',
        apiUrl: 'https://api.green-api.com',
      },
    })
  })

  it('отправляет текст методом sendMessage и очищает поле', async () => {
    const fetchMock = mockFetch(
      new Response(JSON.stringify({ idMessage: 'MSG-1' }), { status: 200 }),
    )
    const { queryClient } = renderWithProviders(<MessageComposer chat={chat} />)

    const input = screen.getByLabelText('Текст сообщения')
    await userEvent.type(input, 'Привет из теста')
    await userEvent.click(screen.getByRole('button', { name: 'Отправить' }))

    await waitFor(() => expect(fetchMock).toHaveBeenCalledOnce())

    const [url, init] = fetchMock.mock.calls[0]!
    expect(url.toString()).toBe(
      'https://api.green-api.com/waInstance1101000001/sendMessage/secret-token',
    )
    expect(JSON.parse(String(init?.body))).toEqual({
      chatId: '79991234567@c.us',
      message: 'Привет из теста',
    })
    expect(input).toHaveValue('')

    await waitFor(() => {
      const messages = queryClient.getQueryData<Message[]>(messagesQueryKey(chat.phone))
      expect(messages).toMatchObject([
        { id: 'MSG-1', text: 'Привет из теста', direction: 'outgoing', status: 'sent' },
      ])
    })
  })

  it('отправляет по Enter и не отправляет пустое сообщение', async () => {
    const fetchMock = mockFetch(
      new Response(JSON.stringify({ idMessage: 'MSG-2' }), { status: 200 }),
    )
    renderWithProviders(<MessageComposer chat={chat} />)

    const input = screen.getByLabelText('Текст сообщения')
    await userEvent.type(input, '   {Enter}')
    expect(fetchMock).not.toHaveBeenCalled()

    await userEvent.type(input, 'Ответ{Enter}')
    await waitFor(() => expect(fetchMock).toHaveBeenCalledOnce())
  })

  it('показывает ошибку и повторяет отправку', async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ idMessage: 'MSG-3' }), { status: 200 }),
      )
    vi.stubGlobal('fetch', fetchMock)

    const { queryClient } = renderWithProviders(<MessageComposer chat={chat} />)

    await userEvent.type(screen.getByLabelText('Текст сообщения'), 'Не дойдёт{Enter}')

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('Нет связи с GREEN-API')

    await userEvent.click(screen.getByRole('button', { name: 'Повторить' }))

    await waitFor(() => {
      const messages = queryClient.getQueryData<Message[]>(messagesQueryKey(chat.phone))
      expect(messages).toMatchObject([{ id: 'MSG-3', status: 'sent' }])
    })
  })
})
