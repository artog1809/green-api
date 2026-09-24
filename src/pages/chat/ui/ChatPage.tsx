import { ErrorBanner } from '@/shared/ui/ErrorBanner'
import { QueueSettingsBanner, useNotificationPoller } from '@/features/receive-messages'
import { ChatList } from '@/widgets/chat-list'
import { ChatWindow } from '@/widgets/chat-window'
import styles from './ChatPage.module.css'

export function ChatPage() {
  // Очередь уведомлений одна на инстанс, поэтому опрос тоже один —
  // он работает, только пока открыт чат.
  const { error } = useNotificationPoller()

  return (
    <div className={styles.layout}>
      <QueueSettingsBanner />
      {error ? <ErrorBanner message={error} /> : null}
      <div className={styles.body}>
        <ChatList />
        <ChatWindow />
      </div>
    </div>
  )
}
