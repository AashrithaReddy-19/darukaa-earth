import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import { AppLayout } from '../layouts/AppLayout'
import { Card } from '../components/ui/Card'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { ErrorState } from '../components/ui/ErrorState'
import { ProjectForm } from '../features/projects/ProjectForm'
import { useAsync } from '../hooks/useAsync'
import { useToast } from '../components/system/ToastContext'
import { createProject, getProject, updateProject } from '../api/projects'
import type { Project } from '../types/project'

export function ProjectFormPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const isEditMode = Boolean(projectId)
  const navigate = useNavigate()
  const { showToast } = useToast()

  const {
    data: project,
    isLoading,
    error,
    refetch,
  } = useAsync<Project | null>(
    () => (projectId ? getProject(projectId) : Promise.resolve(null)),
    [projectId],
  )

  const handleSuccess = (savedProject: Project) => {
    showToast({
      variant: 'success',
      title: isEditMode ? 'Project updated' : 'Project created',
      description: `${savedProject.name} was saved successfully.`,
    })
    navigate(`/projects/${savedProject.id}`)
  }

  return (
    <AppLayout>
      <div className="mx-auto flex max-w-2xl flex-col gap-6">
        <div>
          <Link
            to={isEditMode && projectId ? `/projects/${projectId}` : '/projects'}
            className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-charcoal-500 hover:text-charcoal-800"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back
          </Link>
          <h1 className="text-2xl font-bold text-charcoal-900">
            {isEditMode ? 'Edit Project' : 'New Project'}
          </h1>
          <p className="mt-0.5 text-sm text-charcoal-500">
            {isEditMode
              ? 'Update the project details below.'
              : 'Fill in the details to start a new project.'}
          </p>
        </div>

        <Card>
          {isEditMode && isLoading ? (
            <LoadingSpinner label="Loading project…" fullHeight />
          ) : isEditMode && error ? (
            <ErrorState message={error} onRetry={refetch} />
          ) : (
            <ProjectForm
              defaultValues={
                project
                  ? {
                      name: project.name,
                      description: project.description,
                      country: project.country,
                      region: project.region,
                      project_type: project.project_type,
                      status: project.status,
                      start_date: project.start_date,
                      end_date: project.end_date ?? '',
                      color: project.color,
                    }
                  : undefined
              }
              submitLabel={isEditMode ? 'Save changes' : 'Create project'}
              onSuccess={handleSuccess}
              onSubmit={(payload) =>
                isEditMode && projectId ? updateProject(projectId, payload) : createProject(payload)
              }
            />
          )}
        </Card>
      </div>
    </AppLayout>
  )
}
