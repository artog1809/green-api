import { QueryClient } from '@tanstack/react-query'
import { isFatal } from '@/shared/api/green-api'

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // История чата обновляется уведомлениями, а не повторными запросами.
        refetchOnWindowFocus: false,
        retry: (failureCount, error) => !isFatal(error) && failureCount < 2,
      },
      mutations: { retry: false },
    },
  })
}
