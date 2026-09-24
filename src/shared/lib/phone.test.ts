import { describe, expect, it } from 'vitest'
import { formatPhone, isValidPhone, normalizePhone, phoneFromChatId, toChatId } from './phone'

describe('normalizePhone', () => {
  it('убирает форматирование', () => {
    expect(normalizePhone('+7 (999) 123-45-67')).toBe('79991234567')
  })

  it('приводит восьмёрку к семёрке', () => {
    expect(normalizePhone('8 999 123 45 67')).toBe('79991234567')
  })

  it('не трогает одиннадцатизначные номера других стран', () => {
    expect(normalizePhone('+1 202 555 0143')).toBe('12025550143')
  })

  it('возвращает пустую строку для ввода без цифр', () => {
    expect(normalizePhone('позвони маме')).toBe('')
  })
})

describe('isValidPhone', () => {
  it.each(['79991234567', '+7 999 123-45-67', '12025550143'])(
    'принимает %s',
    (input) => {
      expect(isValidPhone(input)).toBe(true)
    },
  )

  it.each(['', '123', '9999999999999999999'])('отклоняет %s', (input) => {
    expect(isValidPhone(input)).toBe(false)
  })
})

describe('toChatId', () => {
  it('строит идентификатор личного чата', () => {
    expect(toChatId('8 (999) 123-45-67')).toBe('79991234567@c.us')
  })
})

describe('phoneFromChatId', () => {
  it('достаёт телефон', () => {
    expect(phoneFromChatId('79991234567@c.us')).toBe('79991234567')
  })

  it('возвращает пустую строку для числового chatId MAX', () => {
    expect(phoneFromChatId('10000000')).toBe('')
  })
})

describe('formatPhone', () => {
  it('форматирует российский номер', () => {
    expect(formatPhone('79991234567')).toBe('+7 999 123-45-67')
  })

  it('оставляет остальные номера с плюсом', () => {
    expect(formatPhone('12025550143')).toBe('+12025550143')
  })
})
