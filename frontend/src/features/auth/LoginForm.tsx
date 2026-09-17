import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { LogIn } from 'lucide-react'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../components/system/ToastContext'
import { getErrorMessage } from '../../utils/errors'
import { loginSchema, type LoginFormValues } from './schemas'
import axios from 'axios'

export function LoginForm() {
  const { login } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const [formError, setFormError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) })

  const onSubmit = async (values: LoginFormValues) => {
    setFormError(null)
    try {
      await login(values)
      showToast({
        variant: 'success',
        title: 'Welcome back',
        description: 'You are now signed in.',
      })
      const state = location.state as { from?: { pathname?: string } } | null
      const redirectTo = state?.from?.pathname ?? '/dashboard'
      navigate(redirectTo, { replace: true })
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        setFormError('Invalid email or password. Please try again.')
      } else {
        setFormError(getErrorMessage(error))
      }
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
      {formError && (
        <div
          role="alert"
          className="rounded-lg border border-terracotta-200 bg-terracotta-50 px-3 py-2 text-sm text-terracotta-700"
        >
          {formError}
        </div>
      )}
      <Input
        label="Email"
        type="email"
        autoComplete="email"
        error={errors.email?.message}
        {...register('email')}
      />
      <Input
        label="Password"
        type="password"
        autoComplete="current-password"
        error={errors.password?.message}
        {...register('password')}
      />
      <Button
        type="submit"
        isLoading={isSubmitting}
        leftIcon={<LogIn className="h-4 w-4" aria-hidden="true" />}
        className="mt-2"
      >
        Sign in
      </Button>
      <p className="text-center text-sm text-charcoal-500">
        Don&apos;t have an account?{' '}
        <Link to="/register" className="font-medium text-forest-700 hover:underline">
          Create one
        </Link>
      </p>
    </form>
  )
}
