import { Card, CardHeader, CardTitle } from '../../components/ui/Card'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { ErrorState } from '../../components/ui/ErrorState'
import { EmptyState } from '../../components/ui/EmptyState'
import { SitesPolygonMap } from '../map/SitesPolygonMap'
import { buildSitePopupHtml } from '../map/popupHtml'
import type { DashboardMapSite } from '../../types/dashboard'
import { PROJECT_STATUS_COLORS, PROJECT_STATUS_LABELS } from '../../utils/constants'
import { PROJECT_STATUSES } from '../../types/enums'
import { MapPin } from 'lucide-react'

interface DashboardMapSectionProps {
  sites: DashboardMapSite[]
  isLoading: boolean
  error: string | null
  onRetry: () => void
  hasAnyProjects: boolean
}

export function DashboardMapSection({
  sites,
  isLoading,
  error,
  onRetry,
  hasAnyProjects,
}: DashboardMapSectionProps) {
  return (
    <Card padded={false} className="overflow-hidden">
      <div className="p-5 pb-0">
        <CardHeader>
          <CardTitle>Sites overview map</CardTitle>
        </CardHeader>
      </div>
      <div className="px-5 pb-5">
        {isLoading ? (
          <div className="flex h-[420px] items-center justify-center rounded-xl border border-charcoal-100 bg-charcoal-50">
            <LoadingSpinner label="Loading map…" size="lg" />
          </div>
        ) : error ? (
          <ErrorState message={error} onRetry={onRetry} />
        ) : !hasAnyProjects ? (
          <EmptyState
            icon={MapPin}
            title="No sites to show yet"
            description="Once you add sites with boundaries to a project, they'll appear here on the map."
          />
        ) : (
          <SitesPolygonMap
            sites={sites.map((site) => ({
              id: site.id,
              boundary: site.boundary,
              color: PROJECT_STATUS_COLORS[site.project_status].dot,
              popupHtml: buildSitePopupHtml({
                siteName: site.name,
                projectName: site.project_name,
                areaHectares: site.area_hectares,
                healthScore: site.ecosystem_health_score,
              }),
            }))}
            legendTitle="Project status"
            legendItems={PROJECT_STATUSES.map((status) => ({
              label: PROJECT_STATUS_LABELS[status],
              color: PROJECT_STATUS_COLORS[status].dot,
            }))}
          />
        )}
      </div>
    </Card>
  )
}
