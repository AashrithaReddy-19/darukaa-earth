import { useState } from 'react'
import { Controller, useForm, type DefaultValues } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Save } from 'lucide-react'
import { Input } from '../../components/ui/Input'
import { Textarea } from '../../components/ui/Textarea'
import { Select } from '../../components/ui/Select'
import { Button } from '../../components/ui/Button'
import { PolygonDrawMap } from '../map/PolygonDrawMap'
import { siteSchema, type SiteFormValues } from './schemas'
import { ECOSYSTEM_TYPES, MONITORING_STATUSES } from '../../types/enums'
import { ECOSYSTEM_TYPE_LABELS, MONITORING_STATUS_LABELS } from '../../utils/constants'
import { getErrorMessage, getFieldErrors } from '../../utils/errors'
import type { Site, SiteUpsertRequest } from '../../types/site'
import type { SiteGeometry } from '../../types/common'

const ECOSYSTEM_TYPE_OPTIONS = ECOSYSTEM_TYPES.map((value) => ({
  value,
  label: ECOSYSTEM_TYPE_LABELS[value],
}))
const MONITORING_STATUS_OPTIONS = MONITORING_STATUSES.map((value) => ({
  value,
  label: MONITORING_STATUS_LABELS[value],
}))

interface SiteFormProps {
  defaultValues?: Partial<SiteFormValues>
  onSubmit: (payload: SiteUpsertRequest) => Promise<Site>
  onSuccess: (site: Site) => void
  submitLabel: string
}

export function SiteForm({ defaultValues, onSubmit, onSuccess, submitLabel }: SiteFormProps) {
  const [formError, setFormError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<SiteFormValues>({
    resolver: zodResolver(siteSchema),
    // Cast needed because RHF's DeepPartial helper drops `null` from the `boundary` union type;
    // the runtime value still needs to be `null` (not `undefined`) so the zod `.nullable()` +
    // `.refine()` boundary-required check produces our custom message instead of a generic one.
    defaultValues: {
      name: '',
      site_code: '',
      ecosystem_type: 'forest',
      monitoring_status: 'active',
      notes: '',
      boundary: null,
      ...defaultValues,
    } as DefaultValues<SiteFormValues>,
  })

  const submit = async (values: SiteFormValues) => {
    setFormError(null)
    const payload: SiteUpsertRequest = {
      name: values.name,
      site_code: values.site_code,
      ecosystem_type: values.ecosystem_type as SiteUpsertRequest['ecosystem_type'],
      monitoring_status: values.monitoring_status as SiteUpsertRequest['monitoring_status'],
      notes: values.notes ? values.notes : null,
      boundary: values.boundary as SiteGeometry,
    }
    try {
      const site = await onSubmit(payload)
      onSuccess(site)
    } catch (error) {
      const fieldErrors = getFieldErrors(error)
      for (const [field, message] of Object.entries(fieldErrors)) {
        if (field in payload) {
          setError(field as keyof SiteFormValues, { message })
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

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Input label="Site name" error={errors.name?.message} {...register('name')} />
        <Input
          label="Site code"
          hint="Must be unique, e.g. SND-001"
          error={errors.site_code?.message}
          {...register('site_code')}
        />
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Select
          label="Ecosystem type"
          options={ECOSYSTEM_TYPE_OPTIONS}
          error={errors.ecosystem_type?.message}
          {...register('ecosystem_type')}
        />
        <Select
          label="Monitoring status"
          options={MONITORING_STATUS_OPTIONS}
          error={errors.monitoring_status?.message}
          {...register('monitoring_status')}
        />
      </div>

      <Textarea
        label="Notes"
        rows={3}
        hint="Optional"
        error={errors.notes?.message}
        {...register('notes')}
      />

      <div>
        <p className="mb-1.5 text-sm font-medium text-charcoal-700">Site boundary</p>
        <Controller
          control={control}
          name="boundary"
          render={({ field }) => (
            <PolygonDrawMap initialGeometry={field.value} onChange={field.onChange} />
          )}
        />
        {errors.boundary && (
          <p role="alert" className="mt-1.5 text-xs font-medium text-terracotta-600">
            {errors.boundary.message}
          </p>
        )}
      </div>

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
