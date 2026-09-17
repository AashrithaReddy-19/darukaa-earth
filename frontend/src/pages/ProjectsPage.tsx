import { useCallback, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, TreePine } from 'lucide-react'
import { AppLayout } from '../layouts/AppLayout'
import { Button } from '../components/ui/Button'
import { ErrorState } from '../components/ui/ErrorState'
import { EmptyState } from '../components/ui/EmptyState'
import { SkeletonCard } from '../components/ui/Skeleton'
import { ProjectFilters } from '../features/projects/ProjectFilters'
import { ProjectCard } from '../features/projects/ProjectCard'
import { useAsync } from '../hooks/useAsync'
import { useDebounce } from '../hooks/useDebounce'
import { listProjects } from '../api/projects'
import type { ProjectStatus } from '../types/enums'

export function ProjectsPage() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<ProjectStatus | ''>('')
  const debouncedSearch = useDebounce(search, 350)

  const fetcher = useCallback(
    () => listProjects({ search: debouncedSearch || undefined, status: status || undefined }),
    [debouncedSearch, status],
  )
  const { data, isLoading, error, refetch } = useAsync(fetcher, [debouncedSearch, status])

  const hasFilters = Boolean(debouncedSearch || status)

  return (
    <AppLayout>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-charcoal-900">Projects</h1>
            <p className="mt-0.5 text-sm text-charcoal-500">
              Manage your carbon and biodiversity restoration projects.
            </p>
          </div>
          <Link to="/projects/new">
            <Button leftIcon={<Plus className="h-4 w-4" aria-hidden="true" />}>New Project</Button>
          </Link>
        </div>

        <ProjectFilters
          search={search}
          onSearchChange={setSearch}
          status={status}
          onStatusChange={setStatus}
        />

        {error ? (
          <ErrorState message={error} onRetry={refetch} />
        ) : isLoading ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <SkeletonCard key={index} />
            ))}
          </div>
        ) : !data || data.items.length === 0 ? (
          <EmptyState
            icon={TreePine}
            title={hasFilters ? 'No projects match your filters' : 'No projects yet'}
            description={
              hasFilters
                ? 'Try a different search term or clear the status filter.'
                : 'Create your first project to start tracking carbon capture and biodiversity impact.'
            }
            action={
              !hasFilters ? (
                <Link to="/projects/new">
                  <Button leftIcon={<Plus className="h-4 w-4" aria-hidden="true" />}>
                    New Project
                  </Button>
                </Link>
              ) : undefined
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {data.items.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
