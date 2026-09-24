import { describe, expect, it } from 'vitest'
import { isValidApiUrl, normalizeApiUrl } from './api-url'

describe('normalizeApiUrl', () => {
  it('убирает пробелы и хвостовые слэши', () => {
    expect(normalizeApiUrl('  https://api.green-api.com///  ')).toBe(
      'https://api.green-api.com',
    )
  })
})

describe('isValidApiUrl', () => {
  it.each([
    'https://api.green-api.com',
    'https://7105.api.greenapi.com',
    'http://localhost:3000',
  ])('принимает %s', (value) => {
    expect(isValidApiUrl(value)).toBe(true)
  })

  it.each([
    ['пустую строку', ''],
    ['только пробелы', '   '],
    ['адрес без схемы', 'api.green-api.com'],
    ['относительный путь', '/waInstance'],
    ['чужую схему', 'ftp://api.green-api.com'],
  ])('отклоняет %s', (_case, value) => {
    expect(isValidApiUrl(value)).toBe(false)
  })
})
