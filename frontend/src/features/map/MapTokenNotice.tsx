import { MapPinOff } from 'lucide-react'

export function MapTokenNotice({ className = 'h-[360px]' }: { className?: string }) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-charcoal-200 bg-charcoal-50 px-6 text-center ${className}`}
    >
      <MapPinOff className="h-8 w-8 text-charcoal-400" aria-hidden="true" />
      <p className="text-sm font-semibold text-charcoal-700">Mapbox token not configured</p>
      <p className="max-w-sm text-xs text-charcoal-500">
        Set <code className="rounded bg-charcoal-100 px-1 py-0.5">VITE_MAPBOX_TOKEN</code> in your{' '}
        <code className="rounded bg-charcoal-100 px-1 py-0.5">.env</code> file to enable maps.
      </p>
    </div>
  )
}

export function MapErrorNotice({
  message,
  className = 'h-[360px]',
}: {
  message: string
  className?: string
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-terracotta-200 bg-terracotta-50 px-6 text-center ${className}`}
    >
      <MapPinOff className="h-8 w-8 text-terracotta-400" aria-hidden="true" />
      <p className="text-sm font-semibold text-terracotta-700">Map failed to load</p>
      <p className="max-w-sm text-xs text-terracotta-600">{message}</p>
    </div>
  )
}
