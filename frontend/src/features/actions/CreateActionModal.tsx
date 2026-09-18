import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Modal } from '../../components/ui/Modal'
import { Input } from '../../components/ui/Input'
import { Textarea } from '../../components/ui/Textarea'
import { Select } from '../../components/ui/Select'
import { Button } from '../../components/ui/Button'
import { useToast } from '../../components/system/ToastContext'
import { useAsync } from '../../hooks/useAsync'
import { getDashboardMapSites } from '../../api/dashboard'
import { createAction } from '../../api/actions'
import { createActionSchema, type CreateActionFormValues } from './schemas'
import { ACTION_CATEGORIES, ACTION_PRIORITIES } from '../../types/enumsV2'
import { ACTION_CATEGORY_LABELS, ACTION_PRIORITY_LABELS } from '../../utils/intelligenceConstants'
import { getErrorMessage } from '../../utils/errors'
import type { ConservationAction } from '../../types/action'

const CATEGORY_OPTIONS = ACTION_CATEGORIES.map((value) => ({
  value,
  label: ACTION_CATEGORY_LABELS[value],
}))
const PRIORITY_OPTIONS = ACTION_PRIORITIES.map((value) => ({
  value,
  label: ACTION_PRIORITY_LABELS[value],
}))

interface CreateActionModalProps {
  isOpen: boolean
  onClose: () => void
  onCreated: (action: ConservationAction) => void
  /** Pre-fills and locks the site/alert when opened from an alert card. */
  initialSiteId?: string
  initialSiteName?: string
  initialAlertId?: string
}

export function CreateActionModal({
  isOpen,
  onClose,
  onCreated,
  initialSiteId,
  initialSiteName,
  initialAlertId,
}: CreateActionModalProps) {
  const { showToast } = useToast()
  const [formError, setFormError] = useState<string | null>(null)
  const sitesState = useAsync(getDashboardMapSites, [])
  const siteOptions = (sitesState.data?.items ?? []).map((site) => ({
    value: site.id,
    label: `${site.name} (${site.project_name})`,
  }))

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateActionFormValues>({
    resolver: zodResolver(createActionSchema),
    defaultValues: {
      site_id: initialSiteId ?? '',
      title: '',
      description: '',
      action_category: 'Field Survey',
      priority: 'medium',
      due_date: '',
    },
  })

  const submit = async (values: CreateActionFormValues) => {
    setFormError(null)
    try {
      const action = await createAction({
        site_id: values.site_id,
        alert_id: initialAlertId ?? null,
        title: values.title,
        description: values.description,
        action_category: values.action_category as ConservationAction['action_category'],
        priority: values.priority as ConservationAction['priority'],
        due_date: values.due_date ? values.due_date : null,
      })
      onCreated(action)
      showToast({ variant: 'success', title: 'Conservation action created' })
      reset()
      onClose()
    } catch (error) {
      setFormError(getErrorMessage(error))
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create conservation action">
      <form onSubmit={handleSubmit(submit)} noValidate className="flex flex-col gap-4">
        {formError && (
          <div
            role="alert"
            className="rounded-lg border border-terracotta-200 bg-terracotta-50 px-3 py-2 text-sm text-terracotta-700"
          >
            {formError}
          </div>
        )}

        {initialSiteId ? (
          <div>
            <p className="text-sm font-medium text-charcoal-700">Site</p>
            <p className="mt-1 text-sm text-charcoal-900">{initialSiteName ?? initialSiteId}</p>
          </div>
        ) : (
          <Select
            label="Site"
            placeholder={sitesState.isLoading ? 'Loading sites…' : 'Select a site'}
            options={siteOptions}
            error={errors.site_id?.message}
            {...register('site_id')}
          />
        )}

        <Input label="Title" error={errors.title?.message} {...register('title')} />
        <Textarea
          label="Description"
          rows={3}
          error={errors.description?.message}
          {...register('description')}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select
            label="Category"
            options={CATEGORY_OPTIONS}
            error={errors.action_category?.message}
            {...register('action_category')}
          />
          <Select
            label="Priority"
            options={PRIORITY_OPTIONS}
            error={errors.priority?.message}
            {...register('priority')}
          />
        </div>

        <Input
          label="Due date"
          type="date"
          hint="Optional"
          error={errors.due_date?.message}
          {...register('due_date')}
        />

        <div className="flex justify-end gap-3 border-t border-charcoal-100 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            Create action
          </Button>
        </div>
      </form>
    </Modal>
  )
}
