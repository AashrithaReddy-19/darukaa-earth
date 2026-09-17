import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { Badge } from '../../components/ui/Badge'
import type { Site } from '../../types/site'
import {
  ECOSYSTEM_TYPE_LABELS,
  MONITORING_STATUS_COLORS,
  MONITORING_STATUS_LABELS,
} from '../../utils/constants'
import { formatHectares } from '../../utils/formatters'

export function SiteListItem({ site }: { site: Site }) {
  const statusColor = MONITORING_STATUS_COLORS[site.monitoring_status]

  return (
    <Link
      to={`/sites/${site.id}`}
      className="flex items-center justify-between gap-4 rounded-lg border border-charcoal-100 bg-white p-4 transition-colors hover:border-forest-200 hover:bg-forest-50/40"
    >
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-charcoal-900">{site.name}</p>
        <p className="mt-0.5 text-xs text-charcoal-500">
          {site.site_code} · {ECOSYSTEM_TYPE_LABELS[site.ecosystem_type]} ·{' '}
          {formatHectares(site.area_hectares)}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <Badge bg={statusColor.bg} text={statusColor.text} dot={statusColor.dot}>
          {MONITORING_STATUS_LABELS[site.monitoring_status]}
        </Badge>
        <ChevronRight className="h-4 w-4 text-charcoal-400" aria-hidden="true" />
      </div>
    </Link>
  )
}
