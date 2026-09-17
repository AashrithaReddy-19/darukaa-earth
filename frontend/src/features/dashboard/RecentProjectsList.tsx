import { Link } from 'react-router-dom'
import { FolderKanban } from 'lucide-react'
import { Card, CardHeader, CardTitle } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { EmptyState } from '../../components/ui/EmptyState'
import { SkeletonRow } from '../../components/ui/Skeleton'
import type { DashboardRecentProject } from '../../types/dashboard'
import { PROJECT_STATUS_COLORS, PROJECT_STATUS_LABELS } from '../../utils/constants'
import { formatRelativeTime } from '../../utils/formatters'

export function RecentProjectsList({
  projects,
  isLoading,
}: {
  projects: DashboardRecentProject[]
  isLoading: boolean
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent projects</CardTitle>
        <Link to="/projects" className="text-sm font-medium text-forest-700 hover:underline">
          View all
        </Link>
      </CardHeader>
      {isLoading ? (
        <div className="flex flex-col gap-3">
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
        </div>
      ) : projects.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="No projects yet"
          description="Create your first project to see it here."
        />
      ) : (
        <ul className="flex flex-col gap-1">
          {projects.map((project) => {
            const statusColor = PROJECT_STATUS_COLORS[project.status]
            return (
              <li key={project.id}>
                <Link
                  to={`/projects/${project.id}`}
                  className="flex items-center justify-between gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-charcoal-50"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-charcoal-900">{project.name}</p>
                    <p className="text-xs text-charcoal-500">
                      {project.site_count} site{project.site_count === 1 ? '' : 's'} · updated{' '}
                      {formatRelativeTime(project.updated_at)}
                    </p>
                  </div>
                  <Badge bg={statusColor.bg} text={statusColor.text} dot={statusColor.dot}>
                    {PROJECT_STATUS_LABELS[project.status]}
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
