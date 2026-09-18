import { Link } from 'react-router-dom'
import { Plus, Sprout } from 'lucide-react'
import { AppLayout } from '../layouts/AppLayout'
import { Button } from '../components/ui/Button'
import { ErrorState } from '../components/ui/ErrorState'
import { SummaryCards } from '../features/dashboard/SummaryCards'
import { RecentProjectsList } from '../features/dashboard/RecentProjectsList'
import { RecentActivityList } from '../features/dashboard/RecentActivityList'
import { DashboardMapSection } from '../features/dashboard/DashboardMapSection'
import { AlertsSummaryCard } from '../features/alerts/AlertsSummaryCard'
import { ActionsSummaryCard } from '../features/actions/ActionsSummaryCard'
import { useAsync } from '../hooks/useAsync'
import { getDashboardMapSites, getDashboardSummary } from '../api/dashboard'

export function DashboardPage() {
  const summaryState = useAsync(getDashboardSummary, [])
  const mapState = useAsync(getDashboardMapSites, [])

  const hasAnyProjects = (summaryState.data?.total_projects ?? 0) > 0

  return (
    <AppLayout>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-charcoal-900">Dashboard</h1>
            <p className="mt-0.5 text-sm text-charcoal-500">
              A snapshot of your carbon and biodiversity portfolio.
            </p>
          </div>
          <Link to="/projects/new">
            <Button leftIcon={<Plus className="h-4 w-4" aria-hidden="true" />}>
              Create Project
            </Button>
          </Link>
        </div>

        {summaryState.error ? (
          <ErrorState message={summaryState.error} onRetry={summaryState.refetch} />
        ) : !summaryState.isLoading && !hasAnyProjects ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-forest-300 bg-forest-50 px-6 py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-forest-100 text-forest-700">
              <Sprout className="h-6 w-6" aria-hidden="true" />
            </div>
            <h2 className="text-lg font-semibold text-charcoal-900">Welcome to Darukaa.Earth</h2>
            <p className="max-w-md text-sm text-charcoal-500">
              You don&apos;t have any projects yet. Create your first project to start tracking
              carbon capture and biodiversity impact across your restoration sites.
            </p>
            <Link to="/projects/new">
              <Button leftIcon={<Plus className="h-4 w-4" aria-hidden="true" />}>
                Create your first project
              </Button>
            </Link>
          </div>
        ) : (
          <SummaryCards summary={summaryState.data} isLoading={summaryState.isLoading} />
        )}

        <DashboardMapSection
          sites={mapState.data?.items ?? []}
          isLoading={mapState.isLoading}
          error={mapState.error}
          onRetry={mapState.refetch}
          hasAnyProjects={hasAnyProjects}
        />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <RecentProjectsList
            projects={summaryState.data?.recent_projects ?? []}
            isLoading={summaryState.isLoading}
          />
          <RecentActivityList
            activity={summaryState.data?.recent_site_activity ?? []}
            isLoading={summaryState.isLoading}
          />
        </div>

        {hasAnyProjects && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <AlertsSummaryCard />
            <ActionsSummaryCard />
          </div>
        )}
      </div>
    </AppLayout>
  )
}
