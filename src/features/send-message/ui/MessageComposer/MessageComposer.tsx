import { useRef, useState } from 'react'
import type { FormEvent, KeyboardEvent } from 'react'
import { Button } from '@/shared/ui/Button'
import { ErrorBanner } from '@/shared/ui/ErrorBanner'
import type { Chat } from '@/entities/chat'
import { useSendMessage } from '../../model/use-send-message'
import styles from './MessageComposer.module.css'

interface MessageComposerProps {
  chat: Chat
}

export function MessageComposer({ chat }: MessageComposerProps) {
  const [text, setText] = useState('')
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const { send, retry, failure, isSending } = useSendMessage(chat)

  const submit = () => {
    if (!text.trim()) return

    send(text)
    setText('')
    inputRef.current?.focus()
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    submit()
  }

  /** Enter отправляет, Shift+Enter переносит строку — как в web.max.ru. */
  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      submit()
    }
  }

  return (
    <div className={styles.wrapper}>
      {failure ? <ErrorBanner message={failure.message} onAction={retry} /> : null}
      <form className={styles.form} onSubmit={handleSubmit}>
        <textarea
          ref={inputRef}
          className={styles.input}
          value={text}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Напишите сообщение"
          aria-label="Текст сообщения"
          rows={1}
        />
        <Button
          type="submit"
          variant="icon"
          aria-label="Отправить"
          disabled={!text.trim()}
          loading={isSending}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
            <path
              d="M2 9L16 2L11.5 16L9 10.5L2 9Z"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
          </svg>
        </Button>
      </form>
    </div>
  )
}
