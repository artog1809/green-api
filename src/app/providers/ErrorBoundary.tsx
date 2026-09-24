import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'
import { Button } from '@/shared/ui/Button'
import styles from './ErrorBoundary.module.css'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  error: Error | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('Необработанная ошибка интерфейса', error, info)
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children

    return (
      <div className={styles.fallback}>
        <h1>Что-то пошло не так</h1>
        <p>{error.message}</p>
        <Button onClick={() => window.location.reload()}>Перезагрузить</Button>
      </div>
    )
  }
}
