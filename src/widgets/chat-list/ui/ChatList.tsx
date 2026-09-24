import { ChatListItem, useChatsStore } from '@/entities/chat'
import { useSessionStore } from '@/entities/session'
import { LogoutButton } from '@/features/auth'
import { NewChatForm } from '@/features/open-chat'
import styles from './ChatList.module.css'

export function ChatList() {
  const chats = useChatsStore((state) => state.chats)
  const activePhone = useChatsStore((state) => state.activePhone)
  const setActivePhone = useChatsStore((state) => state.setActivePhone)
  const idInstance = useSessionStore((state) => state.credentials?.idInstance)

  return (
    <aside
      className={`${styles.sidebar} ${activePhone ? styles.hiddenOnMobile : ''}`}
    >
      <div className={styles.account}>
        <span className={styles.instance} title={`idInstance ${idInstance ?? ''}`}>
          Инстанс {idInstance}
        </span>
        <LogoutButton />
      </div>

      <header className={styles.header}>
        <h1 className={styles.title}>Чаты</h1>
      </header>

      <NewChatForm />

      <div className={styles.list}>
        {chats.length === 0 ? (
          <p className={styles.empty}>
            Введите номер телефона получателя, чтобы начать переписку.
          </p>
        ) : (
          chats.map((chat) => (
            <ChatListItem
              key={chat.phone}
              chat={chat}
              isActive={chat.phone === activePhone}
              onSelect={setActivePhone}
            />
          ))
        )}
      </div>
    </aside>
  )
}
