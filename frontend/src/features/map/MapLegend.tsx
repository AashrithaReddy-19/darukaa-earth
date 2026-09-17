interface LegendItem {
  label: string
  color: string
}

export function MapLegend({ title, items }: { title: string; items: LegendItem[] }) {
  if (items.length === 0) return null
  return (
    <div className="absolute bottom-3 left-3 z-10 rounded-lg border border-charcoal-200 bg-white/95 px-3 py-2.5 shadow-card backdrop-blur">
      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-charcoal-500">
        {title}
      </p>
      <ul className="flex flex-col gap-1">
        {items.map((item) => (
          <li key={item.label} className="flex items-center gap-2 text-xs text-charcoal-700">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: item.color }}
              aria-hidden="true"
            />
            {item.label}
          </li>
        ))}
      </ul>
    </div>
  )
}
