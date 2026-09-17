import '../analytics/chartSetup'
import { Line } from 'react-chartjs-2'
import { ChartCard } from './ChartCard'
import { baseLineOptions, CHART_COLORS } from './chartTheme'
import type { AnalyticsRecord } from '../../types/analytics'
import { formatDate } from '../../utils/formatters'

export function CarbonChart({ records }: { records: AnalyticsRecord[] }) {
  const data = {
    labels: records.map((record) => formatDate(record.recorded_at)),
    datasets: [
      {
        label: 'Carbon captured (tCO₂e)',
        data: records.map((record) => record.carbon_captured_tco2e),
        borderColor: CHART_COLORS.forest,
        backgroundColor: CHART_COLORS.forestSoft,
        fill: true,
        tension: 0.35,
        pointRadius: 2,
        pointHoverRadius: 4,
      },
    ],
  }

  return (
    <ChartCard
      title="Carbon captured over time"
      isEmpty={records.length === 0}
      emptyMessage="No carbon capture data recorded yet."
    >
      <Line data={data} options={baseLineOptions} />
    </ChartCard>
  )
}
