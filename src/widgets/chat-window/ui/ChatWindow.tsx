import { formatPhone } from '@/shared/lib/phone'
import { Avatar } from '@/shared/ui/Avatar'
import { selectActiveChat, useChatsStore } from '@/entities/chat'
import { useMessagesQuery } from '@/entities/message'
import { useAuthorizedGreenApiClient } from '@/entities/session'
import { MessageComposer } from '@/features/send-message'
import { MessageList } from './MessageList'
import styles from './ChatWindow.module.css'

export function ChatWindow() {
  const client = useAuthorizedGreenApiClient()
  const chat = useChatsStore(selectActiveChat)
  const setActivePhone = useChatsStore((state) => state.setActivePhone)

  const messagesQuery = useMessagesQuery(
    client,
    chat ? { phone: chat.phone, chatId: chat.chatId } : null,
  )

  if (!chat) {
    return (
      <section className={`${styles.window} ${styles.hiddenOnMobile}`}>
        <div className={styles.placeholder}>
          Выберите чат слева или создайте новый по номеру телефона.
        </div>
      </section>
    )
  }

  // Имя чата по умолчанию — сам номер, и дублировать его под заголовком незачем.
  const formattedPhone = formatPhone(chat.phone)
  const showPhone = chat.name !== formattedPhone

  return (
    <section className={styles.window}>
      <header className={styles.header}>
        <button
          type="button"
          className={styles.back}
          onClick={() => setActivePhone(null)}
          aria-label="К списку чатов"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
            <path
              d="M12 4L6 10L12 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <Avatar name={chat.name} />
        <div className={styles.headerText}>
          <h2 className={styles.name}>{chat.name}</h2>
          {showPhone ? <span className={styles.phone}>{formattedPhone}</span> : null}
        </div>
      </header>

      <MessageList
        messages={messagesQuery.data ?? []}
        isLoading={messagesQuery.isLoading}
        error={messagesQuery.error}
        onRetry={() => void messagesQuery.refetch()}
      />

      <MessageComposer chat={chat} />
    </section>
  )
}
