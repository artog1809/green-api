import { useQuery } from '@tanstack/react-query'
import type { InstanceSettings } from '@/shared/api/green-api'
import { useGreenApiClient } from '@/entities/session'

/**
 * Самая частая причина «сообщения не приходят» — настройки инстанса, а не код:
 * при заполненном webhookUrl уведомления уходят на webhook и в очередь не
 * попадают, а при выключенном incomingWebhook их не будет вовсе.
 */
export function describeQueueProblem(settings: InstanceSettings): string | null {
  if (settings.webhookUrl) {
    return `Уведомления уходят на webhookUrl (${settings.webhookUrl}), а не в очередь. Очистите webhookUrl в настройках инстанса GREEN-API.`
  }

  if (settings.incomingWebhook === 'no') {
    return 'В настройках инстанса выключены уведомления о входящих сообщениях (incomingWebhook). Включите их в личном кабинете GREEN-API.'
  }

  return null
}

export function useQueueSettingsCheck(): { warning: string | null } {
  const client = useGreenApiClient()

  const { data } = useQuery({
    queryKey: ['instance-settings', client?.credentials.idInstance],
    enabled: client !== null,
    staleTime: Infinity,
    retry: false,
    queryFn: ({ signal }) => client!.getSettings(signal),
  })

  return { warning: data ? describeQueueProblem(data) : null }
}
