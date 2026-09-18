import { MapPin, NotebookPen } from 'lucide-react'
import { Badge } from '../../components/ui/Badge'
import { EmptyState } from '../../components/ui/EmptyState'
import type { FieldObservation } from '../../types/observation'
import { OBSERVATION_TYPE_COLORS, OBSERVATION_TYPE_LABELS } from '../../utils/intelligenceConstants'
import { formatDate } from '../../utils/formatters'

export function ObservationList({ observations }: { observations: FieldObservation[] }) {
  if (observations.length === 0) {
    return (
      <EmptyState
        icon={NotebookPen}
        title="No field observations yet"
        description="Logged observations will show up here, and on the map above when coordinates are recorded."
      />
    )
  }

  return (
    <ul className="flex flex-col gap-2.5">
      {observations.map((observation) => {
        const color = OBSERVATION_TYPE_COLORS[observation.observation_type]
        return (
          <li
            key={observation.id}
            className="flex flex-col gap-1.5 rounded-lg border border-charcoal-100 p-3"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-charcoal-900">
                  {observation.observer_name}
                </span>
                <Badge bg={color.bg} text={color.text} dot={color.dot}>
                  {OBSERVATION_TYPE_LABELS[observation.observation_type]}
                </Badge>
              </div>
              <span className="text-xs text-charcoal-500">
                {formatDate(observation.observation_date)}
              </span>
            </div>
            <p className="text-sm text-charcoal-700">{observation.notes}</p>
            {observation.latitude !== null && observation.longitude !== null && (
              <p className="flex items-center gap-1 text-xs text-charcoal-400">
                <MapPin className="h-3 w-3" aria-hidden="true" />
                {observation.latitude.toFixed(4)}, {observation.longitude.toFixed(4)}
              </p>
            )}
          </li>
        )
      })}
    </ul>
  )
}
