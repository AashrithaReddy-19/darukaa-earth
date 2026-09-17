import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Calendar, Globe2, MapPinPlus, Pencil, Sprout } from 'lucide-react'
import { AppLayout } from '../layouts/AppLayout'
import { Card, CardHeader, CardTitle } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { ErrorState } from '../components/ui/ErrorState'
import { EmptyState } from '../components/ui/EmptyState'
import { SkeletonRow } from '../components/ui/Skeleton'
import { ProjectSitesMap } from '../features/projects/ProjectSitesMap'
import { ProjectAnalyticsSummary } from '../features/projects/ProjectAnalyticsSummary'
import { SiteListItem } from '../features/sites/SiteListItem'
import { useAsync } from '../hooks/useAsync'
import { getProject } from '../api/projects'
import { listSites } from '../api/sites'
import {
  PROJECT_STATUS_COLORS,
  PROJECT_STATUS_LABELS,
  PROJECT_TYPE_LABELS,
} from '../utils/constants'
import { formatCarbon, formatDate, formatHectares, formatScore } from '../utils/formatters'

export function ProjectDetailPage() {
  const { projectId } = useParams<{ projectId: string }>()

  const projectState = useAsync(() => getProject(projectId!), [projectId])
  const sitesState = useAsync(() => listSites(projectId!), [projectId])

  if (projectState.isLoading) {
    return (
      <AppLayout>
        <LoadingSpinner label="Loading project…" fullHeight />
      </AppLayout>
    )
  }

  if (projectState.error || !projectState.data) {
    return (
      <AppLayout>
        <ErrorState
          message={projectState.error ?? 'Project not found.'}
          onRetry={projectState.refetch}
        />
      </AppLayout>
    )
  }

  const project = projectState.data
  const statusColor = PROJECT_STATUS_COLORS[project.status]
  const sites = sitesState.data?.items ?? []

  return (
    <AppLayout>
      <div className="flex flex-col gap-6">
        <div>
          <Link
            to="/projects"
            className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-charcoal-500 hover:text-charcoal-800"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to projects
          </Link>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
              <span
                className="mt-1.5 h-3.5 w-3.5 shrink-0 rounded-full"
                style={{ backgroundColor: project.color }}
                aria-hidden="true"
              />
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-bold text-charcoal-900">{project.name}</h1>
                  <Badge bg={statusColor.bg} text={statusColor.text} dot={statusColor.dot}>
                    {PROJECT_STATUS_LABELS[project.status]}
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-charcoal-500">
                  {project.region}, {project.country} · {PROJECT_TYPE_LABELS[project.project_type]}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Link to={`/projects/${project.id}/edit`}>
                <Button
                  variant="outline"
                  leftIcon={<Pencil className="h-4 w-4" aria-hidden="true" />}
                >
                  Edit Project
                </Button>
              </Link>
              <Link to={`/projects/${project.id}/sites/new`}>
                <Button leftIcon={<MapPinPlus className="h-4 w-4" aria-hidden="true" />}>
                  Add Site
                </Button>
              </Link>
            </div>
          </div>
        </div>

        <Card>
          <p className="text-sm leading-relaxed text-charcoal-700">{project.description}</p>
          <div className="mt-4 grid grid-cols-2 gap-4 border-t border-charcoal-100 pt-4 text-sm sm:grid-cols-4">
            <Meta icon={Globe2} label="Type" value={PROJECT_TYPE_LABELS[project.project_type]} />
            <Meta icon={Calendar} label="Start date" value={formatDate(project.start_date)} />
            <Meta
              icon={Calendar}
              label="End date"
              value={project.end_date ? formatDate(project.end_date) : 'Ongoing'}
            />
            <Meta icon={Sprout} label="Sites" value={String(project.site_count)} />
          </div>
        </Card>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard label="Total sites" value={String(project.site_count)} />
          <StatCard label="Total area" value={formatHectares(project.total_area_hectares)} />
          <StatCard label="Carbon captured" value={formatCarbon(project.total_carbon_tco2e)} />
          <StatCard label="Avg biodiversity" value={formatScore(project.avg_biodiversity_score)} />
        </div>

        <Card padded={false} className="overflow-hidden">
          <div className="p-5 pb-0">
            <CardHeader>
              <CardTitle>Site boundaries</CardTitle>
            </CardHeader>
          </div>
          <div className="px-5 pb-5">
            {sitesState.isLoading ? (
              <LoadingSpinner label="Loading map…" fullHeight />
            ) : sitesState.error ? (
              <ErrorState message={sitesState.error} onRetry={sitesState.refetch} />
            ) : (
              <ProjectSitesMap sites={sites} projectName={project.name} />
            )}
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sites</CardTitle>
          </CardHeader>
          {sitesState.isLoading ? (
            <div className="flex flex-col gap-3">
              <SkeletonRow />
              <SkeletonRow />
            </div>
          ) : sitesState.error ? (
            <ErrorState message={sitesState.error} onRetry={sitesState.refetch} />
          ) : sites.length === 0 ? (
            <EmptyState
              icon={MapPinPlus}
              title="No sites yet"
              description="Add your first monitoring site with a drawn boundary."
              action={
                <Link to={`/projects/${project.id}/sites/new`}>
                  <Button leftIcon={<MapPinPlus className="h-4 w-4" aria-hidden="true" />}>
                    Add Site
                  </Button>
                </Link>
              }
            />
          ) : (
            <div className="flex flex-col gap-2">
              {sites.map((site) => (
                <SiteListItem key={site.id} site={site} />
              ))}
            </div>
          )}
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent analytics</CardTitle>
          </CardHeader>
          {sitesState.isLoading ? <SkeletonRow /> : <ProjectAnalyticsSummary sites={sites} />}
        </Card>
      </div>
    </AppLayout>
  )
}

function Meta({ icon: Icon, label, value }: { icon: typeof Globe2; label: string; value: string }) {
  return (
    <div>
      <p className="flex items-center gap-1 text-[11px] text-charcoal-400">
        <Icon className="h-3 w-3" aria-hidden="true" />
        {label}
      </p>
      <p className="mt-0.5 font-medium text-charcoal-900">{value}</p>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <p className="text-xs font-medium text-charcoal-500">{label}</p>
      <p className="mt-1 text-xl font-bold text-charcoal-900">{value}</p>
    </Card>
  )
}
