import { FlaskConical } from 'lucide-react'

/**
 * Mirrors `src/features/analytics/DemoDataBadge.tsx`'s visual language. Shown wherever a
 * score, alert, timeline-summary or other value from docs/FEATURE_CONTRACT_V2.md is displayed:
 * every one of those values is deterministic, rule-based, and computed from existing seeded
 * analytics — never a trained ML model or a real sensor/satellite feed.
 */
export function DemoIntelligenceBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-sand-300 bg-sand-50 px-2.5 py-1 text-[11px] font-semibold text-sand-500">
      <FlaskConical className="h-3 w-3" aria-hidden="true" />
      Demo intelligence data
    </span>
  )
}
