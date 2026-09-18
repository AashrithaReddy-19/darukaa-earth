import { useCallback, useEffect, useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { AppLayout } from '../layouts/AppLayout'
import { ErrorState } from '../components/ui/ErrorState'
import { EmptyState } from '../components/ui/EmptyState'
import { SkeletonRow } from '../components/ui/Skeleton'
import { DemoIntelligenceBadge } from '../features/intelligence/DemoIntelligenceBadge'
import { AlertFilters } from '../features/alerts/AlertFilters'
import { AlertCard } from '../features/alerts/AlertCard'
import { useAsync } from '../hooks/useAsync'
import { listAlerts } from '../api/alerts'
import type { Alert, AlertSeverity, AlertStatus } from '../types'

export function AlertsPage() {
  const [severity, setSeverity] = useState<AlertSeverity | ''>('')
  const [status, setStatus] = useState<AlertStatus | ''>('')

  const fetcher = useCallback(
    () => listAlerts({ severity: severity || undefined, status: status || undefined }),
    [severity, status],
  )
  const { data, isLoading, error, refetch } = useAsync(fetcher, [severity, status])

  // Local mirror of the fetched list so Acknowledge/Resolve updates reflect immediately without
  // a full refetch, while still resetting whenever a new server response comes in.
  const [alerts, setAlerts] = useState<Alert[]>([])
  useEffect(() => {
    setAlerts(data?.items ?? [])
  }, [data])

  const handleUpdated = (updated: Alert) => {
    setAlerts((current) => current.map((alert) => (alert.id === updated.id ? updated : alert)))
  }

  const hasFilters = Boolean(severity || status)

  return (
    <AppLayout>
      <div className="flex flex-col gap-6">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-charcoal-900">Alerts</h1>
            <DemoIntelligenceBadge />
          </div>
          <p className="mt-0.5 text-sm text-charcoal-500">
            Site alerts raised by the Nature Health Score risk-assessment rules.
          </p>
        </div>

        <AlertFilters
          severity={severity}
          onSeverityChange={setSeverity}
          status={status}
          onStatusChange={setStatus}
        />

        {error ? (
          <ErrorState message={error} onRetry={refetch} />
        ) : isLoading ? (
          <div className="flex flex-col gap-3">
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
          </div>
        ) : alerts.length === 0 ? (
          <EmptyState
            icon={AlertTriangle}
            title={hasFilters ? 'No alerts match your filters' : 'No alerts'}
            description={
              hasFilters
                ? 'Try a different severity or status filter.'
                : "Alerts raised when a site's Nature Health Score risk assessment finds a concern will appear here."
            }
          />
        ) : (
          <div className="flex flex-col gap-4">
            {alerts.map((alert) => (
              <AlertCard key={alert.id} alert={alert} onUpdated={handleUpdated} />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
