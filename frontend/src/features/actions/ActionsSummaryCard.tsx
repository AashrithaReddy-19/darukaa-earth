import { Link } from 'react-router-dom'
import { ClipboardList } from 'lucide-react'
import { Card, CardHeader, CardTitle } from '../../components/ui/Card'
import { SkeletonCard } from '../../components/ui/Skeleton'
import { ErrorState } from '../../components/ui/ErrorState'
import { useAsync } from '../../hooks/useAsync'
import { getActionsSummary } from '../../api/actions'
import { ACTION_STATUSES } from '../../types/enumsV2'
import { ACTION_STATUS_COLORS, ACTION_STATUS_LABELS } from '../../utils/intelligenceConstants'

/** Dashboard-only summary of conservation action counts by status (additive section). */
export function ActionsSummaryCard() {
  const { data, isLoading, error, refetch } = useAsync(getActionsSummary, [])

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <ClipboardList className="h-4 w-4 text-charcoal-500" aria-hidden="true" />
          <CardTitle>Conservation actions</CardTitle>
        </div>
        <Link to="/actions" className="text-sm font-medium text-forest-700 hover:text-forest-800">
          View all
        </Link>
      </CardHeader>

      {error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : isLoading || !data ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {ACTION_STATUSES.map((status) => (
            <SkeletonCard key={status} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {ACTION_STATUSES.map((status) => {
            const color = ACTION_STATUS_COLORS[status]
            return (
              <div key={status} className={`rounded-lg p-3 ${color.bg}`}>
                <p className={`text-xs font-medium ${color.text}`}>
                  {ACTION_STATUS_LABELS[status]}
                </p>
                <p className="mt-1 text-xl font-bold text-charcoal-900">
                  {data.by_status[status] ?? 0}
                </p>
              </div>
            )
          })}
        </div>
      )}
    </Card>
  )
}
