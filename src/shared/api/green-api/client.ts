import { CHAT_HISTORY_COUNT, RECEIVE_TIMEOUT_SECONDS } from '@/shared/config/env'
import { classifyStatus, GreenApiError } from './errors'
import type {
  ChatHistoryItem,
  GreenApiCredentials,
  InstanceSettings,
  ReceiveNotificationResponse,
  SendMessageResponse,
  SetSettingsResponse,
  StateInstanceResponse,
} from './types'

interface RequestOptions {
  method: 'GET' | 'POST' | 'DELETE'
  /** Имя метода: подставляется перед apiTokenInstance. */
  path: string
  /** Сегмент пути ПОСЛЕ apiTokenInstance — так устроен deleteNotification. */
  pathAfterToken?: string
  body?: unknown
  signal?: AbortSignal
  query?: Record<string, string>
}

/**
 * Клиент REST API GREEN-API.
 * Все методы работают с одним инстансом и нормализуют ошибки в GreenApiError,
 * чтобы верхние слои не разбирали HTTP-коды.
 */
export function createGreenApiClient(credentials: GreenApiCredentials) {
  const { idInstance, apiTokenInstance, apiUrl } = credentials
  const base = `${apiUrl.replace(/\/+$/, '')}/waInstance${idInstance}`

  async function request<T>({
    method,
    path,
    pathAfterToken,
    body,
    signal,
    query,
  }: RequestOptions): Promise<T | null> {
    const tail = pathAfterToken ? `/${pathAfterToken}` : ''
    const url = new URL(`${base}/${path}/${apiTokenInstance}${tail}`)
    for (const [key, value] of Object.entries(query ?? {})) {
      url.searchParams.set(key, value)
    }

    let response: Response
    try {
      response = await fetch(url, {
        method,
        signal,
        headers: body ? { 'Content-Type': 'application/json' } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      })
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new GreenApiError('aborted')
      }
      throw new GreenApiError('network')
    }

    if (!response.ok) {
      const details = await response.text().catch(() => '')
      throw new GreenApiError(
        classifyStatus(response.status, details),
        response.status,
        details.slice(0, 200) || undefined,
      )
    }

    // receiveNotification при пустой очереди отвечает пустым телом.
    const text = await response.text()
    if (!text.trim()) return null

    try {
      return JSON.parse(text) as T
    } catch {
      throw new GreenApiError('server', response.status, 'некорректный JSON')
    }
  }

  return {
    credentials,

    /** Состояние инстанса — используем как проверку учётных данных при входе. */
    async getStateInstance(signal?: AbortSignal): Promise<StateInstanceResponse> {
      const data = await request<StateInstanceResponse>({
        method: 'GET',
        path: 'getStateInstance',
        signal,
      })
      if (!data) throw new GreenApiError('server')
      return data
    },

    /** Настройки инстанса: по ним видно, включены ли уведомления в очередь. */
    async getSettings(signal?: AbortSignal): Promise<InstanceSettings> {
      const data = await request<InstanceSettings>({
        method: 'GET',
        path: 'getSettings',
        signal,
      })
      return data ?? {}
    },

    /**
     * Меняет настройки выборочно. Инстанс при этом перезапускается,
     * настройки применяются в течение пяти минут.
     */
    async setSettings(
      settings: InstanceSettings,
      signal?: AbortSignal,
    ): Promise<SetSettingsResponse> {
      const data = await request<SetSettingsResponse>({
        method: 'POST',
        path: 'setSettings',
        body: settings,
        signal,
      })
      return data ?? { saveSettings: false }
    },

    async sendMessage(
      params: { chatId: string; message: string },
      signal?: AbortSignal,
    ): Promise<SendMessageResponse> {
      const data = await request<SendMessageResponse>({
        method: 'POST',
        path: 'sendMessage',
        body: params,
        signal,
      })
      if (!data?.idMessage) throw new GreenApiError('server')
      return data
    },

    /**
     * Забирает следующее уведомление из очереди.
     * Держит соединение до RECEIVE_TIMEOUT_SECONDS и возвращает null,
     * если за это время ничего не пришло.
     */
    receiveNotification(
      signal?: AbortSignal,
    ): Promise<ReceiveNotificationResponse | null> {
      return request<ReceiveNotificationResponse>({
        method: 'GET',
        path: 'receiveNotification',
        query: { receiveTimeout: String(RECEIVE_TIMEOUT_SECONDS) },
        signal,
      })
    },

    /**
     * Подтверждает обработку уведомления. Без этого вызова очередь встаёт
     * и следующие сообщения не придут.
     */
    async deleteNotification(
      receiptId: number,
      signal?: AbortSignal,
    ): Promise<void> {
      await request({
        method: 'DELETE',
        path: 'deleteNotification',
        pathAfterToken: String(receiptId),
        signal,
      })
    },

    async getChatHistory(
      params: { chatId: string; count?: number },
      signal?: AbortSignal,
    ): Promise<ChatHistoryItem[]> {
      const data = await request<ChatHistoryItem[]>({
        method: 'POST',
        path: 'getChatHistory',
        body: { chatId: params.chatId, count: params.count ?? CHAT_HISTORY_COUNT },
        signal,
      })
      return Array.isArray(data) ? data : []
    },
  }
}

export type GreenApiClient = ReturnType<typeof createGreenApiClient>
