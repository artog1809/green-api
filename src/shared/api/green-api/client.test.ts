import { afterEach, describe, expect, it, vi } from 'vitest'
import { createGreenApiClient } from './client'
import { GreenApiError } from './errors'

const client = createGreenApiClient({
  idInstance: '1101000001',
  apiTokenInstance: 'secret-token',
  apiUrl: 'https://api.green-api.com',
})

afterEach(() => {
  vi.unstubAllGlobals()
})

function respondWith(status: number, body: string) {
  vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(new Response(body, { status }))))
}

describe('createGreenApiClient', () => {
  it('ставит apiTokenInstance перед receiptId в deleteNotification', async () => {
    // GREEN-API ждёт .../deleteNotification/{apiTokenInstance}/{receiptId}.
    // Обратный порядок сегментов отвечает 401: токеном считается receiptId.
    const fetchMock = vi.fn(() => Promise.resolve(new Response('{}', { status: 200 })))
    vi.stubGlobal('fetch', fetchMock)

    await client.deleteNotification(42)

    const [url] = fetchMock.mock.calls[0]! as unknown as [URL]
    expect(String(url)).toBe(
      'https://api.green-api.com/waInstance1101000001/deleteNotification/secret-token/42',
    )
  })

  it('превращает 466 в ошибку лимита тарифа', async () => {
    respondWith(466, '{"invokeStatus":{"status":"QUOTE_EXCEEDED"}}')

    await expect(client.receiveNotification()).rejects.toMatchObject({
      kind: 'quota',
      status: 466,
    })
  })

  it('перезапуск инстанса не считает фатальной ошибкой', async () => {
    respondWith(400, 'instance in starting process try later')

    await expect(client.receiveNotification()).rejects.toMatchObject({
      kind: 'starting',
    })
  })

  it('пустой ответ очереди — это отсутствие уведомлений, а не ошибка', async () => {
    respondWith(200, '')

    await expect(client.receiveNotification()).resolves.toBeNull()
  })

  it('сетевой сбой отдаёт понятную ошибку', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new TypeError('Failed to fetch'))))

    await expect(client.receiveNotification()).rejects.toThrow(GreenApiError)
    await expect(client.receiveNotification()).rejects.toMatchObject({
      kind: 'network',
    })
  })
})
