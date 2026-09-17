import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ProjectForm } from './ProjectForm'

describe('ProjectForm validation', () => {
  it('shows required-field errors when submitted empty', async () => {
    const onSubmit = vi.fn()
    const onSuccess = vi.fn()
    const user = userEvent.setup()

    render(<ProjectForm onSubmit={onSubmit} onSuccess={onSuccess} submitLabel="Create project" />)

    await user.click(screen.getByRole('button', { name: /create project/i }))

    expect(await screen.findByText(/project name is required/i)).toBeInTheDocument()
    expect(screen.getByText(/description is required/i)).toBeInTheDocument()
    expect(screen.getByText(/country is required/i)).toBeInTheDocument()
    expect(screen.getByText(/region is required/i)).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('shows an error when end date is before start date', async () => {
    const onSubmit = vi.fn()
    const onSuccess = vi.fn()
    const user = userEvent.setup()

    render(<ProjectForm onSubmit={onSubmit} onSuccess={onSuccess} submitLabel="Create project" />)

    await user.type(screen.getByLabelText(/project name/i), 'Mangrove Bay')
    await user.type(screen.getByLabelText(/description/i), 'A coastal restoration project.')
    await user.type(screen.getByLabelText(/country/i), 'India')
    await user.type(screen.getByLabelText(/region/i), 'Sundarbans')
    await user.type(screen.getByLabelText(/start date/i), '2025-06-01')
    await user.type(screen.getByLabelText(/end date/i), '2025-01-01')

    await user.click(screen.getByRole('button', { name: /create project/i }))

    expect(
      await screen.findByText(/end date must be on or after the start date/i),
    ).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })
})
