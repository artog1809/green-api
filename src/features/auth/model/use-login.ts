import { useMutation } from '@tanstack/react-query'
import { createGreenApiClient } from '@/shared/api/green-api'
import type { GreenApiCredentials, InstanceState } from '@/shared/api/green-api'
import { useSessionStore } from '@/entities/session'

const STATE_PROBLEM: Partial<Record<InstanceState, string>> = {
  notAuthorized: 'Инстанс не авторизован. Привяжите аккаунт в кабинете GREEN-API.',
  blocked: 'Инстанс заблокирован.',
  sleepMode: 'Инстанс в спящем режиме. Разбудите его в кабинете GREEN-API.',
  starting: 'Инстанс запускается, попробуйте через минуту.',
  yellowCard: 'Инстанс ограничен сервисом (yellow card).',
}

/**
 * Проверяет учётные данные реальным запросом к инстансу: без этого
 * ошибка в токене всплыла бы только при первой отправке сообщения.
 */
export function useLogin() {
  const signIn = useSessionStore((state) => state.signIn)

  return useMutation({
    mutationFn: async (credentials: GreenApiCredentials) => {
      const client = createGreenApiClient(credentials)
      const { stateInstance } = await client.getStateInstance()

      const problem = STATE_PROBLEM[stateInstance]
      // Состояние инстанса — не ошибка запроса: показываем его текст как есть.
      if (problem) throw new Error(problem)

      return credentials
    },
    onSuccess: signIn,
  })
}
