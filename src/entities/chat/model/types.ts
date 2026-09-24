export interface Chat {
  /** Нормализованный телефон — стабильный локальный ключ чата. */
  phone: string
  /**
   * Идентификатор для отправки. До первого ответа собеседника это
   * `<телефон>@c.us`, после — реальный chatId, который присылает MAX.
   */
  chatId: string
  name: string
  createdAt: number
  lastMessageText?: string
  lastMessageAt?: number
  /** Сколько входящих пришло, пока чат не был открыт. */
  unreadCount: number
}
