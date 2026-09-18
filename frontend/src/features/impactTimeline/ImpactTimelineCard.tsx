import { History } from 'lucide-react'
import { Card, CardHeader, CardTitle } from '../../components/ui/Card'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { ErrorState } from '../../components/ui/ErrorState'
import { EmptyState } from '../../components/ui/EmptyState'
import { DemoIntelligenceBadge } from '../intelligence/DemoIntelligenceBadge'
import type { ImpactTimelineResponse } from '../../types/impactTimeline'
import { formatCarbon, formatDate, formatNumber, formatScore } from '../../utils/formatters'

interface ImpactTimelineCardProps {
  timeline: ImpactTimelineResponse | null
  isLoading: boolean
  error: string | null
  onRetry: () => void
}

function DeltaLine({ label, value, unit }: { label: string; value: number; unit: string }) {
  const isPositive = value > 0
  const isNegative = value < 0
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-charcoal-600">{label}</span>
      <span
        className={
          'font-semibold ' +
          (isPositive
            ? 'text-forest-700'
            : isNegative
              ? 'text-terracotta-600'
              : 'text-charcoal-600')
        }
      >
        {value > 0 ? '+' : ''}
        {value.toFixed(1)}
        {unit}
      </span>
    </div>
  )
}

export function ImpactTimelineCard({
  timeline,
  isLoading,
  error,
  onRetry,
}: ImpactTimelineCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2.5">
          <CardTitle>Restoration Impact Timeline</CardTitle>
          <DemoIntelligenceBadge />
        </div>
      </CardHeader>

      {isLoading ? (
        <LoadingSpinner label="Loading impact timeline…" />
      ) : error ? (
        <ErrorState message={error} onRetry={onRetry} />
      ) : !timeline ? (
        <EmptyState
          icon={History}
          title="Not enough data yet"
          description="An impact timeline needs at least one recorded analytics entry for this site."
        />
      ) : (
        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-charcoal-100 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-charcoal-400">
                First recorded — {formatDate(timeline.first.recorded_at)}
              </p>
              <dl className="mt-2 flex flex-col gap-1 text-sm text-charcoal-700">
                <div className="flex justify-between">
                  <dt>Carbon captured</dt>
                  <dd>{formatCarbon(timeline.first.carbon_captured_tco2e)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Biodiversity score</dt>
                  <dd>{formatScore(timeline.first.biodiversity_score)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Vegetation cover</dt>
                  <dd>{timeline.first.vegetation_cover_percent.toFixed(1)}%</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Species count</dt>
                  <dd>{formatNumber(timeline.first.species_count)}</dd>
                </div>
              </dl>
            </div>
            <div className="rounded-lg border border-forest-200 bg-forest-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-forest-700">
                Latest — {formatDate(timeline.latest.recorded_at)}
              </p>
              <dl className="mt-2 flex flex-col gap-1 text-sm text-charcoal-700">
                <div className="flex justify-between">
                  <dt>Carbon captured</dt>
                  <dd>{formatCarbon(timeline.latest.carbon_captured_tco2e)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Biodiversity score</dt>
                  <dd>{formatScore(timeline.latest.biodiversity_score)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Vegetation cover</dt>
                  <dd>{timeline.latest.vegetation_cover_percent.toFixed(1)}%</dd>
                </div>
                <div className="flex justify-between">
                  <dt>Species count</dt>
                  <dd>{formatNumber(timeline.latest.species_count)}</dd>
                </div>
              </dl>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 rounded-lg border border-charcoal-100 p-4 sm:grid-cols-4">
            <DeltaLine label="Carbon" value={timeline.changes.carbon_pct} unit="%" />
            <DeltaLine
              label="Biodiversity"
              value={timeline.changes.biodiversity_points}
              unit=" pts"
            />
            <DeltaLine label="Vegetation" value={timeline.changes.vegetation_pct} unit="%" />
            <DeltaLine label="Species" value={timeline.changes.species_count_delta} unit="" />
          </div>

          <div className="rounded-lg bg-charcoal-50 p-4">
            <p className="text-sm leading-relaxed text-charcoal-700">{timeline.summary}</p>
            <p className="mt-2 text-[11px] text-charcoal-400">
              Computed from stored analytics records, not generated by an LLM.
            </p>
          </div>
        </div>
      )}
    </Card>
  )
}
