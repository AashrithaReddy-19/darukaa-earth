import type { ReactNode } from 'react'
import { BarChart3 } from 'lucide-react'
import { Card, CardHeader, CardTitle } from '../../components/ui/Card'
import { EmptyState } from '../../components/ui/EmptyState'

interface ChartCardProps {
  title: string
  isEmpty: boolean
  emptyMessage: string
  children: ReactNode
  headerExtra?: ReactNode
}

export function ChartCard({ title, isEmpty, emptyMessage, children, headerExtra }: ChartCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {headerExtra}
      </CardHeader>
      {isEmpty ? (
        <EmptyState icon={BarChart3} title="No data yet" description={emptyMessage} />
      ) : (
        <div className="h-64">{children}</div>
      )}
    </Card>
  )
}
