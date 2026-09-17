import clsx from 'clsx'
import { ANALYTICS_RANGES } from '../../types/enums'
import type { AnalyticsRange } from '../../types/enums'
import { ANALYTICS_RANGE_LABELS } from '../../utils/constants'

export function DateRangeFilter({
  value,
  onChange,
}: {
  value: AnalyticsRange
  onChange: (range: AnalyticsRange) => void
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Analytics date range"
      className="inline-flex rounded-lg border border-charcoal-200 bg-white p-1"
    >
      {ANALYTICS_RANGES.map((range) => (
        <button
          key={range}
          type="button"
          role="radio"
          aria-checked={value === range}
          onClick={() => onChange(range)}
          className={clsx(
            'rounded-md px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-forest-700',
            value === range
              ? 'bg-forest-700 text-white'
              : 'text-charcoal-600 hover:bg-charcoal-100',
          )}
        >
          {ANALYTICS_RANGE_LABELS[range]}
        </button>
      ))}
    </div>
  )
}
