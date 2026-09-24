/** Убирает пробелы и хвостовые слэши: адрес склеивается с путём вручную. */
export function normalizeApiUrl(value: string): string {
  return value.trim().replace(/\/+$/, '')
}

/**
 * Адрес API должен быть абсолютным: запросы уходят на другой домен, и
 * относительный путь превратил бы их в обращения к самому сайту.
 */
export function isValidApiUrl(value: string): boolean {
  const normalized = normalizeApiUrl(value)
  if (!normalized) return false

  try {
    const url = new URL(normalized)
    return (url.protocol === 'https:' || url.protocol === 'http:') && url.host !== ''
  } catch {
    return false
  }
}
