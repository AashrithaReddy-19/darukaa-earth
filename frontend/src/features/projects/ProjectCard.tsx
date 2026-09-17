import { Link } from 'react-router-dom'
import { MapPin, Sprout, Leaf, Gauge } from 'lucide-react'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import type { Project } from '../../types/project'
import {
  PROJECT_STATUS_COLORS,
  PROJECT_STATUS_LABELS,
  PROJECT_TYPE_LABELS,
} from '../../utils/constants'
import { formatCarbon, formatHectares, formatScore } from '../../utils/formatters'

export function ProjectCard({ project }: { project: Project }) {
  const statusColor = PROJECT_STATUS_COLORS[project.status]

  return (
    <Link to={`/projects/${project.id}`} className="block">
      <Card hoverable className="h-full">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span
              className="mt-1 h-3 w-3 shrink-0 rounded-full"
              style={{ backgroundColor: project.color }}
              aria-hidden="true"
            />
            <div>
              <h3 className="text-base font-semibold text-charcoal-900">{project.name}</h3>
              <p className="flex items-center gap-1 text-xs text-charcoal-500">
                <MapPin className="h-3 w-3" aria-hidden="true" />
                {project.region}, {project.country}
              </p>
            </div>
          </div>
          <Badge bg={statusColor.bg} text={statusColor.text} dot={statusColor.dot}>
            {PROJECT_STATUS_LABELS[project.status]}
          </Badge>
        </div>

        <p className="mt-3 line-clamp-2 text-sm text-charcoal-600">{project.description}</p>

        <p className="mt-3 text-xs font-medium uppercase tracking-wide text-charcoal-400">
          {PROJECT_TYPE_LABELS[project.project_type]}
        </p>

        <div className="mt-4 grid grid-cols-2 gap-3 border-t border-charcoal-100 pt-4 sm:grid-cols-4">
          <Stat label="Sites" value={String(project.site_count)} icon={MapPin} />
          <Stat label="Area" value={formatHectares(project.total_area_hectares)} icon={Sprout} />
          <Stat label="Carbon" value={formatCarbon(project.total_carbon_tco2e)} icon={Leaf} />
          <Stat
            label="Biodiversity"
            value={formatScore(project.avg_biodiversity_score)}
            icon={Gauge}
          />
        </div>
      </Card>
    </Link>
  )
}

function Stat({ label, value, icon: Icon }: { label: string; value: string; icon: typeof MapPin }) {
  return (
    <div>
      <p className="flex items-center gap-1 text-[11px] text-charcoal-400">
        <Icon className="h-3 w-3" aria-hidden="true" />
        {label}
      </p>
      <p className="mt-0.5 truncate text-sm font-semibold text-charcoal-900">{value}</p>
    </div>
  )
}
