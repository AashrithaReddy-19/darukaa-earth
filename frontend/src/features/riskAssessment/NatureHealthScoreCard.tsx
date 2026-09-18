import { useState } from 'react'
import { ChevronDown, Gauge, RefreshCw, TrendingDown, TrendingUp } from 'lucide-react'
import { Card, CardHeader, CardTitle } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { ErrorState } from '../../components/ui/ErrorState'
import { EmptyState } from '../../components/ui/EmptyState'
import { DemoIntelligenceBadge } from '../intelligence/DemoIntelligenceBadge'
import { ScoreGauge } from './ScoreGauge'
import { ScoreBreakdownPanel } from './ScoreBreakdownPanel'
import type { RiskAssessment } from '../../types/riskAssessment'
import { SCORE_BAND_COLORS, SCORE_BAND_LABELS } from '../../utils/intelligenceConstants'
import { formatDateTime } from '../../utils/formatters'

interface NatureHealthScoreCardProps {
  assessment: RiskAssessment | null
  isLoading: boolean
  error: string | null
  notFound: boolean
  isRecalculating: boolean
  onRecalculate: () => void
}

function TrendValue({ label, value }: { label: string; value: number }) {
  const isPositive = value > 0
  const isNegative = value < 0
  return (
    <div className="flex flex-col gap-0.5 rounded-lg border border-charcoal-100 px-3 py-2">
      <span className="text-[11px] font-medium text-charcoal-500">{label}</span>
      <span
        className={
          'flex items-center gap-1 text-sm font-semibold ' +
          (isPositive
            ? 'text-forest-700'
            : isNegative
              ? 'text-terracotta-600'
              : 'text-charcoal-600')
        }
      >
        {isPositive && <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" />}
        {isNegative && <TrendingDown className="h-3.5 w-3.5" aria-hidden="true" />}
        {value > 0 ? '+' : ''}
        {value.toFixed(1)}%
      </span>
    </div>
  )
}

export function NatureHealthScoreCard({
  assessment,
  isLoading,
  error,
  notFound,
  isRecalculating,
  onRecalculate,
}: NatureHealthScoreCardProps) {
  const [isBreakdownOpen, setIsBreakdownOpen] = useState(false)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2.5">
          <CardTitle>Nature Health Score</CardTitle>
          <DemoIntelligenceBadge />
        </div>
        <Button
          variant="outline"
          size="sm"
          isLoading={isRecalculating}
          leftIcon={<RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />}
          onClick={onRecalculate}
        >
          Recalculate
        </Button>
      </CardHeader>

      {isLoading ? (
        <LoadingSpinner label="Loading Nature Health Score…" />
      ) : error ? (
        <ErrorState message={error} />
      ) : notFound || !assessment ? (
        <EmptyState
          icon={Gauge}
          title="No score calculated yet"
          description="Recalculate to generate a Nature Health Score from this site's stored analytics."
          action={
            <Button
              isLoading={isRecalculating}
              leftIcon={<RefreshCw className="h-4 w-4" aria-hidden="true" />}
              onClick={onRecalculate}
            >
              Calculate now
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col gap-5">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
            <ScoreGauge score={assessment.nature_health_score} band={assessment.score_band} />
            <div className="flex flex-1 flex-col gap-2">
              <Badge
                bg={SCORE_BAND_COLORS[assessment.score_band].bg}
                text={SCORE_BAND_COLORS[assessment.score_band].text}
                dot={SCORE_BAND_COLORS[assessment.score_band].dot}
                className="w-fit"
              >
                {SCORE_BAND_LABELS[assessment.score_band]}
              </Badge>
              <p className="text-xs text-charcoal-500">
                Last calculated {formatDateTime(assessment.calculated_at)}
              </p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <TrendValue label="Carbon trend" value={assessment.carbon_trend} />
                <TrendValue label="Biodiversity trend" value={assessment.biodiversity_trend} />
                <TrendValue label="Vegetation trend" value={assessment.vegetation_trend} />
                <TrendValue label="Soil moisture trend" value={assessment.soil_moisture_trend} />
              </div>
            </div>
          </div>

          <div className="border-t border-charcoal-100 pt-4">
            <button
              type="button"
              onClick={() => setIsBreakdownOpen((open) => !open)}
              aria-expanded={isBreakdownOpen}
              className="flex w-full items-center justify-between text-left text-sm font-semibold text-charcoal-800"
            >
              Why this score?
              <ChevronDown
                className={
                  'h-4 w-4 text-charcoal-400 transition-transform ' +
                  (isBreakdownOpen ? 'rotate-180' : '')
                }
                aria-hidden="true"
              />
            </button>
            {isBreakdownOpen && (
              <div className="mt-3">
                <ScoreBreakdownPanel
                  components={assessment.components}
                  weights={assessment.weights}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </Card>
  )
}
