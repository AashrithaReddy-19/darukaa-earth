import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Save } from 'lucide-react'
import { Input } from '../../components/ui/Input'
import { Textarea } from '../../components/ui/Textarea'
import { Select } from '../../components/ui/Select'
import { Button } from '../../components/ui/Button'
import { ColorSwatchPicker, PROJECT_COLOR_SWATCHES } from '../../components/ui/ColorSwatchPicker'
import { projectSchema, type ProjectFormValues } from './schemas'
import { PROJECT_STATUSES, PROJECT_TYPES } from '../../types/enums'
import { PROJECT_STATUS_LABELS, PROJECT_TYPE_LABELS } from '../../utils/constants'
import { getErrorMessage, getFieldErrors } from '../../utils/errors'
import type { Project, ProjectUpsertRequest } from '../../types/project'

const PROJECT_TYPE_OPTIONS = PROJECT_TYPES.map((value) => ({
  value,
  label: PROJECT_TYPE_LABELS[value],
}))
const PROJECT_STATUS_OPTIONS = PROJECT_STATUSES.map((value) => ({
  value,
  label: PROJECT_STATUS_LABELS[value],
}))

interface ProjectFormProps {
  defaultValues?: Partial<ProjectFormValues>
  onSubmit: (payload: ProjectUpsertRequest) => Promise<Project>
  onSuccess: (project: Project) => void
  submitLabel: string
}

export function ProjectForm({ defaultValues, onSubmit, onSuccess, submitLabel }: ProjectFormProps) {
  const [formError, setFormError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: '',
      description: '',
      country: '',
      region: '',
      project_type: 'forest_conservation',
      status: 'planning',
      start_date: '',
      end_date: '',
      color: PROJECT_COLOR_SWATCHES[0],
      ...defaultValues,
    },
  })

  const submit = async (values: ProjectFormValues) => {
    setFormError(null)
    const payload: ProjectUpsertRequest = {
      name: values.name,
      description: values.description,
      country: values.country,
      region: values.region,
      project_type: values.project_type as ProjectUpsertRequest['project_type'],
      status: values.status as ProjectUpsertRequest['status'],
      start_date: values.start_date,
      end_date: values.end_date ? values.end_date : null,
      color: values.color,
    }
    try {
      const project = await onSubmit(payload)
      onSuccess(project)
    } catch (error) {
      const fieldErrors = getFieldErrors(error)
      for (const [field, message] of Object.entries(fieldErrors)) {
        if (field in payload) {
          setError(field as keyof ProjectFormValues, { message })
        }
      }
      setFormError(getErrorMessage(error))
    }
  }

  return (
    <form onSubmit={handleSubmit(submit)} noValidate className="flex flex-col gap-5">
      {formError && (
        <div
          role="alert"
          className="rounded-lg border border-terracotta-200 bg-terracotta-50 px-3 py-2 text-sm text-terracotta-700"
        >
          {formError}
        </div>
      )}

      <Input label="Project name" error={errors.name?.message} {...register('name')} />
      <Textarea
        label="Description"
        rows={4}
        error={errors.description?.message}
        {...register('description')}
      />

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Input label="Country" error={errors.country?.message} {...register('country')} />
        <Input label="Region" error={errors.region?.message} {...register('region')} />
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Select
          label="Project type"
          options={PROJECT_TYPE_OPTIONS}
          error={errors.project_type?.message}
          {...register('project_type')}
        />
        <Select
          label="Status"
          options={PROJECT_STATUS_OPTIONS}
          error={errors.status?.message}
          {...register('status')}
        />
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Input
          label="Start date"
          type="date"
          error={errors.start_date?.message}
          {...register('start_date')}
        />
        <Input
          label="End date"
          type="date"
          hint="Optional"
          error={errors.end_date?.message}
          {...register('end_date')}
        />
      </div>

      <Controller
        control={control}
        name="color"
        render={({ field }) => (
          <ColorSwatchPicker
            label="Marker color"
            value={field.value}
            onChange={field.onChange}
            error={errors.color?.message}
          />
        )}
      />

      <div className="flex justify-end gap-3 border-t border-charcoal-100 pt-5">
        <Button
          type="submit"
          isLoading={isSubmitting}
          leftIcon={<Save className="h-4 w-4" aria-hidden="true" />}
        >
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}
