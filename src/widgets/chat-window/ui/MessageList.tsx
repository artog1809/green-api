import { Fragment, useEffect, useRef } from 'react'
import { toErrorMessage } from '@/shared/api/green-api'
import { formatDayLabel, fromUnixSeconds, isSameDay } from '@/shared/lib/datetime'
import { ErrorBanner } from '@/shared/ui/ErrorBanner'
import { Spinner } from '@/shared/ui/Spinner'
import { MessageBubble } from '@/entities/message'
import type { Message } from '@/entities/message'
import styles from './MessageList.module.css'

interface MessageListProps {
  messages: Message[]
  isLoading: boolean
  error: unknown
  onRetry: () => void
}

function startsNewDay(message: Message, previous: Message | undefined): boolean {
  if (!previous) return true
  return !isSameDay(
    fromUnixSeconds(message.timestamp),
    fromUnixSeconds(previous.timestamp),
  )
}

export function MessageList({
  messages,
  isLoading,
  error,
  onRetry,
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' })
  }, [messages.length])

  if (isLoading) {
    return (
      <div className={styles.list}>
        <div className={styles.state}>
          <Spinner />
        </div>
      </div>
    )
  }

  return (
    <div className={styles.list}>
      {error ? (
        <ErrorBanner message={toErrorMessage(error)} onAction={onRetry} />
      ) : null}

      {messages.length === 0 && !error ? (
        <p className={styles.state}>
          Сообщений пока нет. Напишите первое — оно уйдёт в MAX.
        </p>
      ) : null}

      {messages.map((message, index) => (
        <Fragment key={message.id}>
          {startsNewDay(message, messages[index - 1]) ? (
            <span className={styles.day}>{formatDayLabel(message.timestamp)}</span>
          ) : null}
          <MessageBubble message={message} />
        </Fragment>
      ))}

      <div ref={bottomRef} />
    </div>
  )
}
