import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ActionCard } from './ActionCard'
import { ToastProvider } from '../../components/system/ToastContext'
import { patchAction } from '../../api/actions'
import type { ConservationAction } from '../../types/action'

vi.mock('../../api/actions')

const mockAction: ConservationAction = {
  id: 'action-1',
  site_id: 'site-1',
  site_name: 'Sundarbans Plot A',
  project_id: 'project-1',
  project_name: 'Sundarbans Restoration',
  alert_id: null,
  title: 'Inspect boundary fencing',
  description: 'Check for illegal encroachment near the northern boundary.',
  action_category: 'Field Survey',
  priority: 'high',
  status: 'planned',
  due_date: '2025-07-01',
  created_at: '2025-06-01T00:00:00Z',
  updated_at: '2025-06-01T00:00:00Z',
}

function renderActionCard(action: ConservationAction, onUpdated = vi.fn()) {
  return render(
    <MemoryRouter>
      <ToastProvider>
        <ActionCard action={action} onUpdated={onUpdated} />
      </ToastProvider>
    </MemoryRouter>,
  )
}

describe('ActionCard status update', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls PATCH /actions/{id} with the new status when changed', async () => {
    vi.mocked(patchAction).mockResolvedValue({ ...mockAction, status: 'in_progress' })
    const onUpdated = vi.fn()
    const user = userEvent.setup()

    renderActionCard(mockAction, onUpdated)

    await user.selectOptions(screen.getByLabelText(/status/i), 'in_progress')

    await waitFor(() => {
      expect(patchAction).toHaveBeenCalledWith('action-1', { status: 'in_progress' })
    })
    expect(await screen.findByText(/action status updated/i)).toBeInTheDocument()
    expect(onUpdated).toHaveBeenCalledWith({ ...mockAction, status: 'in_progress' })
  })

  it('shows an error toast when the status update fails', async () => {
    vi.mocked(patchAction).mockRejectedValue(new Error('Server error'))
    const user = userEvent.setup()

    renderActionCard(mockAction)

    await user.selectOptions(screen.getByLabelText(/status/i), 'completed')

    expect(await screen.findByText(/could not update action status/i)).toBeInTheDocument()
  })

  it('does not call PATCH when the selected status is unchanged', async () => {
    const user = userEvent.setup()
    renderActionCard(mockAction)

    await user.selectOptions(screen.getByLabelText(/status/i), 'planned')

    expect(patchAction).not.toHaveBeenCalled()
  })
})
