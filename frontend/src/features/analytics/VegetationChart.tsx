import '../analytics/chartSetup'
import { Line } from 'react-chartjs-2'
import { ChartCard } from './ChartCard'
import { baseLineOptions, CHART_COLORS } from './chartTheme'
import type { AnalyticsRecord } from '../../types/analytics'
import { formatDate } from '../../utils/formatters'

export function VegetationChart({ records }: { records: AnalyticsRecord[] }) {
  const data = {
    labels: records.map((record) => formatDate(record.recorded_at)),
    datasets: [
      {
        label: 'Vegetation cover (%)',
        data: records.map((record) => record.vegetation_cover_percent),
        borderColor: CHART_COLORS.sand,
        backgroundColor: 'rgba(185, 156, 92, 0.18)',
        fill: true,
        tension: 0.35,
        pointRadius: 2,
        pointHoverRadius: 4,
      },
    ],
  }

  return (
    <ChartCard
      title="Vegetation cover over time"
      isEmpty={records.length === 0}
      emptyMessage="No vegetation cover data recorded yet."
    >
      <Line data={data} options={baseLineOptions} />
    </ChartCard>
  )
}
