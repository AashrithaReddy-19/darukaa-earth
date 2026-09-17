import { AlertTriangle, Bird, Droplets, Gauge, Leaf, Sprout, TreePine } from 'lucide-react'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import type { DisturbanceRisk } from '../../types/enums'
import { DISTURBANCE_RISK_COLORS, DISTURBANCE_RISK_LABELS } from '../../utils/constants'
import {
  formatCarbon,
  formatHectares,
  formatNumber,
  formatPercent,
  formatScore,
} from '../../utils/formatters'

/**
 * Common subset shared by a full `AnalyticsRecord` and a site's lighter-weight `latest_snapshot`
 * (which has no vegetation/soil fields) — lets this component accept either as a fallback.
 */
export interface SiteMetricsSnapshot {
  carbon_captured_tco2e: number
  biodiversity_score: number
  species_count: number
  ecosystem_health_score: number
  disturbance_risk: DisturbanceRisk
  vegetation_cover_percent?: number
  soil_moisture_percent?: number
}

export function SiteMetricCards({
  areaHectares,
  latest,
}: {
  areaHectares: number
  latest: SiteMetricsSnapshot | null
}) {
  const riskColor = latest ? DISTURBANCE_RISK_COLORS[latest.disturbance_risk] : null

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      <MetricCard icon={Sprout} label="Area" value={formatHectares(areaHectares)} />
      <MetricCard
        icon={Gauge}
        label="Ecosystem health"
        value={formatScore(latest?.ecosystem_health_score)}
      />
      <MetricCard
        icon={Leaf}
        label="Carbon captured"
        value={formatCarbon(latest?.carbon_captured_tco2e)}
      />
      <MetricCard
        icon={TreePine}
        label="Biodiversity score"
        value={formatScore(latest?.biodiversity_score)}
      />
      <MetricCard icon={Bird} label="Species count" value={formatNumber(latest?.species_count)} />
      <MetricCard
        icon={Sprout}
        label="Vegetation cover"
        value={formatPercent(latest?.vegetation_cover_percent)}
      />
      <MetricCard
        icon={Droplets}
        label="Soil moisture"
        value={formatPercent(latest?.soil_moisture_percent)}
      />
      <Card className="flex flex-col justify-between gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-terracotta-100 text-terracotta-600">
          <AlertTriangle className="h-[18px] w-[18px]" aria-hidden="true" />
        </div>
        <p className="text-xs font-medium text-charcoal-500">Disturbance risk</p>
        {riskColor && latest ? (
          <Badge bg={riskColor.bg} text={riskColor.text} dot={riskColor.dot}>
            {DISTURBANCE_RISK_LABELS[latest.disturbance_risk]}
          </Badge>
        ) : (
          <p className="text-lg font-semibold text-charcoal-400">—</p>
        )}
      </Card>
    </div>
  )
}

function MetricCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Sprout
  label: string
  value: string
}) {
  return (
    <Card className="flex flex-col gap-2">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-forest-100 text-forest-700">
        <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
      </div>
      <p className="text-xs font-medium text-charcoal-500">{label}</p>
      <p className="text-xl font-bold text-charcoal-900">{value}</p>
    </Card>
  )
}
