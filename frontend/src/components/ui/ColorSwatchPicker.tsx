import { Check } from 'lucide-react'
import clsx from 'clsx'

interface ColorSwatchPickerProps {
  label: string
  value: string
  onChange: (color: string) => void
  error?: string
}

// A curated palette of marker colors that stay legible on both the map and status badges.
// eslint-disable-next-line react-refresh/only-export-components -- small constant lives with its only consumer
export const PROJECT_COLOR_SWATCHES = [
  '#1b4332',
  '#276044',
  '#357a56',
  '#19776c',
  '#219586',
  '#37b3a1',
  '#b99c5c',
  '#b3402e',
  '#7c8484',
  '#2b3232',
]

export function ColorSwatchPicker({ label, value, onChange, error }: ColorSwatchPickerProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-charcoal-700">{label}</span>
      <div className="flex flex-wrap items-center gap-2" role="radiogroup" aria-label={label}>
        {PROJECT_COLOR_SWATCHES.map((swatch) => {
          const selected = swatch.toLowerCase() === value.toLowerCase()
          return (
            <button
              key={swatch}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={`Use color ${swatch}`}
              onClick={() => onChange(swatch)}
              className={clsx(
                'flex h-8 w-8 items-center justify-center rounded-full border-2 transition-transform focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest-700',
                selected ? 'scale-110 border-charcoal-900' : 'border-transparent hover:scale-105',
              )}
              style={{ backgroundColor: swatch }}
            >
              {selected && <Check className="h-4 w-4 text-white" aria-hidden="true" />}
            </button>
          )
        })}
        <label className="ml-1 flex items-center gap-2 text-xs text-charcoal-500">
          Custom
          <input
            type="color"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            aria-label="Custom project color"
            className="h-8 w-10 cursor-pointer rounded border border-charcoal-200 bg-white p-0.5"
          />
        </label>
      </div>
      {error && (
        <p role="alert" className="text-xs font-medium text-terracotta-600">
          {error}
        </p>
      )}
    </div>
  )
}
