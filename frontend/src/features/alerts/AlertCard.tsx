import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ClipboardPlus, MapPin } from 'lucide-react'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Textarea } from '../../components/ui/Textarea'
import { useToast } from '../../components/system/ToastContext'
import { patchAlert } from '../../api/alerts'
import {
  ALERT_SEVERITY_COLORS,
  ALERT_SEVERITY_LABELS,
  ALERT_STATUS_COLORS,
  ALERT_STATUS_LABELS,
} from '../../utils/intelligenceConstants'
import { getErrorMessage } from '../../utils/errors'
import { formatDateTime } from '../../utils/formatters'
import { CreateActionModal } from '../actions/CreateActionModal'
import type { Alert } from '../../types/alert'

interface AlertCardProps {
  alert: Alert
  onUpdated: (alert: Alert) => void
}

export function AlertCard({ alert, onUpdated }: AlertCardProps) {
  const { showToast } = useToast()
  const [reviewerNote, setReviewerNote] = useState(alert.reviewer_note ?? '')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isActionModalOpen, setIsActionModalOpen] = useState(false)

  const severityColor = ALERT_SEVERITY_COLORS[alert.severity]
  const statusColor = ALERT_STATUS_COLORS[alert.status]

  const updateStatus = async (status: Alert['status']) => {
    setIsSubmitting(true)
    try {
      const updated = await patchAlert(alert.id, {
        status,
        reviewer_note: reviewerNote.trim() ? reviewerNote.trim() : null,
      })
      onUpdated(updated)
      showToast({
        variant: 'success',
        title: status === 'acknowledged' ? 'Alert acknowledged' : 'Alert resolved',
        description: alert.title,
      })
    } catch (error) {
      showToast({
        variant: 'error',
        title: 'Could not update alert',
        description: getErrorMessage(error),
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold text-charcoal-900">{alert.title}</h3>
            <Badge bg={severityColor.bg} text={severityColor.text} dot={severityColor.dot}>
              {ALERT_SEVERITY_LABELS[alert.severity]}
            </Badge>
            <Badge bg={statusColor.bg} text={statusColor.text} dot={statusColor.dot}>
              {ALERT_STATUS_LABELS[alert.status]}
            </Badge>
          </div>
          <Link
            to={`/sites/${alert.site_id}`}
            className="mt-1 flex items-center gap-1 text-xs text-charcoal-500 hover:text-charcoal-800"
          >
            <MapPin className="h-3 w-3" aria-hidden="true" />
            {alert.site_name} · {alert.project_name}
          </Link>
        </div>
        <span className="text-xs text-charcoal-400">{formatDateTime(alert.created_at)}</span>
      </div>

      <p className="text-sm text-charcoal-700">{alert.description}</p>

      {alert.reasons.length > 0 && (
        <ul className="list-disc space-y-1 pl-5 text-sm text-charcoal-700">
          {alert.reasons.map((reason, index) => (
            // Reasons are a plain string array with no stable id in the contract; index is safe
            // since this list is re-rendered wholesale from a fresh API response, never reordered.
            <li key={index}>{reason}</li>
          ))}
        </ul>
      )}

      <div className="rounded-lg bg-charcoal-50 p-3 text-sm text-charcoal-700">
        <span className="font-semibold text-charcoal-800">Recommendation: </span>
        {alert.recommendation}
      </div>

      <Textarea
        label="Reviewer note"
        hint="Optional, included when you acknowledge or resolve"
        rows={2}
        value={reviewerNote}
        onChange={(event) => setReviewerNote(event.target.value)}
      />

      <div className="flex flex-wrap items-center justify-end gap-2 border-t border-charcoal-100 pt-3">
        <Button
          variant="outline"
          size="sm"
          leftIcon={<ClipboardPlus className="h-4 w-4" aria-hidden="true" />}
          onClick={() => setIsActionModalOpen(true)}
        >
          Create action
        </Button>
        <Button
          variant="secondary"
          size="sm"
          isLoading={isSubmitting}
          disabled={alert.status !== 'open'}
          onClick={() => updateStatus('acknowledged')}
        >
          Acknowledge
        </Button>
        <Button
          size="sm"
          isLoading={isSubmitting}
          disabled={alert.status === 'resolved'}
          onClick={() => updateStatus('resolved')}
        >
          Resolve
        </Button>
      </div>

      <CreateActionModal
        isOpen={isActionModalOpen}
        onClose={() => setIsActionModalOpen(false)}
        onCreated={() => undefined}
        initialSiteId={alert.site_id}
        initialSiteName={alert.site_name}
        initialAlertId={alert.id}
      />
    </Card>
  )
}
