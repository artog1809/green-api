import { beforeEach, describe, expect, it, vi } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { createGreenApiClient } from '@/shared/api/green-api'
import { messagesQueryKey, pushMessageToCache, useMessagesQuery } from './messages-query'
import type { Message } from '../model/types'

const client = createGreenApiClient({
  idInstance: '1101000001',
  apiTokenInstance: 'secret-token',
  apiUrl: 'https://api.green-api.com',
})

const params = { phone: '79991234567', chatId: '10000000' }

const fromQueue: Message = {
  id: 'MSG-FRESH',
  chatId: '10000000',
  text: 'Пришло, пока чат был закрыт',
  direction: 'incoming',
  timestamp: 200,
  status: 'delivered',
}

function setup() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
  return { queryClient, wrapper }
}

describe('useMessagesQuery', () => {
  beforeEach(() => {
    vi.unstubAllGlobals()
  })

  it('дополняет историю сообщениями, которые уже пришли из очереди', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve(
          new Response(
            JSON.stringify([
              {
                type: 'outgoing',
                idMessage: 'MSG-OLD',
                timestamp: 100,
                typeMessage: 'textMessage',
                chatId: '10000000',
                textMessage: 'Старое сообщение',
                statusMessage: 'read',
              },
            ]),
            { status: 200 },
          ),
        ),
      ),
    )

    const { queryClient, wrapper } = setup()
    // Сообщение из очереди легло в кэш до того, как чат открыли.
    pushMessageToCache(queryClient, params.phone, fromQueue)

    const { result } = renderHook(() => useMessagesQuery(client, params), { wrapper })

    // Кэш уже не пуст, поэтому запрос сразу «успешен» — ждём именно данные.
    await waitFor(() =>
      expect(result.current.data?.map((message) => message.id)).toEqual([
        'MSG-OLD',
        'MSG-FRESH',
      ]),
    )
    expect(queryClient.getQueryData<Message[]>(messagesQueryKey(params.phone))).toHaveLength(2)
  })

  it('не ходит за историей, пока чат не выбран', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    const { wrapper } = setup()
    renderHook(() => useMessagesQuery(client, null), { wrapper })

    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
