import { useMemo, useState } from 'react'
import { Card, CardHeader, CardTitle } from '../../components/ui/Card'
import { Select } from '../../components/ui/Select'
import { LoadingSpinner } from '../../components/ui/LoadingSpinner'
import { ErrorState } from '../../components/ui/ErrorState'
import { useToast } from '../../components/system/ToastContext'
import { ObservationForm } from './ObservationForm'
import { ObservationList } from './ObservationList'
import { createFieldObservation } from '../../api/observations'
import { OBSERVATION_TYPES } from '../../types/enumsV2'
import { OBSERVATION_TYPE_LABELS } from '../../utils/intelligenceConstants'
import type { FieldObservation } from '../../types/observation'
import type { ObservationType } from '../../types/enumsV2'

interface FieldObservationsSectionProps {
  siteId: string
  observations: FieldObservation[]
  isLoading: boolean
  error: string | null
  onRetry: () => void
  onCreated: (observation: FieldObservation) => void
}

const TYPE_FILTER_OPTIONS = OBSERVATION_TYPES.map((value) => ({
  value,
  label: OBSERVATION_TYPE_LABELS[value],
}))

export function FieldObservationsSection({
  siteId,
  observations,
  isLoading,
  error,
  onRetry,
  onCreated,
}: FieldObservationsSectionProps) {
  const [typeFilter, setTypeFilter] = useState<ObservationType | ''>('')
  const { showToast } = useToast()

  const filtered = useMemo(
    () =>
      typeFilter
        ? observations.filter((observation) => observation.observation_type === typeFilter)
        : observations,
    [observations, typeFilter],
  )

  const handleSubmit = (payload: Parameters<typeof createFieldObservation>[1]) =>
    createFieldObservation(siteId, payload)

  const handleSuccess = (observation: FieldObservation) => {
    onCreated(observation)
    showToast({ variant: 'success', title: 'Observation logged' })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Field Observations</CardTitle>
      </CardHeader>

      <div className="flex flex-col gap-6">
        <ObservationForm onSubmit={handleSubmit} onSuccess={handleSuccess} />

        <div className="flex flex-col gap-3 border-t border-charcoal-100 pt-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-sm font-semibold text-charcoal-800">Recent observations</h3>
            <div className="sm:w-56">
              <Select
                label="Filter by type"
                hideLabel
                placeholder="All types"
                value={typeFilter}
                onChange={(event) => setTypeFilter(event.target.value as ObservationType | '')}
                options={TYPE_FILTER_OPTIONS}
              />
            </div>
          </div>

          {isLoading ? (
            <LoadingSpinner label="Loading observations…" />
          ) : error ? (
            <ErrorState message={error} onRetry={onRetry} />
          ) : (
            <ObservationList observations={filtered} />
          )}
        </div>
      </div>
    </Card>
  )
}
