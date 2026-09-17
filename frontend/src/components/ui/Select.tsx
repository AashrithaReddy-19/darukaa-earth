import { forwardRef, useId } from 'react'
import type { SelectHTMLAttributes } from 'react'
import { ChevronDown } from 'lucide-react'
import clsx from 'clsx'

export interface SelectOption {
  value: string
  label: string
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  options: SelectOption[]
  error?: string
  hint?: string
  placeholder?: string
  hideLabel?: boolean
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, options, error, hint, placeholder, hideLabel = false, className, id, ...rest },
  ref,
) {
  const generatedId = useId()
  const selectId = id ?? generatedId
  const errorId = `${selectId}-error`
  const hintId = `${selectId}-hint`

  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={selectId}
        className={clsx('text-sm font-medium text-charcoal-700', hideLabel && 'sr-only')}
      >
        {label}
      </label>
      <div className="relative">
        <select
          ref={ref}
          id={selectId}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : hint ? hintId : undefined}
          className={clsx(
            'h-10 w-full appearance-none rounded-lg border bg-white px-3 pr-9 text-sm text-charcoal-900',
            'transition-colors focus:outline-none focus:ring-2 focus:ring-offset-0',
            error
              ? 'border-terracotta-400 focus:border-terracotta-500 focus:ring-terracotta-200'
              : 'border-charcoal-200 focus:border-forest-500 focus:ring-forest-200',
            rest.disabled && 'cursor-not-allowed bg-charcoal-50 text-charcoal-400',
            className,
          )}
          {...rest}
        >
          {placeholder && (
            <option value="" disabled={rest.required}>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-charcoal-400"
          aria-hidden="true"
        />
      </div>
      {hint && !error && (
        <p id={hintId} className="text-xs text-charcoal-500">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="text-xs font-medium text-terracotta-600">
          {error}
        </p>
      )}
    </div>
  )
})
