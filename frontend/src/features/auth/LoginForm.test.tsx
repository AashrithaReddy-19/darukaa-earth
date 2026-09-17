import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { LoginForm } from './LoginForm'
import * as useAuthModule from '../../hooks/useAuth'
import { ToastProvider } from '../../components/system/ToastContext'

function renderLoginForm() {
  return render(
    <MemoryRouter>
      <ToastProvider>
        <LoginForm />
      </ToastProvider>
    </MemoryRouter>,
  )
}

describe('LoginForm validation', () => {
  it('shows an error for an invalid email', async () => {
    const login = vi.fn().mockResolvedValue(undefined)
    vi.spyOn(useAuthModule, 'useAuth').mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      login,
      register: vi.fn(),
      logout: vi.fn(),
    })
    const user = userEvent.setup()
    renderLoginForm()

    await user.type(screen.getByLabelText(/email/i), 'not-an-email')
    await user.type(screen.getByLabelText(/password/i), 'password123')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    expect(await screen.findByText(/enter a valid email address/i)).toBeInTheDocument()
    expect(login).not.toHaveBeenCalled()
  })

  it('shows an error for a password shorter than 8 characters', async () => {
    const login = vi.fn().mockResolvedValue(undefined)
    vi.spyOn(useAuthModule, 'useAuth').mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      login,
      register: vi.fn(),
      logout: vi.fn(),
    })
    const user = userEvent.setup()
    renderLoginForm()

    await user.type(screen.getByLabelText(/email/i), 'user@example.com')
    await user.type(screen.getByLabelText(/password/i), 'short')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    expect(await screen.findByText(/at least 8 characters/i)).toBeInTheDocument()
    expect(login).not.toHaveBeenCalled()
  })

  it('calls login with valid data', async () => {
    const login = vi.fn().mockResolvedValue(undefined)
    vi.spyOn(useAuthModule, 'useAuth').mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      login,
      register: vi.fn(),
      logout: vi.fn(),
    })
    const user = userEvent.setup()
    renderLoginForm()

    await user.type(screen.getByLabelText(/email/i), 'user@example.com')
    await user.type(screen.getByLabelText(/password/i), 'password123')
    await user.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(login).toHaveBeenCalledWith({ email: 'user@example.com', password: 'password123' })
    })
  })
})
