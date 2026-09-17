import { Link } from 'react-router-dom'
import { Activity } from 'lucide-react'
import { Card, CardHeader, CardTitle } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { EmptyState } from '../../components/ui/EmptyState'
import { SkeletonRow } from '../../components/ui/Skeleton'
import type { DashboardRecentSiteActivity } from '../../types/dashboard'
import { MONITORING_STATUS_COLORS, MONITORING_STATUS_LABELS } from '../../utils/constants'
import { formatRelativeTime } from '../../utils/formatters'

export function RecentActivityList({
  activity,
  isLoading,
}: {
  activity: DashboardRecentSiteActivity[]
  isLoading: boolean
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent site activity</CardTitle>
      </CardHeader>
      {isLoading ? (
        <div className="flex flex-col gap-3">
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
        </div>
      ) : activity.length === 0 ? (
        <EmptyState
          icon={Activity}
          title="No recent activity"
          description="Site updates will show up here."
        />
      ) : (
        <ul className="flex flex-col gap-1">
          {activity.map((item) => {
            const statusColor = MONITORING_STATUS_COLORS[item.monitoring_status]
            return (
              <li key={item.id}>
                <Link
                  to={`/sites/${item.id}`}
                  className="flex items-center justify-between gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-charcoal-50"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-charcoal-900">{item.name}</p>
                    <p className="text-xs text-charcoal-500">
                      {item.project_name} · updated {formatRelativeTime(item.updated_at)}
                    </p>
                  </div>
                  <Badge bg={statusColor.bg} text={statusColor.text} dot={statusColor.dot}>
                    {MONITORING_STATUS_LABELS[item.monitoring_status]}
                  </Badge>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </Card>
  )
}
