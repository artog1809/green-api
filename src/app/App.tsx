import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ChatPage } from '@/pages/chat'
import { LoginPage } from '@/pages/login'
import { ErrorBoundary } from './providers/ErrorBoundary'
import { QueryProvider } from './providers/QueryProvider'
import { RequireAuth } from './router/RequireAuth'

export function App() {
  return (
    <ErrorBoundary>
      <QueryProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/"
              element={
                <RequireAuth>
                  <ChatPage />
                </RequireAuth>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </QueryProvider>
    </ErrorBoundary>
  )
}
