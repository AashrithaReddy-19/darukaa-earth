import { forwardRef, useId } from 'react'
import type { InputHTMLAttributes } from 'react'
import clsx from 'clsx'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  hint?: string
  hideLabel?: boolean
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, hideLabel = false, className, id, ...rest },
  ref,
) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const errorId = `${inputId}-error`
  const hintId = `${inputId}-hint`

  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={inputId}
        className={clsx('text-sm font-medium text-charcoal-700', hideLabel && 'sr-only')}
      >
        {label}
      </label>
      <input
        ref={ref}
        id={inputId}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : hint ? hintId : undefined}
        className={clsx(
          'h-10 w-full rounded-lg border bg-white px-3 text-sm text-charcoal-900 placeholder:text-charcoal-400',
          'transition-colors focus:outline-none focus:ring-2 focus:ring-offset-0',
          error
            ? 'border-terracotta-400 focus:border-terracotta-500 focus:ring-terracotta-200'
            : 'border-charcoal-200 focus:border-forest-500 focus:ring-forest-200',
          rest.disabled && 'cursor-not-allowed bg-charcoal-50 text-charcoal-400',
          className,
        )}
        {...rest}
      />
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
