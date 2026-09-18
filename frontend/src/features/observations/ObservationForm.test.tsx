import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ObservationForm } from './ObservationForm'
import type { FieldObservation } from '../../types/observation'

const createdObservation: FieldObservation = {
  id: 'obs-1',
  site_id: 'site-1',
  observer_name: 'Aashritha',
  observation_type: 'Species',
  notes: 'Spotted a heron near the water edge.',
  latitude: 21.95,
  longitude: 88.15,
  observation_date: '2025-06-01',
  created_at: '2025-06-01T00:00:00Z',
}

describe('ObservationForm validation', () => {
  it('shows required-field errors and does not submit when the form is empty', async () => {
    const onSubmit = vi.fn()
    const onSuccess = vi.fn()
    const user = userEvent.setup()

    render(<ObservationForm onSubmit={onSubmit} onSuccess={onSuccess} />)

    await user.click(screen.getByRole('button', { name: /add observation/i }))

    expect(await screen.findByText(/observer name is required/i)).toBeInTheDocument()
    expect(await screen.findByText(/notes are required/i)).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
    expect(onSuccess).not.toHaveBeenCalled()
  })

  it('rejects an out-of-range latitude', async () => {
    const onSubmit = vi.fn()
    const onSuccess = vi.fn()
    const user = userEvent.setup()

    render(<ObservationForm onSubmit={onSubmit} onSuccess={onSuccess} />)

    await user.type(screen.getByLabelText(/observer name/i), 'Aashritha')
    await user.type(screen.getByLabelText(/notes/i), 'Spotted a heron.')
    await user.type(screen.getByLabelText(/latitude/i), '200')
    await user.click(screen.getByRole('button', { name: /add observation/i }))

    expect(await screen.findByText(/latitude must be between -90 and 90/i)).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('submits successfully once all required fields are valid', async () => {
    const onSubmit = vi.fn().mockResolvedValue(createdObservation)
    const onSuccess = vi.fn()
    const user = userEvent.setup()

    render(<ObservationForm onSubmit={onSubmit} onSuccess={onSuccess} />)

    await user.type(screen.getByLabelText(/observer name/i), 'Aashritha')
    await user.type(screen.getByLabelText(/notes/i), 'Spotted a heron near the water edge.')
    await user.click(screen.getByRole('button', { name: /add observation/i }))

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        observer_name: 'Aashritha',
        notes: 'Spotted a heron near the water edge.',
        observation_type: 'Species',
        latitude: null,
        longitude: null,
      }),
    )
  })
})
