import { describe, expect, it } from 'vitest'
import { describeQueueProblem } from './use-queue-settings-check'

describe('describeQueueProblem', () => {
  it('сообщает, что уведомления уходят на webhook вместо очереди', () => {
    expect(
      describeQueueProblem({
        webhookUrl: 'https://example.com/hook',
        incomingWebhook: 'yes',
      }),
    ).toContain('webhookUrl')
  })

  it('сообщает о выключенных входящих уведомлениях', () => {
    expect(
      describeQueueProblem({ webhookUrl: '', incomingWebhook: 'no' }),
    ).toContain('incomingWebhook')
  })

  it('молчит, когда инстанс настроен верно', () => {
    expect(
      describeQueueProblem({ webhookUrl: '', incomingWebhook: 'yes' }),
    ).toBeNull()
  })
})
