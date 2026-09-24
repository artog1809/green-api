import type { MessageStatus } from '../../model/types'

const STATUS_LABEL: Record<MessageStatus, string> = {
  sending: 'Отправляется',
  sent: 'Отправлено',
  delivered: 'Доставлено',
  read: 'Прочитано',
  failed: 'Не отправлено',
}

const STROKE = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const

interface MessageStatusIconProps {
  status: MessageStatus
}

/**
 * Иконки статуса рисуются как SVG, а не символами «✓✓»: два текстовых
 * глифа встают через пробел и не складываются в двойную галочку.
 */
export function MessageStatusIcon({ status }: MessageStatusIconProps) {
  const label = STATUS_LABEL[status]

  if (status === 'sending') {
    return (
      <svg width="13" height="13" viewBox="0 0 12 12" role="img" aria-label={label}>
        <circle cx="6" cy="6" r="4.8" {...STROKE} />
        <path d="M6 3.2V6.2L8 7.4" {...STROKE} />
      </svg>
    )
  }

  if (status === 'failed') {
    return (
      <svg width="13" height="13" viewBox="0 0 12 12" role="img" aria-label={label}>
        <circle cx="6" cy="6" r="4.8" {...STROKE} />
        <path d="M6 3.4V6.6" {...STROKE} />
        <path d="M6 8.5V8.6" {...STROKE} />
      </svg>
    )
  }

  if (status === 'sent') {
    return (
      <svg width="12" height="11" viewBox="0 0 12 11" role="img" aria-label={label}>
        <path d="M1 6L4.4 9.4L11 1.6" {...STROKE} />
      </svg>
    )
  }

  // delivered и read различаются цветом, который задаёт родитель.
  return (
    <svg width="16" height="11" viewBox="0 0 16 11" role="img" aria-label={label}>
      <path d="M1 6L4.4 9.4L11 1.6" {...STROKE} />
      <path d="M8 9.4L15 1.6" {...STROKE} />
    </svg>
  )
}
