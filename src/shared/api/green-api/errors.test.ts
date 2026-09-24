import { describe, expect, it } from 'vitest'
import { classifyStatus, GreenApiError, isFatal } from './errors'

describe('classifyStatus', () => {
  it('различает перезапуск инстанса и неверный запрос по телу ответа', () => {
    expect(classifyStatus(400, 'instance in starting process try later')).toBe(
      'starting',
    )
    expect(classifyStatus(400, 'bad request data')).toBe('bad-request')
  })

  it.each([
    [401, 'auth'],
    [403, 'auth'],
    [429, 'rate-limit'],
    [466, 'quota'],
    [500, 'server'],
    [502, 'server'],
  ])('код %i — это %s', (status, kind) => {
    expect(classifyStatus(status)).toBe(kind)
  })
})

describe('GreenApiError', () => {
  it('466 говорит про лимит тарифа, а не про учётные данные', () => {
    const error = new GreenApiError('quota', 466, '{"invokeStatus":"QUOTE_EXCEEDED"}')

    expect(error.message).toContain('лимит тарифа')
    expect(error.message).not.toContain('Неверный')
    expect(error.message).toContain('HTTP 466')
  })

  it('называет, какое именно поле неверно', () => {
    expect(new GreenApiError('auth', 401).message).toContain('apiTokenInstance')
    expect(new GreenApiError('auth', 403).message).toContain('idInstance')
  })
})

describe('isFatal', () => {
  it.each(['auth', 'bad-request', 'quota'] as const)(
    '%s — повторять бессмысленно',
    (kind) => {
      expect(isFatal(new GreenApiError(kind))).toBe(true)
    },
  )

  it.each(['starting', 'rate-limit', 'server', 'network'] as const)(
    '%s — можно повторить',
    (kind) => {
      expect(isFatal(new GreenApiError(kind))).toBe(false)
    },
  )
})
