import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AlertCard } from './AlertCard'
import { ToastProvider } from '../../components/system/ToastContext'
import { patchAlert } from '../../api/alerts'
import { getDashboardMapSites } from '../../api/dashboard'
import type { Alert } from '../../types/alert'

vi.mock('../../api/alerts')
vi.mock('../../api/dashboard')

const mockAlert: Alert = {
  id: 'alert-1',
  site_id: 'site-1',
  site_name: 'Sundarbans Plot A',
  project_id: 'project-1',
  project_name: 'Sundarbans Restoration',
  assessment_id: 'assessment-1',
  severity: 'high',
  title: 'High alert: Sundarbans Plot A',
  description: 'Nature Health Score: 58/100.',
  reasons: ['Nature Health Score dropped to 58/100 (at_risk).'],
  recommendation: 'Schedule a field survey.',
  status: 'open',
  reviewer_note: null,
  created_at: '2025-06-01T00:00:00Z',
  updated_at: '2025-06-01T00:00:00Z',
}

function renderAlertCard(alert: Alert, onUpdated = vi.fn()) {
  return render(
    <MemoryRouter>
      <ToastProvider>
        <AlertCard alert={alert} onUpdated={onUpdated} />
      </ToastProvider>
    </MemoryRouter>,
  )
}

describe('AlertCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // CreateActionModal (rendered inside every AlertCard for the "Create action" flow) fetches
    // the site list on mount regardless of whether its modal is open; give every test a default
    // so that fetch never resolves against an un-mocked (undefined-returning) function.
    vi.mocked(getDashboardMapSites).mockResolvedValue({ items: [] })
  })

  it('calls PATCH with status "acknowledged" and shows a success toast', async () => {
    vi.mocked(patchAlert).mockResolvedValue({ ...mockAlert, status: 'acknowledged' })
    const onUpdated = vi.fn()
    const user = userEvent.setup()

    renderAlertCard(mockAlert, onUpdated)

    await user.click(screen.getByRole('button', { name: /acknowledge/i }))

    await waitFor(() => {
      expect(patchAlert).toHaveBeenCalledWith('alert-1', {
        status: 'acknowledged',
        reviewer_note: null,
      })
    })
    expect(await screen.findByText(/alert acknowledged/i)).toBeInTheDocument()
    expect(onUpdated).toHaveBeenCalledWith({ ...mockAlert, status: 'acknowledged' })
  })

  it('calls PATCH with status "resolved" and the trimmed reviewer note', async () => {
    vi.mocked(patchAlert).mockResolvedValue({ ...mockAlert, status: 'resolved' })
    const user = userEvent.setup()

    renderAlertCard(mockAlert)

    await user.type(screen.getByLabelText(/reviewer note/i), '  Checked on site.  ')
    await user.click(screen.getByRole('button', { name: /resolve/i }))

    await waitFor(() => {
      expect(patchAlert).toHaveBeenCalledWith('alert-1', {
        status: 'resolved',
        reviewer_note: 'Checked on site.',
      })
    })
    expect(await screen.findByText(/alert resolved/i)).toBeInTheDocument()
  })

  it('shows an error toast when the PATCH call fails', async () => {
    vi.mocked(patchAlert).mockRejectedValue(new Error('Network down'))
    const user = userEvent.setup()

    renderAlertCard(mockAlert)

    await user.click(screen.getByRole('button', { name: /acknowledge/i }))

    expect(await screen.findByText(/could not update alert/i)).toBeInTheDocument()
  })

  it('disables the Acknowledge button once the alert is no longer open', async () => {
    renderAlertCard({ ...mockAlert, status: 'acknowledged' })

    expect(screen.getByRole('button', { name: /acknowledge/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /resolve/i })).toBeEnabled()
    // Let CreateActionModal's background site-list fetch resolve (and its resulting state
    // update flush) inside `act` before the test tears down, to avoid an act() warning.
    await act(async () => {
      await Promise.resolve()
    })
  })
})
