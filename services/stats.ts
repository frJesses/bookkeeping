import {
  REPORT_OPTIONS,
  type BarPoint,
  type FlowType,
  type LineChartData,
  type MetricsItem,
  type ReportType,
} from '../constants/stats'

export type StatsPageState = {
  reportOptions: typeof REPORT_OPTIONS
  activeReport: ReportType
  activeFlow: FlowType
  dateRange: string
  metrics: MetricsItem[]
  lineChartData: LineChartData
  lineChartOpts: Record<string, unknown>
  barPoints: BarPoint[]
  hasActiveBarPoint: boolean
  barTooltipLabel: string
  lineAxisLabels: string[]
  barAxisLabels: string[]
  trendTitle: string
  lineCardTitle: string
}

function buildLineChartData(flow: FlowType): LineChartData {
  return {
    categories: [],
    series: [
      {
        name: flow === 'expense' ? '支出' : '收入',
        data: [],
        color: flow === 'expense' ? '#3a78ff' : '#33b18a',
      },
    ],
  }
}

function buildLineChartOpts(flow: FlowType) {
  const lineColor = flow === 'expense' ? '#3a78ff' : '#33b18a'
  return {
    color: [lineColor],
    padding: [18, 12, 6, 6],
    enableScroll: false,
    animation: true,
    fontSize: 11,
    dataLabel: false,
    dataPointShape: true,
    dataPointShapeType: 'hollow',
    legend: { show: false },
    xAxis: {
      disableGrid: true,
      fontColor: '#98a1b2',
      fontSize: 10,
      marginTop: 8,
    },
    yAxis: {
      gridColor: '#a1a9ba;',
      data: [
        {
          min: 0,
          fontColor: '#b0b7c5',
          fontSize: 9,
          axisLine: false,
          labelGap: 8,
        },
      ],
    },
  }
}

export async function getStatsPageState(
  report: ReportType,
  flow: FlowType
): Promise<Omit<StatsPageState, 'reportOptions' | 'activeReport' | 'activeFlow'>> {
  return {
    dateRange: '',
    metrics: [],
    lineChartData: buildLineChartData(flow),
    lineChartOpts: buildLineChartOpts(flow),
    barPoints: [],
    hasActiveBarPoint: false,
    barTooltipLabel: '',
    lineAxisLabels: [],
    barAxisLabels: [],
    trendTitle: flow === 'expense' ? '支出趋势' : '收入趋势',
    lineCardTitle: report === 'week' ? '本周趋势' : report === 'month' ? '本月趋势' : '本年趋势',
  }
}

export function createInitialStatsPageData(): StatsPageState {
  const activeReport: ReportType = 'month'
  const activeFlow: FlowType = 'expense'
  return {
    reportOptions: REPORT_OPTIONS,
    activeReport,
    activeFlow,
    dateRange: '',
    metrics: [],
    lineChartData: buildLineChartData(activeFlow),
    lineChartOpts: buildLineChartOpts(activeFlow),
    barPoints: [],
    hasActiveBarPoint: false,
    barTooltipLabel: '',
    lineAxisLabels: [],
    barAxisLabels: [],
    trendTitle: '支出趋势',
    lineCardTitle: '本月趋势',
  }
}

export function setActiveBarPoint(points: BarPoint[], pointIndex: number) {
  const barPoints = points.map((point, currentIndex) => ({
    ...point,
    active: currentIndex === pointIndex,
  }))
  const activeBarPoint = barPoints.find((point) => point.active)

  return {
    barPoints,
    hasActiveBarPoint: Boolean(activeBarPoint),
    barTooltipLabel: activeBarPoint ? activeBarPoint.label : '',
  }
}
