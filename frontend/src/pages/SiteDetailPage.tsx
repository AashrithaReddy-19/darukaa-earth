import { useCallback, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Pencil } from 'lucide-react'
import { AppLayout } from '../layouts/AppLayout'
import { Card, CardHeader, CardTitle } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { ErrorState } from '../components/ui/ErrorState'
import { SiteMetricCards } from '../features/sites/SiteMetricCards'
import { SitesPolygonMap } from '../features/map/SitesPolygonMap'
import { buildSitePopupHtml } from '../features/map/popupHtml'
import { DateRangeFilter } from '../features/analytics/DateRangeFilter'
import { DemoDataBadge } from '../features/analytics/DemoDataBadge'
import { CarbonChart } from '../features/analytics/CarbonChart'
import { BiodiversityChart } from '../features/analytics/BiodiversityChart'
import { VegetationChart } from '../features/analytics/VegetationChart'
import { SpeciesCategoryChart } from '../features/analytics/SpeciesCategoryChart'
import { EcosystemHealthDoughnut } from '../features/analytics/EcosystemHealthDoughnut'
import { useAsync } from '../hooks/useAsync'
import { getSite } from '../api/sites'
import { getSiteAnalytics, getSpeciesObservations } from '../api/analytics'
import type { AnalyticsRange } from '../types/enums'
import {
  ECOSYSTEM_TYPE_LABELS,
  MONITORING_STATUS_COLORS,
  MONITORING_STATUS_LABELS,
} from '../utils/constants'

export function SiteDetailPage() {
  const { siteId } = useParams<{ siteId: string }>()
  const [range, setRange] = useState<AnalyticsRange>('12m')

  const siteState = useAsync(() => getSite(siteId!), [siteId])
  const analyticsFetcher = useCallback(() => getSiteAnalytics(siteId!, range), [siteId, range])
  const analyticsState = useAsync(analyticsFetcher, [siteId, range])
  const speciesState = useAsync(() => getSpeciesObservations(siteId!), [siteId])

  if (siteState.isLoading) {
    return (
      <AppLayout>
        <LoadingSpinner label="Loading site…" fullHeight />
      </AppLayout>
    )
  }

  if (siteState.error || !siteState.data) {
    return (
      <AppLayout>
        <ErrorState message={siteState.error ?? 'Site not found.'} onRetry={siteState.refetch} />
      </AppLayout>
    )
  }

  const site = siteState.data
  const statusColor = MONITORING_STATUS_COLORS[site.monitoring_status]
  const mapColor = site.project?.color ?? statusColor.dot

  return (
    <AppLayout>
      <div className="flex flex-col gap-6">
        <div>
          {site.project && (
            <Link
              to={`/projects/${site.project.id}`}
              className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-charcoal-500 hover:text-charcoal-800"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Back to {site.project.name}
            </Link>
          )}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold text-charcoal-900">{site.name}</h1>
                <Badge>{ECOSYSTEM_TYPE_LABELS[site.ecosystem_type]}</Badge>
                <Badge bg={statusColor.bg} text={statusColor.text} dot={statusColor.dot}>
                  {MONITORING_STATUS_LABELS[site.monitoring_status]}
                </Badge>
              </div>
              <p className="mt-1 text-sm text-charcoal-500">
                {site.site_code}
                {site.project && <> · {site.project.name}</>}
              </p>
            </div>
            <Link to={`/sites/${site.id}/edit`}>
              <Button
                variant="outline"
                leftIcon={<Pencil className="h-4 w-4" aria-hidden="true" />}
              >
                Edit Site
              </Button>
            </Link>
          </div>
        </div>

        <Card padded={false} className="overflow-hidden">
          <div className="p-5 pb-0">
            <CardHeader>
              <CardTitle>Boundary</CardTitle>
            </CardHeader>
          </div>
          <div className="px-5 pb-5">
            <SitesPolygonMap
              heightClassName="h-[320px]"
              sites={[
                {
                  id: site.id,
                  boundary: site.boundary,
                  color: mapColor,
                  popupHtml: buildSitePopupHtml({
                    siteName: site.name,
                    projectName: site.project?.name ?? '—',
                    areaHectares: site.area_hectares,
                    healthScore: site.latest_snapshot?.ecosystem_health_score ?? null,
                  }),
                },
              ]}
            />
          </div>
        </Card>

        <SiteMetricCards
          areaHectares={site.area_hectares}
          latest={analyticsState.data?.latest ?? site.latest_snapshot}
        />

        {site.notes && (
          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <p className="text-sm text-charcoal-700">{site.notes}</p>
          </Card>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5">
            <h2 className="text-lg font-semibold text-charcoal-900">Analytics</h2>
            <DemoDataBadge />
          </div>
          <DateRangeFilter value={range} onChange={setRange} />
        </div>

        {analyticsState.error ? (
          <ErrorState message={analyticsState.error} onRetry={analyticsState.refetch} />
        ) : analyticsState.isLoading ? (
          <LoadingSpinner label="Loading analytics…" fullHeight />
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <CarbonChart records={analyticsState.data?.records ?? []} />
            <BiodiversityChart records={analyticsState.data?.records ?? []} />
            {speciesState.error ? (
              <ErrorState message={speciesState.error} onRetry={speciesState.refetch} />
            ) : (
              <SpeciesCategoryChart byCategory={speciesState.data?.by_category ?? {}} />
            )}
            <EcosystemHealthDoughnut latest={analyticsState.data?.latest ?? null} />
            <div className="lg:col-span-2">
              <VegetationChart records={analyticsState.data?.records ?? []} />
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
