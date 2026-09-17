import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from 'react-router-dom'
import { UserPlus } from 'lucide-react'
import axios from 'axios'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../components/system/ToastContext'
import { getErrorMessage } from '../../utils/errors'
import { registerSchema, type RegisterFormValues } from './schemas'

export function RegisterForm() {
  const { register: registerUser } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const [formError, setFormError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({ resolver: zodResolver(registerSchema) })

  const onSubmit = async (values: RegisterFormValues) => {
    setFormError(null)
    try {
      await registerUser({
        full_name: values.full_name,
        email: values.email,
        password: values.password,
      })
      showToast({
        variant: 'success',
        title: 'Account created',
        description: `Welcome to Darukaa.Earth, ${values.full_name}.`,
      })
      navigate('/dashboard', { replace: true })
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 409) {
        setFormError('An account with this email already exists. Try signing in instead.')
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
        label="Full name"
        autoComplete="name"
        error={errors.full_name?.message}
        {...register('full_name')}
      />
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
        autoComplete="new-password"
        hint="At least 8 characters"
        error={errors.password?.message}
        {...register('password')}
      />
      <Input
        label="Confirm password"
        type="password"
        autoComplete="new-password"
        error={errors.confirmPassword?.message}
        {...register('confirmPassword')}
      />
      <Button
        type="submit"
        isLoading={isSubmitting}
        leftIcon={<UserPlus className="h-4 w-4" aria-hidden="true" />}
        className="mt-2"
      >
        Create account
      </Button>
      <p className="text-center text-sm text-charcoal-500">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-forest-700 hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  )
}
