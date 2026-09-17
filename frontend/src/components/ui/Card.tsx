import type { HTMLAttributes, ReactNode } from 'react'
import clsx from 'clsx'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  padded?: boolean
  hoverable?: boolean
}

export function Card({
  children,
  padded = true,
  hoverable = false,
  className,
  ...rest
}: CardProps) {
  return (
    <div
      className={clsx(
        'rounded-xl border border-charcoal-100 bg-white shadow-card',
        hoverable && 'transition-shadow hover:shadow-card-hover',
        padded && 'p-5',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  )
}

export function CardHeader({ children, className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={clsx('mb-4 flex items-start justify-between gap-3', className)} {...rest}>
      {children}
    </div>
  )
}

export function CardTitle({ children, className, ...rest }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={clsx('text-base font-semibold text-charcoal-900', className)} {...rest}>
      {children}
    </h3>
  )
}
