import '../analytics/chartSetup'
import { Line } from 'react-chartjs-2'
import { ChartCard } from './ChartCard'
import { baseLineOptions, CHART_COLORS } from './chartTheme'
import type { AnalyticsRecord } from '../../types/analytics'
import { formatDate } from '../../utils/formatters'

export function BiodiversityChart({ records }: { records: AnalyticsRecord[] }) {
  const data = {
    labels: records.map((record) => formatDate(record.recorded_at)),
    datasets: [
      {
        label: 'Biodiversity score',
        data: records.map((record) => record.biodiversity_score),
        borderColor: CHART_COLORS.teal,
        backgroundColor: CHART_COLORS.tealSoft,
        fill: true,
        tension: 0.35,
        pointRadius: 2,
        pointHoverRadius: 4,
      },
    ],
  }

  return (
    <ChartCard
      title="Biodiversity score over time"
      isEmpty={records.length === 0}
      emptyMessage="No biodiversity data recorded yet."
    >
      <Line data={data} options={baseLineOptions} />
    </ChartCard>
  )
}
