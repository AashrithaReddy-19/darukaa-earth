import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { AppLayout } from '../layouts/AppLayout'
import { Card } from '../components/ui/Card'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { ErrorState } from '../components/ui/ErrorState'
import { SiteForm } from '../features/sites/SiteForm'
import { useAsync } from '../hooks/useAsync'
import { useToast } from '../components/system/ToastContext'
import { createSite, getSite, updateSite } from '../api/sites'
import type { Site } from '../types/site'

export function SiteFormPage() {
  const { projectId, siteId } = useParams<{ projectId?: string; siteId?: string }>()
  const isEditMode = Boolean(siteId)
  const navigate = useNavigate()
  const { showToast } = useToast()

  const {
    data: existingSite,
    isLoading,
    error,
    refetch,
  } = useAsync<Site | null>(() => (siteId ? getSite(siteId) : Promise.resolve(null)), [siteId])

  const backLink =
    isEditMode && existingSite
      ? `/sites/${existingSite.id}`
      : projectId
        ? `/projects/${projectId}`
        : '/projects'

  const handleSuccess = (site: Site) => {
    showToast({
      variant: 'success',
      title: isEditMode ? 'Site updated' : 'Site created',
      description: `${site.name} was saved successfully.`,
    })
    navigate(`/sites/${site.id}`)
  }

  return (
    <AppLayout>
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <div>
          <Link
            to={backLink}
            className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-charcoal-500 hover:text-charcoal-800"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back
          </Link>
          <h1 className="text-2xl font-bold text-charcoal-900">
            {isEditMode ? 'Edit Site' : 'Add Site'}
          </h1>
          <p className="mt-0.5 text-sm text-charcoal-500">
            {isEditMode
              ? 'Update site details and its monitoring boundary.'
              : 'Draw the site boundary and fill in its details.'}
          </p>
        </div>

        <Card>
          {isEditMode && isLoading ? (
            <LoadingSpinner label="Loading site…" fullHeight />
          ) : isEditMode && (error || !existingSite) ? (
            <ErrorState message={error ?? 'Site not found.'} onRetry={refetch} />
          ) : !isEditMode && !projectId ? (
            <ErrorState message="Missing project reference. Go back and try again." />
          ) : (
            <SiteForm
              submitLabel={isEditMode ? 'Save changes' : 'Create site'}
              defaultValues={
                existingSite
                  ? {
                      name: existingSite.name,
                      site_code: existingSite.site_code,
                      ecosystem_type: existingSite.ecosystem_type,
                      monitoring_status: existingSite.monitoring_status,
                      notes: existingSite.notes ?? '',
                      boundary: existingSite.boundary,
                    }
                  : undefined
              }
              onSuccess={handleSuccess}
              onSubmit={(payload) =>
                isEditMode && siteId ? updateSite(siteId, payload) : createSite(projectId!, payload)
              }
            />
          )}
        </Card>
      </div>
    </AppLayout>
  )
}
