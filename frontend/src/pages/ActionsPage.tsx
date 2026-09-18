import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { AppLayout } from '../layouts/AppLayout'
import { Button } from '../components/ui/Button'
import { ErrorState } from '../components/ui/ErrorState'
import { EmptyState } from '../components/ui/EmptyState'
import { SkeletonRow } from '../components/ui/Skeleton'
import { ActionCard } from '../features/actions/ActionCard'
import { CreateActionModal } from '../features/actions/CreateActionModal'
import { useAsync } from '../hooks/useAsync'
import { listActions } from '../api/actions'
import { ACTION_STATUSES } from '../types/enumsV2'
import { ACTION_STATUS_LABELS } from '../utils/intelligenceConstants'
import type { ConservationAction } from '../types/action'

export function ActionsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const { data, isLoading, error, refetch } = useAsync(() => listActions(), [])

  const [actions, setActions] = useState<ConservationAction[]>([])
  useEffect(() => {
    setActions(data?.items ?? [])
  }, [data])

  const handleUpdated = (updated: ConservationAction) => {
    setActions((current) => current.map((action) => (action.id === updated.id ? updated : action)))
  }

  const handleCreated = () => refetch()

  return (
    <AppLayout>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-charcoal-900">Conservation Actions</h1>
            <p className="mt-0.5 text-sm text-charcoal-500">
              Plan and track field response work across all of your sites.
            </p>
          </div>
          <Button
            leftIcon={<Plus className="h-4 w-4" aria-hidden="true" />}
            onClick={() => setIsModalOpen(true)}
          >
            Create action
          </Button>
        </div>

        {error ? (
          <ErrorState message={error} onRetry={refetch} />
        ) : isLoading ? (
          <div className="flex flex-col gap-3">
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
          </div>
        ) : actions.length === 0 ? (
          <EmptyState
            title="No conservation actions yet"
            description="Create an action directly, or from an alert on the Alerts page."
            action={
              <Button
                leftIcon={<Plus className="h-4 w-4" aria-hidden="true" />}
                onClick={() => setIsModalOpen(true)}
              >
                Create action
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-4">
            {ACTION_STATUSES.map((status) => {
              const columnActions = actions.filter((action) => action.status === status)
              return (
                <div key={status} className="flex flex-col gap-3">
                  <h2 className="flex items-center justify-between text-sm font-semibold text-charcoal-700">
                    {ACTION_STATUS_LABELS[status]}
                    <span className="rounded-full bg-charcoal-100 px-2 py-0.5 text-xs font-semibold text-charcoal-600">
                      {columnActions.length}
                    </span>
                  </h2>
                  <div className="flex flex-col gap-3">
                    {columnActions.map((action) => (
                      <ActionCard key={action.id} action={action} onUpdated={handleUpdated} />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <CreateActionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreated={handleCreated}
      />
    </AppLayout>
  )
}
