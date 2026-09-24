import { formatTime } from '@/shared/lib/datetime'
import { Avatar } from '@/shared/ui/Avatar'
import type { Chat } from '../../model/types'
import styles from './ChatListItem.module.css'

interface ChatListItemProps {
  chat: Chat
  isActive: boolean
  onSelect: (phone: string) => void
}

export function ChatListItem({ chat, isActive, onSelect }: ChatListItemProps) {
  return (
    <button
      type="button"
      className={`${styles.item} ${isActive ? styles.active : ''}`}
      onClick={() => onSelect(chat.phone)}
      aria-current={isActive ? 'true' : undefined}
    >
      <Avatar name={chat.name} />
      <span className={styles.body}>
        <span className={styles.top}>
          <span className={styles.name}>{chat.name}</span>
          {chat.lastMessageAt ? (
            <span className={styles.time}>{formatTime(chat.lastMessageAt)}</span>
          ) : null}
        </span>
        <span className={styles.bottom}>
          <span className={styles.preview}>
            {chat.lastMessageText ?? 'Нет сообщений'}
          </span>
          {chat.unreadCount > 0 ? (
            <span
              className={styles.unread}
              aria-label={`Непрочитанных сообщений: ${chat.unreadCount}`}
            >
              {chat.unreadCount}
            </span>
          ) : null}
        </span>
      </span>
    </button>
  )
}
