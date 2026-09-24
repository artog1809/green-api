import { beforeEach, describe, expect, it, vi } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/shared/lib/testing/render-with-providers'
import { useSessionStore } from '@/entities/session'
import { LoginForm } from './LoginForm'

function mockFetchOnce(body: unknown, init: ResponseInit = { status: 200 }) {
  const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify(body), init))
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

describe('LoginForm', () => {
  beforeEach(() => {
    vi.unstubAllGlobals()
    useSessionStore.setState({ credentials: null })
    localStorage.clear()
  })

  it('не отправляет запрос, пока поля не заполнены', async () => {
    const fetchMock = mockFetchOnce({})
    renderWithProviders(<LoginForm />)

    await userEvent.click(screen.getByRole('button', { name: 'Войти' }))

    expect(await screen.findByText('Укажите idInstance')).toBeInTheDocument()
    expect(screen.getByText('Укажите apiTokenInstance')).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('не отправляет запрос с пустым или неполным apiUrl', async () => {
    const fetchMock = mockFetchOnce({})
    renderWithProviders(<LoginForm />)

    await userEvent.type(screen.getByLabelText('idInstance'), '1101000001')
    await userEvent.type(screen.getByLabelText('apiTokenInstance'), 'secret-token')

    const apiUrlField = screen.getByLabelText('apiUrl')
    await userEvent.clear(apiUrlField)
    await userEvent.click(screen.getByRole('button', { name: 'Войти' }))
    expect(await screen.findByText('Укажите apiUrl')).toBeInTheDocument()

    await userEvent.type(apiUrlField, 'api.green-api.com')
    await userEvent.click(screen.getByRole('button', { name: 'Войти' }))
    expect(
      await screen.findByText(/Адрес должен быть полным/),
    ).toBeInTheDocument()

    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('подставляет адрес API по умолчанию', () => {
    renderWithProviders(<LoginForm />)

    expect(screen.getByLabelText('apiUrl')).toHaveValue('https://api.green-api.com')
  })

  it('требует, чтобы idInstance состоял из цифр', async () => {
    mockFetchOnce({})
    renderWithProviders(<LoginForm />)

    await userEvent.type(screen.getByLabelText('idInstance'), 'instance-1')
    await userEvent.type(screen.getByLabelText('apiTokenInstance'), 'token')
    await userEvent.click(screen.getByRole('button', { name: 'Войти' }))

    expect(
      await screen.findByText('idInstance состоит только из цифр'),
    ).toBeInTheDocument()
  })

  it('сохраняет учётные данные, когда инстанс авторизован', async () => {
    const fetchMock = mockFetchOnce({ stateInstance: 'authorized' })
    renderWithProviders(<LoginForm />)

    await userEvent.type(screen.getByLabelText('idInstance'), '1101000001')
    await userEvent.type(screen.getByLabelText('apiTokenInstance'), 'secret-token')
    await userEvent.click(screen.getByRole('button', { name: 'Войти' }))

    await waitFor(() => {
      expect(useSessionStore.getState().credentials).toEqual({
        idInstance: '1101000001',
        apiTokenInstance: 'secret-token',
        apiUrl: 'https://api.green-api.com',
      })
    })

    const [url] = fetchMock.mock.calls[0] as [URL]
    expect(url.toString()).toBe(
      'https://api.green-api.com/waInstance1101000001/getStateInstance/secret-token',
    )
  })

  it('объясняет, что делать, если инстанс не авторизован', async () => {
    mockFetchOnce({ stateInstance: 'notAuthorized' })
    renderWithProviders(<LoginForm />)

    await userEvent.type(screen.getByLabelText('idInstance'), '1101000001')
    await userEvent.type(screen.getByLabelText('apiTokenInstance'), 'secret-token')
    await userEvent.click(screen.getByRole('button', { name: 'Войти' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Инстанс не авторизован',
    )
    expect(useSessionStore.getState().credentials).toBeNull()
  })
})
