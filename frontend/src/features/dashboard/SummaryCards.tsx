import type { LucideIcon } from 'lucide-react'
import { Leaf, MapPin, Sprout, Bird, Gauge, TreeDeciduous } from 'lucide-react'
import { Card } from '../../components/ui/Card'
import { SkeletonCard } from '../../components/ui/Skeleton'
import type { DashboardSummary } from '../../types/dashboard'
import { formatCarbon, formatHectares, formatNumber, formatScore } from '../../utils/formatters'

interface SummaryCardDef {
  key: string
  label: string
  icon: LucideIcon
  value: (summary: DashboardSummary) => string
  accent: string
}

const CARD_DEFS: SummaryCardDef[] = [
  {
    key: 'projects',
    label: 'Total projects',
    icon: TreeDeciduous,
    value: (s) => formatNumber(s.total_projects),
    accent: 'bg-forest-100 text-forest-700',
  },
  {
    key: 'sites',
    label: 'Active sites',
    icon: MapPin,
    value: (s) => formatNumber(s.total_active_sites),
    accent: 'bg-teal-100 text-teal-700',
  },
  {
    key: 'area',
    label: 'Monitored area',
    icon: Sprout,
    value: (s) => formatHectares(s.total_area_hectares),
    accent: 'bg-forest-100 text-forest-700',
  },
  {
    key: 'carbon',
    label: 'Carbon captured',
    icon: Leaf,
    value: (s) => formatCarbon(s.total_carbon_tco2e),
    accent: 'bg-forest-100 text-forest-700',
  },
  {
    key: 'biodiversity',
    label: 'Avg biodiversity score',
    icon: Gauge,
    value: (s) => formatScore(s.avg_biodiversity_score),
    accent: 'bg-teal-100 text-teal-700',
  },
  {
    key: 'species',
    label: 'Species observed',
    icon: Bird,
    value: (s) => formatNumber(s.total_species_observed),
    accent: 'bg-sand-100 text-sand-500',
  },
]

export function SummaryCards({
  summary,
  isLoading,
}: {
  summary: DashboardSummary | null
  isLoading: boolean
}) {
  if (isLoading || !summary) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
        {CARD_DEFS.map((def) => (
          <SkeletonCard key={def.key} />
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
      {CARD_DEFS.map((def) => (
        <Card key={def.key} padded className="flex flex-col gap-2">
          <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${def.accent}`}>
            <def.icon className="h-[18px] w-[18px]" aria-hidden="true" />
          </div>
          <p className="text-xs font-medium text-charcoal-500">{def.label}</p>
          <p className="text-2xl font-bold tracking-tight text-charcoal-900">
            {def.value(summary)}
          </p>
        </Card>
      ))}
    </div>
  )
}
