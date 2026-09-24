import { useState } from 'react'
import type { FormEvent } from 'react'
import { toErrorMessage } from '@/shared/api/green-api'
import { DEFAULT_API_URL } from '@/shared/config/env'
import { isValidApiUrl, normalizeApiUrl } from '@/shared/lib/api-url'
import { Button } from '@/shared/ui/Button'
import { TextField } from '@/shared/ui/TextField'
import { useLogin } from '../../model/use-login'
import styles from './LoginForm.module.css'

interface FormErrors {
  idInstance?: string
  apiTokenInstance?: string
  apiUrl?: string
}

function validate(
  idInstance: string,
  apiTokenInstance: string,
  apiUrl: string,
): FormErrors {
  const errors: FormErrors = {}

  if (!idInstance.trim()) errors.idInstance = 'Укажите idInstance'
  else if (!/^\d+$/.test(idInstance.trim()))
    errors.idInstance = 'idInstance состоит только из цифр'

  if (!apiTokenInstance.trim()) errors.apiTokenInstance = 'Укажите apiTokenInstance'

  if (!apiUrl.trim()) errors.apiUrl = 'Укажите apiUrl'
  else if (!isValidApiUrl(apiUrl))
    errors.apiUrl = 'Адрес должен быть полным, например https://api.green-api.com'

  return errors
}

export function LoginForm() {
  const [idInstance, setIdInstance] = useState('')
  const [apiTokenInstance, setApiTokenInstance] = useState('')
  const [apiUrl, setApiUrl] = useState(DEFAULT_API_URL)
  const [errors, setErrors] = useState<FormErrors>({})
  const login = useLogin()

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const nextErrors = validate(idInstance, apiTokenInstance, apiUrl)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) return

    login.mutate({
      idInstance: idInstance.trim(),
      apiTokenInstance: apiTokenInstance.trim(),
      apiUrl: normalizeApiUrl(apiUrl),
    })
  }

  return (
    <div className={styles.screen}>
      <div className={styles.card}>
        <div>
          <h1 className={styles.title}>MAX Chat</h1>
          <p className={styles.subtitle}>
            Войдите с учётными данными инстанса GREEN-API — их можно взять в
            личном кабинете.
          </p>
        </div>

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <TextField
            label="idInstance"
            value={idInstance}
            onChange={(event) => setIdInstance(event.target.value)}
            error={errors.idInstance}
            autoComplete="off"
            inputMode="numeric"
            placeholder="1101000001"
          />
          <TextField
            label="apiTokenInstance"
            value={apiTokenInstance}
            onChange={(event) => setApiTokenInstance(event.target.value)}
            error={errors.apiTokenInstance}
            autoComplete="off"
            type="password"
            placeholder="d75b3a66374942c5b3c019c698abc2067e151558acbd412345"
          />
          <TextField
            label="apiUrl"
            value={apiUrl}
            onChange={(event) => setApiUrl(event.target.value)}
            error={errors.apiUrl}
            autoComplete="off"
            inputMode="url"
            placeholder={DEFAULT_API_URL}
          />

          {login.isError ? (
            <p className={styles.error} role="alert">
              {toErrorMessage(login.error)}
            </p>
          ) : null}

          <Button type="submit" fullWidth loading={login.isPending}>
            Войти
          </Button>
        </form>
      </div>
    </div>
  )
}
