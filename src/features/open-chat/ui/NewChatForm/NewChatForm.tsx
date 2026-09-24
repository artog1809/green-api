import { useState } from 'react'
import type { FormEvent } from 'react'
import { isValidPhone } from '@/shared/lib/phone'
import { useChatsStore } from '@/entities/chat'
import styles from './NewChatForm.module.css'

/** Ввод номера получателя: открывает чат или переключает на другого собеседника. */
export function NewChatForm() {
  const [phone, setPhone] = useState('')
  const [error, setError] = useState<string | null>(null)
  const openChat = useChatsStore((state) => state.openChat)

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!isValidPhone(phone)) {
      setError('Введите номер в международном формате, например +7 999 123-45-67')
      return
    }

    openChat(phone)
    setPhone('')
    setError(null)
  }

  return (
    <>
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <input
          className={`${styles.input} ${error ? styles.invalid : ''}`}
          value={phone}
          onChange={(event) => {
            setPhone(event.target.value)
            if (error) setError(null)
          }}
          placeholder="Номер телефона"
          aria-label="Номер телефона получателя"
          aria-invalid={error ? true : undefined}
          inputMode="tel"
          autoComplete="tel"
        />
        <button className={styles.submit} type="submit" aria-label="Создать чат">
          +
        </button>
      </form>
      {error ? (
        <p className={styles.error} role="alert">
          {error}
        </p>
      ) : null}
    </>
  )
}
