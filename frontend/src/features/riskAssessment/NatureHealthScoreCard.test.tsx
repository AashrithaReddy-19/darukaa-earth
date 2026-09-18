import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { NatureHealthScoreCard } from './NatureHealthScoreCard'
import type { RiskAssessment } from '../../types/riskAssessment'

const baseAssessment: RiskAssessment = {
  id: 'assessment-1',
  site_id: 'site-1',
  nature_health_score: 0,
  score_band: 'healthy',
  carbon_trend: 5,
  biodiversity_trend: -2,
  vegetation_trend: 3,
  soil_moisture_trend: -1,
  disturbance_risk: 'low',
  calculated_at: '2025-06-01T00:00:00Z',
  components: {
    ecosystem_health: 80,
    biodiversity_trend: 60,
    vegetation_trend: 70,
    carbon_trend: 65,
    soil_moisture: 75,
    disturbance_risk: 100,
    species_trend: 55,
  },
  weights: {
    ecosystem_health: 0.25,
    biodiversity_trend: 0.2,
    vegetation_trend: 0.15,
    carbon_trend: 0.15,
    soil_moisture: 0.1,
    disturbance_risk: 0.1,
    species_trend: 0.05,
  },
}

function renderCard(assessment: RiskAssessment) {
  return render(
    <NatureHealthScoreCard
      assessment={assessment}
      isLoading={false}
      error={null}
      notFound={false}
      isRecalculating={false}
      onRecalculate={vi.fn()}
    />,
  )
}

describe('NatureHealthScoreCard', () => {
  it('renders the "Healthy" band label and score for a healthy assessment', () => {
    renderCard({ ...baseAssessment, nature_health_score: 88, score_band: 'healthy' })

    expect(screen.getByText('Healthy')).toBeInTheDocument()
    expect(screen.getByText('88')).toBeInTheDocument()
  })

  it('renders the "Critical" band label and score for a critical assessment', () => {
    renderCard({ ...baseAssessment, nature_health_score: 32, score_band: 'critical' })

    expect(screen.getByText('Critical')).toBeInTheDocument()
    expect(screen.getByText('32')).toBeInTheDocument()
  })

  it('renders the "At Risk" band label for an at_risk assessment', () => {
    renderCard({ ...baseAssessment, nature_health_score: 50, score_band: 'at_risk' })

    expect(screen.getByText('At Risk')).toBeInTheDocument()
  })

  it('shows an empty state with a calculate action when no assessment exists yet', () => {
    render(
      <NatureHealthScoreCard
        assessment={null}
        isLoading={false}
        error={null}
        notFound
        isRecalculating={false}
        onRecalculate={vi.fn()}
      />,
    )

    expect(screen.getByText(/no score calculated yet/i)).toBeInTheDocument()
  })
})
