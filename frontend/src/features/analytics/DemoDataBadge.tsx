import { FlaskConical } from 'lucide-react'

/** Judging note: analytics values shown below are seeded demonstration data, not live sensor feeds. */
export function DemoDataBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-sand-300 bg-sand-50 px-2.5 py-1 text-[11px] font-semibold text-sand-500">
      <FlaskConical className="h-3 w-3" aria-hidden="true" />
      Demo monitoring data
    </span>
  )
}
