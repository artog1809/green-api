/** Учётные данные инстанса GREEN-API. */
export interface GreenApiCredentials {
  idInstance: string
  apiTokenInstance: string
  apiUrl: string
}

export type InstanceState =
  | 'notAuthorized'
  | 'authorized'
  | 'blocked'
  | 'sleepMode'
  | 'starting'
  | 'yellowCard'

export interface StateInstanceResponse {
  stateInstance: InstanceState
}

/** Ответ GetSettings — нужен, чтобы проверить, идут ли уведомления в очередь. */
export interface InstanceSettings {
  webhookUrl?: string
  incomingWebhook?: 'yes' | 'no'
  outgoingWebhook?: 'yes' | 'no'
  outgoingAPIMessageWebhook?: 'yes' | 'no'
  outgoingMessageWebhook?: 'yes' | 'no'
  stateWebhook?: 'yes' | 'no'
}

export interface SetSettingsResponse {
  saveSettings: boolean
}

export interface SendMessageResponse {
  idMessage: string
}

export interface SenderData {
  chatId: string
  chatName?: string
  chatType?: string
  sender: string
  senderName?: string
  senderContactName?: string
  /** Телефон отправителя. В MAX это единственный способ связать чат с номером. */
  senderPhoneNumber?: number | string
}

export interface TextMessageData {
  textMessage: string
}

export interface ExtendedTextMessageData {
  text: string
}

export interface MessageData {
  typeMessage: string
  textMessageData?: TextMessageData
  extendedTextMessageData?: ExtendedTextMessageData
}

/** Уведомление о входящем или исходящем сообщении. */
export interface MessageWebhook {
  typeWebhook:
    | 'incomingMessageReceived'
    | 'outgoingMessageReceived'
    | 'outgoingAPIMessageReceived'
  timestamp: number
  idMessage: string
  senderData: SenderData
  messageData: MessageData
}

/** Уведомление о смене статуса исходящего сообщения. */
export interface OutgoingMessageStatusWebhook {
  typeWebhook: 'outgoingMessageStatus'
  timestamp: number
  idMessage: string
  status: 'sent' | 'delivered' | 'read' | 'failed' | 'noAccount' | 'notInGroup'
  chatId?: string
}

export interface UnknownWebhook {
  typeWebhook: string
  timestamp?: number
  [key: string]: unknown
}

export type NotificationBody =
  | MessageWebhook
  | OutgoingMessageStatusWebhook
  | UnknownWebhook

export interface ReceiveNotificationResponse {
  receiptId: number
  body: NotificationBody
}

/** Элемент ответа метода GetChatHistory. */
export interface ChatHistoryItem {
  type: 'incoming' | 'outgoing'
  idMessage: string
  timestamp: number
  typeMessage: string
  chatId: string
  textMessage?: string
  extendedTextMessage?: { text?: string }
  statusMessage?: 'sent' | 'delivered' | 'read' | 'failed'
  senderName?: string
  senderId?: string
}
