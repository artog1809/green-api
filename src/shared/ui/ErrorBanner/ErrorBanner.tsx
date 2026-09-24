import styles from './ErrorBanner.module.css'

interface ErrorBannerProps {
  message: string
  actionLabel?: string
  onAction?: () => void
  isActionPending?: boolean
}

export function ErrorBanner({
  message,
  actionLabel = 'Повторить',
  onAction,
  isActionPending = false,
}: ErrorBannerProps) {
  return (
    <div className={styles.banner} role="alert">
      <span>{message}</span>
      {onAction ? (
        <button
          type="button"
          className={styles.retry}
          onClick={onAction}
          disabled={isActionPending}
        >
          {isActionPending ? 'Сохраняем…' : actionLabel}
        </button>
      ) : null}
    </div>
  )
}
