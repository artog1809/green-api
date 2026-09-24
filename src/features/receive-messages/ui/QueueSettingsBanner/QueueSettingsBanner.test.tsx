import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/shared/lib/testing/render-with-providers'
import { useSessionStore } from '@/entities/session'
import { QueueSettingsBanner } from './QueueSettingsBanner'

function mockSettings(settings: Record<string, unknown>) {
  const fetchMock = vi.fn((url: URL) => {
    if (url.pathname.includes('/getSettings/')) {
      return Promise.resolve(new Response(JSON.stringify(settings), { status: 200 }))
    }
    return Promise.resolve(
      new Response(JSON.stringify({ saveSettings: true }), { status: 200 }),
    )
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

describe('QueueSettingsBanner', () => {
  beforeEach(() => {
    vi.unstubAllGlobals()
    localStorage.clear()
    useSessionStore.setState({
      credentials: {
        idInstance: '1101000001',
        apiTokenInstance: 'secret-token',
        apiUrl: 'https://api.green-api.com',
      },
    })
  })

  it('молчит, когда уведомления настроены верно', async () => {
    const fetchMock = mockSettings({ webhookUrl: '', incomingWebhook: 'yes' })
    renderWithProviders(<QueueSettingsBanner />)

    await waitFor(() => expect(fetchMock).toHaveBeenCalled())
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('включает уведомления и очищает webhookUrl по кнопке', async () => {
    const fetchMock = mockSettings({ webhookUrl: '', incomingWebhook: 'no' })
    renderWithProviders(<QueueSettingsBanner />)

    expect(await screen.findByRole('alert')).toHaveTextContent('incomingWebhook')

    await userEvent.click(screen.getByRole('button', { name: 'Включить' }))

    await waitFor(() => {
      const call = fetchMock.mock.calls.find(([url]) =>
        String(url).includes('/setSettings/'),
      )
      expect(call).toBeDefined()
      const [, init] = call as unknown as [URL, RequestInit]
      expect(JSON.parse(String(init.body))).toEqual({
        webhookUrl: '',
        incomingWebhook: 'yes',
        outgoingWebhook: 'yes',
        outgoingAPIMessageWebhook: 'yes',
      })
    })

    expect(
      await screen.findByText(/Инстанс перезапускается/),
    ).toBeInTheDocument()
  })
})
