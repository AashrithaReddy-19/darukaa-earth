import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Calendar, MapPin } from 'lucide-react'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Select } from '../../components/ui/Select'
import { useToast } from '../../components/system/ToastContext'
import { patchAction } from '../../api/actions'
import { ACTION_STATUSES } from '../../types/enumsV2'
import {
  ACTION_PRIORITY_COLORS,
  ACTION_PRIORITY_LABELS,
  ACTION_STATUS_COLORS,
  ACTION_STATUS_LABELS,
} from '../../utils/intelligenceConstants'
import { getErrorMessage } from '../../utils/errors'
import { formatDate } from '../../utils/formatters'
import type { ConservationAction } from '../../types/action'
import type { ActionStatus } from '../../types/enumsV2'

const STATUS_OPTIONS = ACTION_STATUSES.map((value) => ({
  value,
  label: ACTION_STATUS_LABELS[value],
}))

interface ActionCardProps {
  action: ConservationAction
  onUpdated: (action: ConservationAction) => void
  /** Hides the site link/name — used when the card already lives in a site-scoped list. */
  hideSite?: boolean
}

export function ActionCard({ action, onUpdated, hideSite = false }: ActionCardProps) {
  const { showToast } = useToast()
  const [isUpdating, setIsUpdating] = useState(false)
  const priorityColor = ACTION_PRIORITY_COLORS[action.priority]
  const statusColor = ACTION_STATUS_COLORS[action.status]

  const handleStatusChange = async (status: ActionStatus) => {
    if (status === action.status) return
    setIsUpdating(true)
    try {
      const updated = await patchAction(action.id, { status })
      onUpdated(updated)
      showToast({
        variant: 'success',
        title: 'Action status updated',
        description: `${action.title} is now ${ACTION_STATUS_LABELS[status]}.`,
      })
    } catch (error) {
      showToast({
        variant: 'error',
        title: 'Could not update action status',
        description: getErrorMessage(error),
      })
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-charcoal-900">{action.title}</p>
          <p className="text-xs text-charcoal-500">{action.action_category}</p>
        </div>
        <Badge bg={priorityColor.bg} text={priorityColor.text} dot={priorityColor.dot}>
          {ACTION_PRIORITY_LABELS[action.priority]}
        </Badge>
      </div>

      <p className="text-sm text-charcoal-700">{action.description}</p>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-charcoal-500">
        {!hideSite && (
          <Link
            to={`/sites/${action.site_id}`}
            className="flex items-center gap-1 hover:text-charcoal-800"
          >
            <MapPin className="h-3 w-3" aria-hidden="true" />
            {action.site_name}
          </Link>
        )}
        {action.due_date && (
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" aria-hidden="true" />
            Due {formatDate(action.due_date)}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-charcoal-100 pt-3">
        <Badge bg={statusColor.bg} text={statusColor.text} dot={statusColor.dot}>
          {ACTION_STATUS_LABELS[action.status]}
        </Badge>
        <div className="w-40">
          <Select
            label="Status"
            hideLabel
            options={STATUS_OPTIONS}
            value={action.status}
            disabled={isUpdating}
            onChange={(event) => handleStatusChange(event.target.value as ActionStatus)}
          />
        </div>
      </div>
    </Card>
  )
}
