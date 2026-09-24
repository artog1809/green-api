export type MessageDirection = 'incoming' | 'outgoing'

export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed'

export interface Message {
  /** idMessage из GREEN-API, для неотправленных — временный локальный id. */
  id: string
  /** chatId в том виде, в каком его вернул GREEN-API. */
  chatId: string
  text: string
  direction: MessageDirection
  /** UNIX-время в секундах. */
  timestamp: number
  status: MessageStatus
  senderName?: string
  /** Телефон отправителя: в MAX только он связывает уведомление с чатом. */
  senderPhone?: string
}
