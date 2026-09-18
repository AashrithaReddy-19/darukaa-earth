import { useCallback, useState } from 'react'
import { ClipboardList, Plus } from 'lucide-react'
import { Card, CardHeader, CardTitle } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { ErrorState } from '../../components/ui/ErrorState'
import { EmptyState } from '../../components/ui/EmptyState'
import { useAsync } from '../../hooks/useAsync'
import { listActions } from '../../api/actions'
import { ActionCard } from './ActionCard'
import { CreateActionModal } from './CreateActionModal'

interface SiteOpenActionsSectionProps {
  siteId: string
  siteName: string
}

/** "Open actions for this site" section on SiteDetailPage — planned + in_progress only. */
export function SiteOpenActionsSection({ siteId, siteName }: SiteOpenActionsSectionProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const fetcher = useCallback(() => listActions({ site_id: siteId }), [siteId])
  const { data, isLoading, error, refetch } = useAsync(fetcher, [siteId])

  const openActions = (data?.items ?? []).filter(
    (action) => action.status === 'planned' || action.status === 'in_progress',
  )

  const handleUpdated = () => refetch()
  const handleCreated = () => refetch()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Open Conservation Actions</CardTitle>
        <Button
          size="sm"
          variant="outline"
          leftIcon={<Plus className="h-4 w-4" aria-hidden="true" />}
          onClick={() => setIsModalOpen(true)}
        >
          Create action
        </Button>
      </CardHeader>

      {isLoading ? (
        <LoadingSpinner label="Loading actions…" />
      ) : error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : openActions.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No open actions"
          description="Planned or in-progress conservation actions for this site will appear here."
        />
      ) : (
        <div className="flex flex-col gap-3">
          {openActions.map((action) => (
            <ActionCard key={action.id} action={action} onUpdated={handleUpdated} hideSite />
          ))}
        </div>
      )}

      <CreateActionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreated={handleCreated}
        initialSiteId={siteId}
        initialSiteName={siteName}
      />
    </Card>
  )
}
