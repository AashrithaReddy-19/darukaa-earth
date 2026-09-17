import { Loader2 } from 'lucide-react'
import clsx from 'clsx'

interface LoadingSpinnerProps {
  label?: string
  size?: 'sm' | 'md' | 'lg'
  fullHeight?: boolean
  className?: string
}

const SIZE_PX: Record<NonNullable<LoadingSpinnerProps['size']>, string> = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-9 w-9',
}

export function LoadingSpinner({
  label = 'Loading…',
  size = 'md',
  fullHeight = false,
  className,
}: LoadingSpinnerProps) {
  return (
    <div
      role="status"
      className={clsx(
        'flex items-center justify-center gap-2 text-charcoal-500',
        fullHeight && 'min-h-[240px]',
        className,
      )}
    >
      <Loader2 className={clsx('animate-spin text-forest-600', SIZE_PX[size])} aria-hidden="true" />
      <span className="text-sm">{label}</span>
    </div>
  )
}
