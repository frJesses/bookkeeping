export type ReportType = 'week' | 'month' | 'year'
export type FlowType = 'expense' | 'income'

export type MetricsItem = {
  label: string
  value: string
  accent?: 'blue' | 'orange'
}

export type BarPoint = {
  label: string
  value: number
  height: number
  active?: boolean
}

export type LineChartData = {
  categories: string[]
  series: Array<{
    name: string
    data: number[]
    color: string
  }>
}

export type ReportOption = {
  key: ReportType
  label: string
  icon: string
}

export const REPORT_OPTIONS: ReportOption[] = [
  { key: 'week', label: '周报', icon: '/assets/stats/report-week.svg' },
  { key: 'month', label: '月报', icon: '/assets/stats/report-month.svg' },
  { key: 'year', label: '年报', icon: '/assets/stats/report-year.svg' },
]
