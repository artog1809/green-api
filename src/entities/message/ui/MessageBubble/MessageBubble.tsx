import { formatTime } from '@/shared/lib/datetime'
import type { Message } from '../../model/types'
import { MessageStatusIcon } from '../MessageStatusIcon'
import styles from './MessageBubble.module.css'

interface MessageBubbleProps {
  message: Message
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isOutgoing = message.direction === 'outgoing'

  return (
    <div className={`${styles.row} ${isOutgoing ? styles.outgoing : styles.incoming}`}>
      <div className={styles.bubble}>
        <span className={styles.text}>{message.text}</span>
        <span className={styles.meta}>
          <time dateTime={new Date(message.timestamp * 1000).toISOString()}>
            {formatTime(message.timestamp)}
          </time>
          {isOutgoing ? (
            <span
              className={
                message.status === 'failed'
                  ? styles.failed
                  : message.status === 'read'
                    ? styles.read
                    : styles.status
              }
            >
              <MessageStatusIcon status={message.status} />
            </span>
          ) : null}
        </span>
      </div>
    </div>
  )
}
