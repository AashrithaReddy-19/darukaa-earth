import { Navigate } from 'react-router-dom'
import { AuthLayout } from '../layouts/AuthLayout'
import { RegisterForm } from '../features/auth/RegisterForm'
import { useAuth } from '../hooks/useAuth'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'

export function RegisterPage() {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-forest-950">
        <LoadingSpinner label="Loading…" size="lg" className="text-forest-200" />
      </div>
    )
  }

  if (isAuthenticated) return <Navigate to="/dashboard" replace />

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Start monitoring carbon and biodiversity impact."
    >
      <RegisterForm />
    </AuthLayout>
  )
}
