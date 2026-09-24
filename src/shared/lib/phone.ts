const CHAT_ID_SUFFIX = '@c.us'
const MIN_DIGITS = 10
const MAX_DIGITS = 15

/**
 * Приводит пользовательский ввод к числовому виду:
 * «+7 (999) 123-45-67» и «8 999 123 45 67» дают один и тот же номер.
 */
export function normalizePhone(input: string): string {
  const digits = input.replace(/\D/g, '')
  if (digits.length === 11 && digits.startsWith('8')) {
    return `7${digits.slice(1)}`
  }
  return digits
}

export function isValidPhone(input: string): boolean {
  const digits = normalizePhone(input)
  return digits.length >= MIN_DIGITS && digits.length <= MAX_DIGITS
}

/** Телефон -> идентификатор личного чата в формате GREEN-API. */
export function toChatId(input: string): string {
  return `${normalizePhone(input)}${CHAT_ID_SUFFIX}`
}

/** Возвращает телефон из chatId, либо пустую строку для числовых id MAX. */
export function phoneFromChatId(chatId: string): string {
  const [id = ''] = chatId.split('@')
  return id.length >= MIN_DIGITS ? id : ''
}

/** Человекочитаемый номер: 79991234567 -> +7 999 123-45-67. */
export function formatPhone(input: string): string {
  const digits = normalizePhone(input)
  if (digits.length === 11 && digits.startsWith('7')) {
    return `+7 ${digits.slice(1, 4)} ${digits.slice(4, 7)}-${digits.slice(7, 9)}-${digits.slice(9)}`
  }
  return digits ? `+${digits}` : ''
}
