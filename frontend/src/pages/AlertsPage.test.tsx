import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AlertsPage } from './AlertsPage'
import { ToastProvider } from '../components/system/ToastContext'
import { listAlerts } from '../api/alerts'
import { getDashboardMapSites } from '../api/dashboard'
import * as useAuthModule from '../hooks/useAuth'
import type { Alert } from '../types/alert'

vi.mock('../api/alerts')
vi.mock('../api/dashboard')

vi.spyOn(useAuthModule, 'useAuth').mockReturnValue({
  user: {
    id: 'user-1',
    full_name: 'Test User',
    email: 'test@example.com',
    is_active: true,
    created_at: '2025-01-01T00:00:00Z',
  },
  isAuthenticated: true,
  isLoading: false,
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
})

function makeAlert(overrides: Partial<Alert>): Alert {
  return {
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
    ...overrides,
  }
}

const highAlert = makeAlert({ id: 'alert-high', severity: 'high', title: 'High alert' })
const criticalAlert = makeAlert({
  id: 'alert-critical',
  severity: 'critical',
  title: 'Critical alert',
})

function renderPage() {
  return render(
    <MemoryRouter>
      <ToastProvider>
        <AlertsPage />
      </ToastProvider>
    </MemoryRouter>,
  )
}

describe('AlertsPage filtering', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('loads all alerts with no filters applied on mount', async () => {
    vi.mocked(getDashboardMapSites).mockResolvedValue({ items: [] })
    vi.mocked(listAlerts).mockResolvedValue({ items: [highAlert, criticalAlert], total: 2 })

    renderPage()

    await waitFor(() => {
      expect(listAlerts).toHaveBeenCalledWith({ severity: undefined, status: undefined })
    })
    expect(await screen.findByText('High alert')).toBeInTheDocument()
    expect(screen.getByText('Critical alert')).toBeInTheDocument()
  })

  it('re-fetches with the selected severity and renders only the matching alerts', async () => {
    vi.mocked(getDashboardMapSites).mockResolvedValue({ items: [] })
    vi.mocked(listAlerts).mockImplementation(({ severity } = {}) => {
      const items = severity ? [criticalAlert] : [highAlert, criticalAlert]
      return Promise.resolve({ items, total: items.length })
    })
    const user = userEvent.setup()

    renderPage()
    await screen.findByText('High alert')

    await user.selectOptions(screen.getByLabelText(/severity/i), 'critical')

    await waitFor(() => {
      expect(listAlerts).toHaveBeenCalledWith({ severity: 'critical', status: undefined })
    })
    expect(screen.queryByText('High alert')).not.toBeInTheDocument()
    expect(screen.getByText('Critical alert')).toBeInTheDocument()
  })

  it('re-fetches with the selected status filter', async () => {
    vi.mocked(getDashboardMapSites).mockResolvedValue({ items: [] })
    vi.mocked(listAlerts).mockResolvedValue({ items: [highAlert], total: 1 })
    const user = userEvent.setup()

    renderPage()
    await screen.findByText('High alert')

    await user.selectOptions(screen.getByLabelText(/^status$/i), 'resolved')

    await waitFor(() => {
      expect(listAlerts).toHaveBeenCalledWith({ severity: undefined, status: 'resolved' })
    })
  })

  it('shows an empty state when no alerts match the filters', async () => {
    vi.mocked(getDashboardMapSites).mockResolvedValue({ items: [] })
    vi.mocked(listAlerts).mockResolvedValue({ items: [], total: 0 })

    renderPage()

    expect(await screen.findByText(/no alerts/i)).toBeInTheDocument()
  })
})
