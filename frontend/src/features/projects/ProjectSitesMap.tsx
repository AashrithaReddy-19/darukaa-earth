import { MapPin } from 'lucide-react'
import { EmptyState } from '../../components/ui/EmptyState'
import { SitesPolygonMap } from '../map/SitesPolygonMap'
import { buildSitePopupHtml } from '../map/popupHtml'
import type { Site } from '../../types/site'
import { MONITORING_STATUSES } from '../../types/enums'
import { MONITORING_STATUS_COLORS, MONITORING_STATUS_LABELS } from '../../utils/constants'

export function ProjectSitesMap({ sites, projectName }: { sites: Site[]; projectName: string }) {
  if (sites.length === 0) {
    return (
      <EmptyState
        icon={MapPin}
        title="No site boundaries yet"
        description="Add a site with a drawn boundary to see it on the map."
      />
    )
  }

  return (
    <SitesPolygonMap
      sites={sites.map((site) => ({
        id: site.id,
        boundary: site.boundary,
        color: MONITORING_STATUS_COLORS[site.monitoring_status].dot,
        popupHtml: buildSitePopupHtml({
          siteName: site.name,
          projectName,
          areaHectares: site.area_hectares,
          healthScore: site.latest_snapshot?.ecosystem_health_score ?? null,
        }),
      }))}
      legendTitle="Monitoring status"
      legendItems={MONITORING_STATUSES.map((status) => ({
        label: MONITORING_STATUS_LABELS[status],
        color: MONITORING_STATUS_COLORS[status].dot,
      }))}
    />
  )
}
