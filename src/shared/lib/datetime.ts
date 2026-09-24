const timeFormatter = new Intl.DateTimeFormat('ru-RU', {
  hour: '2-digit',
  minute: '2-digit',
})

const dateFormatter = new Intl.DateTimeFormat('ru-RU', {
  day: 'numeric',
  month: 'long',
})

/** GREEN-API отдаёт время в секундах, Date ожидает миллисекунды. */
export function fromUnixSeconds(timestamp: number): Date {
  return new Date(timestamp * 1000)
}

export function formatTime(timestamp: number): string {
  return timeFormatter.format(fromUnixSeconds(timestamp))
}

export function formatDayLabel(timestamp: number): string {
  const date = fromUnixSeconds(timestamp)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)

  if (isSameDay(date, today)) return 'Сегодня'
  if (isSameDay(date, yesterday)) return 'Вчера'
  return dateFormatter.format(date)
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

export function nowInSeconds(): number {
  return Math.floor(Date.now() / 1000)
}
