import { beforeEach, describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { renderWithProviders } from '@/shared/lib/testing/render-with-providers'
import { useChatsStore } from '@/entities/chat'
import { useSessionStore } from '@/entities/session'
import { ChatList } from './ChatList'

describe('ChatList', () => {
  beforeEach(() => {
    localStorage.clear()
    useChatsStore.setState({ chats: [], activePhone: null })
    useSessionStore.setState({
      credentials: {
        idInstance: '1101000001',
        apiTokenInstance: 'secret-token',
        apiUrl: 'https://api.green-api.com',
      },
    })
  })

  it('показывает инстанс, под которым выполнен вход', () => {
    renderWithProviders(<ChatList />)

    expect(screen.getByText('Инстанс 1101000001')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Выйти' })).toBeInTheDocument()
  })

  it('выход очищает сессию и чаты', async () => {
    useChatsStore.setState({
      chats: [
        {
          phone: '79991234567',
          chatId: '79991234567@c.us',
          name: '+7 999 123-45-67',
          createdAt: 1763115000,
          unreadCount: 0,
        },
      ],
      activePhone: null,
    })

    renderWithProviders(<ChatList />)
    await userEvent.click(screen.getByRole('button', { name: 'Выйти' }))

    expect(useSessionStore.getState().credentials).toBeNull()
    expect(useChatsStore.getState().chats).toEqual([])
  })
})
