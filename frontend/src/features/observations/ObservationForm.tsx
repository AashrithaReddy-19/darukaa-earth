import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { PlusCircle } from 'lucide-react'
import { Input } from '../../components/ui/Input'
import { Textarea } from '../../components/ui/Textarea'
import { Select } from '../../components/ui/Select'
import { Button } from '../../components/ui/Button'
import { observationSchema, type ObservationFormValues } from './schemas'
import { OBSERVATION_TYPES } from '../../types/enumsV2'
import { OBSERVATION_TYPE_LABELS } from '../../utils/intelligenceConstants'
import { getErrorMessage } from '../../utils/errors'
import type { CreateFieldObservationRequest, FieldObservation } from '../../types/observation'

const OBSERVATION_TYPE_OPTIONS = OBSERVATION_TYPES.map((value) => ({
  value,
  label: OBSERVATION_TYPE_LABELS[value],
}))

const today = () => new Date().toISOString().slice(0, 10)

interface ObservationFormProps {
  onSubmit: (payload: CreateFieldObservationRequest) => Promise<FieldObservation>
  onSuccess: (observation: FieldObservation) => void
}

export function ObservationForm({ onSubmit, onSuccess }: ObservationFormProps) {
  const [formError, setFormError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ObservationFormValues>({
    resolver: zodResolver(observationSchema),
    defaultValues: {
      observer_name: '',
      observation_type: 'Species',
      notes: '',
      latitude: '',
      longitude: '',
      observation_date: today(),
    },
  })

  const submit = async (values: ObservationFormValues) => {
    setFormError(null)
    const payload: CreateFieldObservationRequest = {
      observer_name: values.observer_name,
      observation_type:
        values.observation_type as CreateFieldObservationRequest['observation_type'],
      notes: values.notes,
      latitude: values.latitude ? Number(values.latitude) : null,
      longitude: values.longitude ? Number(values.longitude) : null,
      observation_date: values.observation_date,
    }
    try {
      const observation = await onSubmit(payload)
      onSuccess(observation)
      reset({
        observer_name: '',
        observation_type: 'Species',
        notes: '',
        latitude: '',
        longitude: '',
        observation_date: today(),
      })
    } catch (error) {
      setFormError(getErrorMessage(error))
    }
  }

  return (
    <form onSubmit={handleSubmit(submit)} noValidate className="flex flex-col gap-4">
      {formError && (
        <div
          role="alert"
          className="rounded-lg border border-terracotta-200 bg-terracotta-50 px-3 py-2 text-sm text-terracotta-700"
        >
          {formError}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="Observer name"
          error={errors.observer_name?.message}
          {...register('observer_name')}
        />
        <Select
          label="Observation type"
          options={OBSERVATION_TYPE_OPTIONS}
          error={errors.observation_type?.message}
          {...register('observation_type')}
        />
      </div>

      <Textarea label="Notes" rows={3} error={errors.notes?.message} {...register('notes')} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Input
          label="Latitude"
          hint="Optional"
          inputMode="decimal"
          error={errors.latitude?.message}
          {...register('latitude')}
        />
        <Input
          label="Longitude"
          hint="Optional"
          inputMode="decimal"
          error={errors.longitude?.message}
          {...register('longitude')}
        />
        <Input
          label="Observation date"
          type="date"
          error={errors.observation_date?.message}
          {...register('observation_date')}
        />
      </div>

      <div className="flex justify-end">
        <Button
          type="submit"
          isLoading={isSubmitting}
          leftIcon={<PlusCircle className="h-4 w-4" aria-hidden="true" />}
        >
          Add observation
        </Button>
      </div>
    </form>
  )
}
