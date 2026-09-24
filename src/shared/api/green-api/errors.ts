export type GreenApiErrorKind =
  | 'network'
  | 'aborted'
  | 'auth'
  | 'rate-limit'
  | 'quota'
  | 'starting'
  | 'bad-request'
  | 'server'

const MESSAGES: Record<GreenApiErrorKind, string> = {
  network: 'Нет связи с GREEN-API. Проверьте подключение к интернету.',
  aborted: 'Запрос отменён.',
  auth: 'GREEN-API не принял учётные данные инстанса.',
  'rate-limit': 'Слишком много запросов к GREEN-API. Попробуйте позже.',
  quota: 'Исчерпан лимит тарифа GREEN-API. Смените тариф в личном кабинете.',
  starting: 'Инстанс перезапускается. Подождите несколько минут.',
  'bad-request': 'GREEN-API отклонил запрос.',
  server: 'GREEN-API временно недоступен. Попробуйте позже.',
}

/** Уточнения по конкретным кодам: они называют, что именно неверно. */
const STATUS_MESSAGES: Record<number, string> = {
  401: 'Неверный apiTokenInstance.',
  403: 'Неверный idInstance или адрес API.',
}

/**
 * Разбор кода ответа GREEN-API.
 * 400 отдаётся и на перезапуск инстанса, и на неверные параметры, поэтому
 * различаем их по телу ответа: перезапуск проходит сам, остальное — нет.
 */
export function classifyStatus(status: number, body = ''): GreenApiErrorKind {
  if (status === 400) {
    return /starting|not authorized/i.test(body) ? 'starting' : 'bad-request'
  }
  if (status === 401 || status === 403) return 'auth'
  if (status === 429) return 'rate-limit'
  if (status === 466) return 'quota'
  if (status >= 500) return 'server'
  return 'bad-request'
}

export class GreenApiError extends Error {
  readonly kind: GreenApiErrorKind
  readonly status?: number

  constructor(kind: GreenApiErrorKind, status?: number, details?: string) {
    const base = (status !== undefined && STATUS_MESSAGES[status]) || MESSAGES[kind]
    const context = [
      status === undefined ? '' : `HTTP ${status}`,
      details ?? '',
    ]
      .filter(Boolean)
      .join(': ')

    super(context ? `${base} (${context})` : base)
    this.name = 'GreenApiError'
    this.kind = kind
    this.status = status
  }
}

/** Ошибка, после которой повторять запрос с теми же данными бессмысленно. */
export function isFatal(error: unknown): boolean {
  if (!(error instanceof GreenApiError)) return false

  return (
    error.kind === 'auth' || error.kind === 'bad-request' || error.kind === 'quota'
  )
}

export function toErrorMessage(error: unknown): string {
  if (error instanceof GreenApiError) return error.message
  if (error instanceof Error) return error.message
  return 'Неизвестная ошибка'
}
