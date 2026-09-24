import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { Message } from '../../model/types'
import { MessageBubble } from './MessageBubble'

function messageWith(overrides: Partial<Message> = {}): Message {
  return {
    id: 'MSG-1',
    chatId: '10000000',
    text: 'Привет',
    direction: 'outgoing',
    timestamp: 1763115112,
    status: 'sent',
    ...overrides,
  }
}

describe('MessageBubble', () => {
  it.each([
    ['sending', 'Отправляется'],
    ['sent', 'Отправлено'],
    ['delivered', 'Доставлено'],
    ['read', 'Прочитано'],
    ['failed', 'Не отправлено'],
  ] as const)('показывает статус %s как «%s»', (status, label) => {
    render(<MessageBubble message={messageWith({ status })} />)

    expect(screen.getByRole('img', { name: label })).toBeInTheDocument()
  })

  it('у входящих сообщений статуса нет', () => {
    render(
      <MessageBubble message={messageWith({ direction: 'incoming', status: 'delivered' })} />,
    )

    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    expect(screen.getByText('Привет')).toBeInTheDocument()
  })
})
