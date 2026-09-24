/**
 * Лог сырых уведомлений в дев-режиме: очередь одноразовая, и после
 * deleteNotification посмотреть на уведомление уже негде.
 */
export function logNotification(stage: string, payload?: unknown): void {
  if (!import.meta.env.DEV) return

  if (payload === undefined) {
    console.info(`[green-api] ${stage}`)
    return
  }
  console.info(`[green-api] ${stage}`, payload)
}
