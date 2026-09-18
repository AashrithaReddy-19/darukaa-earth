import { History } from 'lucide-react'
import { Badge } from '../../components/ui/Badge'
import { formatDateTime } from '../../utils/formatters'
import type { AuditLogEntry } from '../../types/audit'

export function AuditLogRow({ entry }: { entry: AuditLogEntry }) {
  return (
    <li className="flex items-start gap-3 rounded-lg border border-charcoal-100 p-3">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-charcoal-100 text-charcoal-600">
        <History className="h-4 w-4" aria-hidden="true" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-charcoal-800">{entry.summary}</p>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-charcoal-400">
          <Badge>{entry.entity_type}</Badge>
          <Badge>{entry.action_type}</Badge>
          <span>{formatDateTime(entry.created_at)}</span>
        </div>
      </div>
    </li>
  )
}
