import type { ReactNode } from 'react'
import clsx from 'clsx'

interface BadgeProps {
  children: ReactNode
  bg?: string
  text?: string
  dot?: string
  className?: string
}

/** Generic pill badge. Pass Tailwind bg/text classes and an optional dot color for enum-driven styling. */
export function Badge({
  children,
  bg = 'bg-charcoal-100',
  text = 'text-charcoal-700',
  dot,
  className,
}: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold leading-none',
        bg,
        text,
        className,
      )}
    >
      {dot && (
        <span
          className="h-1.5 w-1.5 rounded-full"
          style={{ backgroundColor: dot }}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  )
}
