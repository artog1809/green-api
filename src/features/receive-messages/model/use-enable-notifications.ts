import { useMutation } from '@tanstack/react-query'
import { useAuthorizedGreenApiClient } from '@/entities/session'

/**
 * Включает уведомления, которые нужны интерфейсу, и очищает webhookUrl,
 * чтобы они шли в очередь, а не на сторонний адрес.
 * Инстанс после этого перезапускается.
 */
export function useEnableNotifications() {
  const client = useAuthorizedGreenApiClient()

  return useMutation({
    mutationFn: () =>
      client.setSettings({
        webhookUrl: '',
        incomingWebhook: 'yes',
        outgoingWebhook: 'yes',
        outgoingAPIMessageWebhook: 'yes',
      }),
  })
}
