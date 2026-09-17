import '../analytics/chartSetup'
import { Doughnut } from 'react-chartjs-2'
import { ChartCard } from './ChartCard'
import { baseDoughnutOptions } from './chartTheme'
import type { AnalyticsRecord } from '../../types/analytics'

// Design choice: the API doesn't return a pre-split "health breakdown", so we construct an
// illustrative composition from the three most relevant fields on the latest record —
// vegetation cover %, soil moisture %, and biodiversity score (already ~0-100) — weighted
// equally. This is a presentational breakdown of contributing signals, not a scientific formula.
export function EcosystemHealthDoughnut({ latest }: { latest: AnalyticsRecord | null }) {
  const isEmpty = !latest

  const data = {
    labels: ['Vegetation cover', 'Soil moisture', 'Biodiversity contribution'],
    datasets: [
      {
        data: latest
          ? [
              latest.vegetation_cover_percent,
              latest.soil_moisture_percent,
              latest.biodiversity_score,
            ]
          : [0, 0, 0],
        backgroundColor: ['#276044', '#37b3a1', '#b99c5c'],
        borderColor: '#ffffff',
        borderWidth: 2,
      },
    ],
  }

  return (
    <ChartCard
      title="Ecosystem health breakdown"
      isEmpty={isEmpty}
      emptyMessage="No ecosystem health data recorded yet."
    >
      <Doughnut data={data} options={baseDoughnutOptions} />
    </ChartCard>
  )
}
