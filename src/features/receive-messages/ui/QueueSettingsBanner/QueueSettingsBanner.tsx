import { toErrorMessage } from '@/shared/api/green-api'
import { ErrorBanner } from '@/shared/ui/ErrorBanner'
import { useEnableNotifications } from '../../model/use-enable-notifications'
import { useQueueSettingsCheck } from '../../model/use-queue-settings-check'
import styles from './QueueSettingsBanner.module.css'

/**
 * Инстанс, у которого выключены уведомления, ведёт себя как исправный:
 * запросы к очереди проходят, но она всегда пуста. Баннер объясняет это
 * и предлагает починить настройки одним действием.
 */
export function QueueSettingsBanner() {
  const { warning } = useQueueSettingsCheck()
  const enableNotifications = useEnableNotifications()

  if (enableNotifications.isSuccess) {
    return (
      <p className={styles.notice}>
        Настройки сохранены. Инстанс перезапускается — входящие сообщения
        начнут приходить в течение пяти минут.
      </p>
    )
  }

  if (enableNotifications.isError) {
    return (
      <ErrorBanner
        message={`Не удалось изменить настройки инстанса: ${toErrorMessage(enableNotifications.error)}`}
        onAction={() => enableNotifications.mutate()}
      />
    )
  }

  if (!warning) return null

  return (
    <ErrorBanner
      message={warning}
      actionLabel="Включить"
      isActionPending={enableNotifications.isPending}
      onAction={() => enableNotifications.mutate()}
    />
  )
}
