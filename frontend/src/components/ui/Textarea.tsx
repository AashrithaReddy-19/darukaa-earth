import { forwardRef, useId } from 'react'
import type { TextareaHTMLAttributes } from 'react'
import clsx from 'clsx'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
  error?: string
  hint?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, error, hint, className, id, rows = 4, ...rest },
  ref,
) {
  const generatedId = useId()
  const textareaId = id ?? generatedId
  const errorId = `${textareaId}-error`
  const hintId = `${textareaId}-hint`

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={textareaId} className="text-sm font-medium text-charcoal-700">
        {label}
      </label>
      <textarea
        ref={ref}
        id={textareaId}
        rows={rows}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : hint ? hintId : undefined}
        className={clsx(
          'w-full resize-y rounded-lg border bg-white px-3 py-2 text-sm text-charcoal-900 placeholder:text-charcoal-400',
          'transition-colors focus:outline-none focus:ring-2 focus:ring-offset-0',
          error
            ? 'border-terracotta-400 focus:border-terracotta-500 focus:ring-terracotta-200'
            : 'border-charcoal-200 focus:border-forest-500 focus:ring-forest-200',
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
