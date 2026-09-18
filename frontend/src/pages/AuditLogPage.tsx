import { useCallback, useState } from 'react'
import { History } from 'lucide-react'
import { AppLayout } from '../layouts/AppLayout'
import { Select } from '../components/ui/Select'
import { ErrorState } from '../components/ui/ErrorState'
import { EmptyState } from '../components/ui/EmptyState'
import { SkeletonRow } from '../components/ui/Skeleton'
import { AuditLogRow } from '../features/audit/AuditLogRow'
import { useAsync } from '../hooks/useAsync'
import { listAuditLogs } from '../api/auditLogs'
import { listProjects } from '../api/projects'

const LIMIT = 100

export function AuditLogPage() {
  const [projectId, setProjectId] = useState('')

  const projectsState = useAsync(() => listProjects(), [])
  const fetcher = useCallback(
    () => listAuditLogs({ project_id: projectId || undefined, limit: LIMIT }),
    [projectId],
  )
  const { data, isLoading, error, refetch } = useAsync(fetcher, [projectId])

  const projectOptions = (projectsState.data?.items ?? []).map((project) => ({
    value: project.id,
    label: project.name,
  }))

  return (
    <AppLayout>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold text-charcoal-900">Audit Log</h1>
          <p className="mt-0.5 text-sm text-charcoal-500">
            A read-only, reverse-chronological record of activity across your projects.
          </p>
        </div>

        <div className="sm:w-64">
          <Select
            label="Project"
            placeholder="All projects"
            value={projectId}
            onChange={(event) => setProjectId(event.target.value)}
            options={projectOptions}
          />
        </div>

        {error ? (
          <ErrorState message={error} onRetry={refetch} />
        ) : isLoading ? (
          <div className="flex flex-col gap-3">
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
          </div>
        ) : !data || data.items.length === 0 ? (
          <EmptyState
            icon={History}
            title="No audit entries yet"
            description="Activity such as alert acknowledgements, new actions, and site changes will be recorded here."
          />
        ) : (
          <ul className="flex flex-col gap-2">
            {data.items.map((entry) => (
              <AuditLogRow key={entry.id} entry={entry} />
            ))}
          </ul>
        )}
      </div>
    </AppLayout>
  )
}
