import { Link } from 'react-router-dom'
import { AlertTriangle } from 'lucide-react'
import { Card, CardHeader, CardTitle } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { SkeletonCard } from '../../components/ui/Skeleton'
import { ErrorState } from '../../components/ui/ErrorState'
import { EmptyState } from '../../components/ui/EmptyState'
import { DemoIntelligenceBadge } from '../intelligence/DemoIntelligenceBadge'
import { useAsync } from '../../hooks/useAsync'
import { getAlertsSummary } from '../../api/alerts'
import { ALERT_SEVERITIES } from '../../types/enumsV2'
import { ALERT_SEVERITY_COLORS, ALERT_SEVERITY_LABELS } from '../../utils/intelligenceConstants'
import { formatRelativeTime } from '../../utils/formatters'

/** Dashboard-only compact alerts summary section (additive). */
export function AlertsSummaryCard() {
  const { data, isLoading, error, refetch } = useAsync(getAlertsSummary, [])

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-charcoal-500" aria-hidden="true" />
          <CardTitle>Site Alerts</CardTitle>
          <DemoIntelligenceBadge />
        </div>
        <Link to="/alerts" className="text-sm font-medium text-forest-700 hover:text-forest-800">
          View all
        </Link>
      </CardHeader>

      {error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : isLoading || !data ? (
        <div className="grid grid-cols-3 gap-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg bg-terracotta-50 p-3 text-center">
              <p className="text-xl font-bold text-terracotta-700">{data.open_count}</p>
              <p className="text-xs font-medium text-terracotta-600">Open</p>
            </div>
            <div className="rounded-lg bg-sand-100 p-3 text-center">
              <p className="text-xl font-bold text-sand-500">{data.acknowledged_count}</p>
              <p className="text-xs font-medium text-sand-500">Acknowledged</p>
            </div>
            <div className="rounded-lg bg-forest-100 p-3 text-center">
              <p className="text-xl font-bold text-forest-700">{data.resolved_count}</p>
              <p className="text-xs font-medium text-forest-700">Resolved</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {ALERT_SEVERITIES.map((severity) => {
              const color = ALERT_SEVERITY_COLORS[severity]
              return (
                <Badge key={severity} bg={color.bg} text={color.text} dot={color.dot}>
                  {ALERT_SEVERITY_LABELS[severity]}: {data.by_severity[severity] ?? 0}
                </Badge>
              )
            })}
          </div>

          <div className="border-t border-charcoal-100 pt-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-charcoal-400">
              Most recent open alerts
            </p>
            {data.recent.length === 0 ? (
              <EmptyState
                icon={AlertTriangle}
                title="No alerts yet"
                description="Recalculating a site's Nature Health Score will surface alerts here."
              />
            ) : (
              <ul className="flex flex-col gap-1">
                {data.recent.map((alert) => (
                  <li key={alert.id}>
                    <Link
                      to="/alerts"
                      className="flex items-center justify-between gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-charcoal-50"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-charcoal-900">
                          {alert.title}
                        </p>
                        <p className="text-xs text-charcoal-500">
                          {alert.site_name} · {formatRelativeTime(alert.created_at)}
                        </p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </Card>
  )
}
