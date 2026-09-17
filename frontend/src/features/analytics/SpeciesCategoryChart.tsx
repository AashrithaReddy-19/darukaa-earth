import '../analytics/chartSetup'
import { Bar } from 'react-chartjs-2'
import { ChartCard } from './ChartCard'
import { baseBarOptions } from './chartTheme'
import { OBSERVATION_CATEGORIES } from '../../types/enums'
import type { SpeciesByCategory } from '../../types/analytics'
import { OBSERVATION_CATEGORY_COLORS, OBSERVATION_CATEGORY_LABELS } from '../../utils/constants'

export function SpeciesCategoryChart({ byCategory }: { byCategory: SpeciesByCategory }) {
  const entries = OBSERVATION_CATEGORIES.map((category) => ({
    category,
    count: byCategory[category] ?? 0,
  }))
  const hasData = entries.some((entry) => entry.count > 0)

  const data = {
    labels: entries.map((entry) => OBSERVATION_CATEGORY_LABELS[entry.category]),
    datasets: [
      {
        label: 'Observations',
        data: entries.map((entry) => entry.count),
        backgroundColor: entries.map((entry) => OBSERVATION_CATEGORY_COLORS[entry.category]),
        borderRadius: 6,
        maxBarThickness: 40,
      },
    ],
  }

  return (
    <ChartCard
      title="Species observations by category"
      isEmpty={!hasData}
      emptyMessage="No species observations recorded yet."
    >
      <Bar data={data} options={baseBarOptions} />
    </ChartCard>
  )
}
