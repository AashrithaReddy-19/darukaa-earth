import { BarChart3 } from 'lucide-react'
import { EmptyState } from '../../components/ui/EmptyState'
import { Badge } from '../../components/ui/Badge'
import type { Site } from '../../types/site'
import { formatCarbon, formatDate, formatScore } from '../../utils/formatters'
import { DISTURBANCE_RISK_COLORS, DISTURBANCE_RISK_LABELS } from '../../utils/constants'

/** Small per-site snapshot strip pulled from each site's `latest_snapshot` (no extra API call needed). */
export function ProjectAnalyticsSummary({ sites }: { sites: Site[] }) {
  const sitesWithSnapshots = sites.filter((site) => site.latest_snapshot)

  if (sitesWithSnapshots.length === 0) {
    return (
      <EmptyState
        icon={BarChart3}
        title="No analytics recorded yet"
        description="Once monitoring snapshots come in for this project's sites, a summary will appear here."
      />
    )
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-1">
      {sitesWithSnapshots.map((site) => {
        const snapshot = site.latest_snapshot!
        const riskColor = DISTURBANCE_RISK_COLORS[snapshot.disturbance_risk]
        return (
          <div
            key={site.id}
            className="min-w-[200px] shrink-0 rounded-lg border border-charcoal-100 bg-charcoal-50/60 p-3"
          >
            <p className="truncate text-sm font-semibold text-charcoal-900">{site.name}</p>
            <p className="text-[11px] text-charcoal-500">
              as of {formatDate(snapshot.recorded_at)}
            </p>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-xs text-charcoal-500">Carbon</span>
              <span className="text-sm font-semibold text-forest-700">
                {formatCarbon(snapshot.carbon_captured_tco2e)}
              </span>
            </div>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-xs text-charcoal-500">Biodiversity</span>
              <span className="text-sm font-semibold text-teal-700">
                {formatScore(snapshot.biodiversity_score)}
              </span>
            </div>
            <div className="mt-2">
              <Badge bg={riskColor.bg} text={riskColor.text} dot={riskColor.dot}>
                {DISTURBANCE_RISK_LABELS[snapshot.disturbance_risk]} risk
              </Badge>
            </div>
          </div>
        )
      })}
    </div>
  )
}
