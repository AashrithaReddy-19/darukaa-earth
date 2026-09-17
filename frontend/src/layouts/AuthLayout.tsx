import type { ReactNode } from 'react'
import { Leaf } from 'lucide-react'

export function AuthLayout({
  children,
  title,
  subtitle,
}: {
  children: ReactNode
  title: string
  subtitle: string
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-forest-950 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-forest-500/20 text-forest-300">
            <Leaf className="h-6 w-6" aria-hidden="true" />
          </div>
          <h1 className="text-xl font-bold text-white">Darukaa.Earth</h1>
          <p className="mt-1 text-sm text-forest-200">Nature Intelligence Dashboard</p>
        </div>
        <div className="rounded-2xl border border-forest-800 bg-white p-8 shadow-card-hover">
          <h2 className="text-lg font-semibold text-charcoal-900">{title}</h2>
          <p className="mt-1 text-sm text-charcoal-500">{subtitle}</p>
          <div className="mt-6">{children}</div>
        </div>
      </div>
    </div>
  )
}
