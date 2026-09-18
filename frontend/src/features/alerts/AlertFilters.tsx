import { Select } from '../../components/ui/Select'
import { ALERT_SEVERITIES, ALERT_STATUSES } from '../../types/enumsV2'
import type { AlertSeverity, AlertStatus } from '../../types/enumsV2'
import { ALERT_SEVERITY_LABELS, ALERT_STATUS_LABELS } from '../../utils/intelligenceConstants'

interface AlertFiltersProps {
  severity: AlertSeverity | ''
  onSeverityChange: (value: AlertSeverity | '') => void
  status: AlertStatus | ''
  onStatusChange: (value: AlertStatus | '') => void
}

export function AlertFilters({
  severity,
  onSeverityChange,
  status,
  onStatusChange,
}: AlertFiltersProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="sm:w-56">
        <Select
          label="Severity"
          placeholder="All severities"
          value={severity}
          onChange={(event) => onSeverityChange(event.target.value as AlertSeverity | '')}
          options={ALERT_SEVERITIES.map((value) => ({
            value,
            label: ALERT_SEVERITY_LABELS[value],
          }))}
        />
      </div>
      <div className="sm:w-56">
        <Select
          label="Status"
          placeholder="All statuses"
          value={status}
          onChange={(event) => onStatusChange(event.target.value as AlertStatus | '')}
          options={ALERT_STATUSES.map((value) => ({ value, label: ALERT_STATUS_LABELS[value] }))}
        />
      </div>
    </div>
  )
}
