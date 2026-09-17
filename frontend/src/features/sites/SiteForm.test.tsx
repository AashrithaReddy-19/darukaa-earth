import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { SiteForm } from './SiteForm'
import { BOUNDARY_REQUIRED_MESSAGE } from './schemas'
import type { Site } from '../../types/site'

const validSite: Site = {
  id: 'site-1',
  project_id: 'project-1',
  name: 'Sundarbans Plot A',
  site_code: 'SND-001',
  ecosystem_type: 'mangrove',
  monitoring_status: 'active',
  notes: null,
  boundary: {
    type: 'Polygon',
    coordinates: [
      [
        [88.1, 21.9],
        [88.2, 21.9],
        [88.2, 22.0],
        [88.1, 22.0],
        [88.1, 21.9],
      ],
    ],
  },
  area_hectares: 128.4,
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
  latest_snapshot: null,
}

async function fillRequiredTextFields(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/site name/i), 'Sundarbans Plot A')
  await user.type(screen.getByLabelText(/site code/i), 'SND-001')
}

describe('SiteForm boundary validation', () => {
  it('shows the "draw a boundary" error when no geometry has been set', async () => {
    const onSubmit = vi.fn()
    const onSuccess = vi.fn()
    const user = userEvent.setup()

    render(<SiteForm onSubmit={onSubmit} onSuccess={onSuccess} submitLabel="Create site" />)

    await fillRequiredTextFields(user)
    await user.click(screen.getByRole('button', { name: /create site/i }))

    expect(await screen.findByText(BOUNDARY_REQUIRED_MESSAGE)).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('does not show the boundary error and submits when a geometry is already set', async () => {
    const onSubmit = vi.fn().mockResolvedValue(validSite)
    const onSuccess = vi.fn()
    const user = userEvent.setup()

    render(
      <SiteForm
        onSubmit={onSubmit}
        onSuccess={onSuccess}
        submitLabel="Create site"
        defaultValues={{
          name: validSite.name,
          site_code: validSite.site_code,
          ecosystem_type: validSite.ecosystem_type,
          monitoring_status: validSite.monitoring_status,
          notes: '',
          boundary: validSite.boundary,
        }}
      />,
    )

    await user.click(screen.getByRole('button', { name: /create site/i }))

    expect(screen.queryByText(BOUNDARY_REQUIRED_MESSAGE)).not.toBeInTheDocument()
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
    expect(onSubmit.mock.calls[0][0]).toMatchObject({ boundary: validSite.boundary })
  })
})
