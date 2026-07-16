import {
  REPORT_OPTIONS,
  type BarPoint,
  type FlowType,
  type LineChartData,
  type MetricsItem,
  type ReportType,
} from '../constants/stats'
import { ensureOpenId } from './auth'
import { get } from './request'
export type StatsPageState = {
  reportOptions: typeof REPORT_OPTIONS
  activeReport: ReportType
  activeFlow: FlowType
  dateRange: string
  selectedPeriodValue: string
  selectedPeriodIndex: number
  periodOptions: StatsPeriodOption[]
  periodPickerTitle: string
  showPeriodPicker: boolean
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
export type StatsPeriodOption = {
  label: string
  value: string
}
type ExpenseTrendPointDTO = {
  key: string
  label: string
  amount: string
}
type ExpenseTrendBlockDTO = {
  range: string
  unit: 'day' | 'week' | 'month' | 'year'
  startDate: string
  endDate: string
  list: ExpenseTrendPointDTO[]
}
type ExpenseTrendDTO = {
  range: ReportType
  type: FlowType
  date: string
  totalAmount: string
  averageAmount: string
  compareLabel: string
  compareAmount: string
  previousAmount: string
  currentTrend?: ExpenseTrendBlockDTO
  trend?: ExpenseTrendBlockDTO
}
const METRIC_ICONS = {
  total: '/assets/common/icon_total_expense.png',
  average: '/assets/common/icon_daily_expense.png',
  compare: '/assets/common/icon_weekly_expense.png',
  balance: '/assets/common/icon_balance.png',
} as const
function getFlowTrendColor(flow: FlowType) {
  return flow === 'expense' ? '#2f6bff' : '#33b18a'
}
function formatCurrency(value: number) {
  return `¥ ${value.toFixed(2)}`
}
function formatCompactCurrency(value: number) {
  if (value >= 10000) {
    return `¥ ${(value / 10000).toFixed(1)}万`
  }
  return `¥ ${Math.round(value)}`
}
function formatCompactAmount(value: number) {
  if (value >= 10000) {
    return `${(value / 10000).toFixed(1)}万`
  }
  return `${Math.round(value)}`
}
function parseAmount(value: string) {
  const amount = Number(value || 0)
  return Number.isNaN(amount) ? 0 : amount
}
function formatApiPointLabel(label: string, report: ReportType) {
  if (report === 'month') {
    const day = Number(label.split('.')[1] || label)
    if (!Number.isNaN(day) && day > 0) {
      return day === 1 || (day - 1) % 5 === 0 ? `${day}日` : ''
    }
  }
  return label
}
function createMetricsFromTrend(data: ExpenseTrendDTO | undefined, report: ReportType, flow: FlowType): MetricsItem[] {
  const total = parseAmount(data ? data.totalAmount : '')
  const average = parseAmount(data ? data.averageAmount : '')
  const compareAmount = parseAmount(data ? data.compareAmount : '')
  const previousAmount = parseAmount(data ? data.previousAmount : '')
  const flowText = flow === 'expense' ? '支出' : '收入'
  const compareLabel = data && data.compareLabel ? data.compareLabel : report === 'week' ? '比上周' : report === 'year' ? '比去年' : '比上月'
  return [
    { label: `总${flowText}`, value: formatCurrency(total), accent: 'blue', icon: METRIC_ICONS.total },
    { label: report === 'year' ? `月均${flowText}` : `日均${flowText}`, value: formatCurrency(average), accent: 'orange', icon: METRIC_ICONS.average },
    { label: `${compareLabel}${flowText}(元)`, value: formatCurrency(compareAmount), accent: 'blue', icon: METRIC_ICONS.compare },
    { label: '收支结余(元)', value: formatCurrency(previousAmount), accent: 'orange', icon: METRIC_ICONS.balance },
  ]
}
function createLineChartDataFromBlock(block: ExpenseTrendBlockDTO | undefined, report: ReportType, flow: FlowType): LineChartData {
  const list = block && Array.isArray(block.list) ? block.list : []
  return {
    categories: list.map((item) => formatApiPointLabel(item.label, report)),
    series: [
      {
        name: flow === 'expense' ? '支出' : '收入',
        data: list.map((item) => parseAmount(item.amount)),
        color: getFlowTrendColor(flow),
      },
    ],
  }
}
function createBarPointsFromBlock(block: ExpenseTrendBlockDTO | undefined, activeLabel = ''): BarPoint[] {
  const list = block && Array.isArray(block.list) ? block.list : []
  const values = list.map((item) => parseAmount(item.amount))
  const max = Math.max(...values, 1)
  return list.map((item, index) => {
    const value = values[index]
    return {
      label: activeLabel && index === list.length - 1 ? activeLabel : item.label,
      value,
      height: Math.max(18, Math.round((value / max) * 188)),
      active: false,
    }
  })
}
function createBarAxisLabelsFromBlock(block: ExpenseTrendBlockDTO | undefined) {
  const list = block && Array.isArray(block.list) ? block.list : []
  const values = list.map((item) => parseAmount(item.amount))
  const max = Math.max(...values, 1)
  return [formatCompactAmount(max), formatCompactAmount(max / 2), '0']
}
function createEmptyStatsData(flow: FlowType) {
  return {
    metrics: [
      { label: flow === 'expense' ? '总支出' : '总收入', value: '¥ 0.00', accent: 'blue' as const, icon: METRIC_ICONS.total },
      { label: flow === 'expense' ? '日均支出' : '日均收入', value: '¥ 0.00', accent: 'orange' as const, icon: METRIC_ICONS.average },
      { label: flow === 'expense' ? '比上周支出(元)' : '比上周收入(元)', value: '¥ 0.00', accent: 'blue' as const, icon: METRIC_ICONS.compare },
      { label: '收支结余(元)', value: '0项', accent: 'orange' as const, icon: METRIC_ICONS.balance },
    ],
    lineChartData: {
      categories: [],
      series: [
        {
          name: flow === 'expense' ? '支出' : '收入',
          data: [],
          color: getFlowTrendColor(flow),
        },
      ],
    },
    barPoints: [],
    hasActiveBarPoint: false,
    barTooltipLabel: '',
    lineAxisLabels: [],
    barAxisLabels: ['0', '0', '0'],
  }
}
function createStatsDataFromTrend(report: ReportType, flow: FlowType, data: ExpenseTrendDTO | undefined) {
  const lineBlock = data ? data.currentTrend : undefined
  const barBlock = data ? data.trend : undefined
  const barPoints = createBarPointsFromBlock(barBlock)
  return {
    metrics: data ? createMetricsFromTrend(data, report, flow) : createEmptyStatsData(flow).metrics,
    lineChartData: createLineChartDataFromBlock(lineBlock, report, flow),
    barPoints,
    hasActiveBarPoint: false,
    barTooltipLabel: '',
    lineAxisLabels: [],
    barAxisLabels: createBarAxisLabelsFromBlock(barBlock),
  }
}
function buildLineChartOpts(flow: FlowType) {
  const lineColor = getFlowTrendColor(flow)
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
      fontColor: '#8f9db4',
      fontSize: 10,
      marginTop: 8,
    },
    yAxis: {
      gridType: 'dash',
      dashLength: 2,
      gridColor: '#e4eaf4',
      splitNumber: 4,
      data: [
        {
          min: 0,
          fontColor: '#8f9db4',
          fontSize: 9,
          axisLine: false,
          labelGap: 8,
        },
      ],
    },
    extra: {
      line: {
        type: 'straight',
        width: 2,
        activeType: 'hollow',
      },
    },
  }
}
function padNumber(value: number) {
  return `${value}`.padStart(2, '0')
}
function formatDateValue(date: Date) {
  return `${date.getFullYear()}-${padNumber(date.getMonth() + 1)}-${padNumber(date.getDate())}`
}
function formatWeekDate(date: Date, includeYear = true) {
  const month = padNumber(date.getMonth() + 1)
  const day = padNumber(date.getDate())
  if (!includeYear) {
    return `${month}.${day}`
  }
  return `${date.getFullYear()}.${month}.${day}`
}
function getWeekStartDate(date: Date) {
  const currentDay = date.getDay() || 7
  const startDate = new Date(date)
  startDate.setDate(date.getDate() - currentDay + 1)
  startDate.setHours(0, 0, 0, 0)
  return startDate
}
function formatWeekRangeLabel(startDate: Date) {
  const endDate = new Date(startDate)
  endDate.setDate(startDate.getDate() + 6)
  const includeEndYear = startDate.getFullYear() !== endDate.getFullYear()
  return `${formatWeekDate(startDate)}～${formatWeekDate(endDate, includeEndYear)}`
}
function getCurrentWeekRangeLabel() {
  return formatWeekRangeLabel(getWeekStartDate(new Date()))
}
function formatMonthLabel(date: Date) {
  return `${date.getFullYear()}年${padNumber(date.getMonth() + 1)}月`
}
function formatYearLabel(date: Date) {
  return `${date.getFullYear()}年`
}
function getCurrentDateRangeLabel(report: ReportType) {
  if (report === 'week') {
    return getCurrentWeekRangeLabel()
  }
  if (report === 'year') {
    return formatYearLabel(new Date())
  }
  return formatMonthLabel(new Date())
}
function parseDateValue(value: string) {
  const matched = value.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!matched) {
    return new Date()
  }
  return new Date(Number(matched[1]), Number(matched[2]) - 1, Number(matched[3]))
}
function parseMonthValue(value: string) {
  const matched = value.match(/^(\d{4})-(\d{2})$/)
  if (!matched) {
    const now = new Date()
    return {
      year: now.getFullYear(),
      month: now.getMonth() + 1,
    }
  }
  return {
    year: Number(matched[1]),
    month: Number(matched[2]),
  }
}
function parseYearValue(value: string) {
  const year = Number(value)
  return Number.isNaN(year) ? new Date().getFullYear() : year
}
function isCurrentMonthValue(year: number, month: number) {
  const now = new Date()
  return year === now.getFullYear() && month === now.getMonth() + 1
}
function isCurrentYearValue(year: number) {
  return year === new Date().getFullYear()
}
function getPeriodPickerTitle(report: ReportType) {
  if (report === 'week') {
    return '选择周报'
  }
  if (report === 'year') {
    return '选择年报'
  }
  return '选择月报'
}
function createWeekOptions(total = 52): StatsPeriodOption[] {
  const currentWeekStart = getWeekStartDate(new Date())
  return Array.from({ length: total }, (_, index) => {
    const startDate = new Date(currentWeekStart)
    startDate.setDate(currentWeekStart.getDate() - index * 7)
    return {
      label: formatWeekRangeLabel(startDate),
      value: formatDateValue(startDate),
    }
  })
}
function createMonthOptions(total = 24): StatsPeriodOption[] {
  const now = new Date()
  return Array.from({ length: total }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - index, 1)
    return {
      label: formatMonthLabel(date),
      value: `${date.getFullYear()}-${padNumber(date.getMonth() + 1)}`,
    }
  })
}
function createYearOptions(total = 10): StatsPeriodOption[] {
  const currentYear = new Date().getFullYear()
  return Array.from({ length: total }, (_, index) => {
    const year = currentYear - index
    return {
      label: `${year}年`,
      value: `${year}`,
    }
  })
}
function createPeriodOptions(report: ReportType) {
  if (report === 'week') {
    return createWeekOptions()
  }
  if (report === 'year') {
    return createYearOptions()
  }
  return createMonthOptions()
}
function resolveSelectedPeriod(report: ReportType, selectedValue = '') {
  const periodOptions = createPeriodOptions(report)
  const matchedIndex = periodOptions.findIndex((item) => item.value === selectedValue)
  const selectedPeriodIndex = matchedIndex >= 0 ? matchedIndex : 0
  const selectedPeriod = periodOptions[selectedPeriodIndex]
  return {
    periodOptions,
    selectedPeriodIndex,
    selectedPeriodValue: selectedPeriod ? selectedPeriod.value : '',
    dateRange: selectedPeriod ? selectedPeriod.label : getCurrentDateRangeLabel(report),
  }
}
function createTrendRequestDate(report: ReportType, selectedPeriodValue: string) {
  if (report === 'week') {
    const startDate = parseDateValue(selectedPeriodValue)
    const currentWeekStart = getWeekStartDate(new Date())
    if (formatDateValue(startDate) === formatDateValue(currentWeekStart)) {
      return formatDateValue(new Date())
    }
    const endDate = new Date(startDate)
    endDate.setDate(startDate.getDate() + 6)
    return formatDateValue(endDate)
  }
  if (report === 'year') {
    const year = parseYearValue(selectedPeriodValue)
    return isCurrentYearValue(year) ? formatDateValue(new Date()) : `${year}-12-31`
  }
  const { year, month } = parseMonthValue(selectedPeriodValue)
  if (isCurrentMonthValue(year, month)) {
    return formatDateValue(new Date())
  }
  const lastDay = new Date(year, month, 0).getDate()
  return `${year}-${padNumber(month)}-${padNumber(lastDay)}`
}
async function fetchExpenseTrend(report: ReportType, flow: FlowType, selectedPeriodValue: string) {
  const openId = await ensureOpenId()
  return get<ExpenseTrendDTO>('/frontend/bookkeeping/transaction/expense-trend', {
    openId,
    range: report,
    type: flow,
    date: createTrendRequestDate(report, selectedPeriodValue),
  }, {
    skipToken: true,
  })
}
export async function getStatsPageState(
  report: ReportType,
  flow: FlowType,
  selectedPeriodValue = ''
): Promise<Omit<StatsPageState, 'reportOptions' | 'activeReport' | 'activeFlow'>> {
  const periodState = resolveSelectedPeriod(report, selectedPeriodValue)
  let trendData: ExpenseTrendDTO | undefined
  try {
    trendData = await fetchExpenseTrend(report, flow, periodState.selectedPeriodValue)
  } catch (error) {
    console.error('get expense trend failed', error)
  }
  const statsData = createStatsDataFromTrend(report, flow, trendData)
  return {
    ...periodState,
    periodPickerTitle: getPeriodPickerTitle(report),
    showPeriodPicker: false,
    ...statsData,
    lineChartOpts: buildLineChartOpts(flow),
    trendTitle: flow === 'expense' ? '支出趋势' : '收入趋势',
    lineCardTitle: report === 'week' ? '本周趋势' : report === 'month' ? '本月趋势' : '本年趋势',
  }
}
export function createInitialStatsPageData(): StatsPageState {
  const activeReport: ReportType = 'week'
  const activeFlow: FlowType = 'expense'
  const periodState = resolveSelectedPeriod(activeReport)
  return {
    reportOptions: REPORT_OPTIONS,
    activeReport,
    activeFlow,
    ...periodState,
    periodPickerTitle: getPeriodPickerTitle(activeReport),
    showPeriodPicker: false,
    ...createEmptyStatsData(activeFlow),
    lineChartOpts: buildLineChartOpts(activeFlow),
    trendTitle: '支出趋势',
    lineCardTitle: '本周趋势',
  }
}
export async function selectStatsPeriod(report: ReportType, flow: FlowType, periodOptions: StatsPeriodOption[], selectedIndex: number) {
  const selectedPeriodIndex = selectedIndex >= 0 && selectedIndex < periodOptions.length ? selectedIndex : 0
  const selectedPeriod = periodOptions[selectedPeriodIndex]
  const selectedPeriodValue = selectedPeriod ? selectedPeriod.value : ''
  let trendData: ExpenseTrendDTO | undefined
  try {
    trendData = await fetchExpenseTrend(report, flow, selectedPeriodValue)
  } catch (error) {
    console.error('get expense trend failed', error)
  }
  return {
    selectedPeriodIndex,
    selectedPeriodValue,
    dateRange: selectedPeriod ? selectedPeriod.label : getCurrentDateRangeLabel(report),
    ...createStatsDataFromTrend(report, flow, trendData),
    lineChartOpts: buildLineChartOpts(flow),
    showPeriodPicker: false,
  }
}
export function setActiveBarPoint(points: BarPoint[], pointIndex: number) {
  const lastIndex = points.length - 1
  const barPoints = points.map((point, currentIndex) => ({
    ...point,
    active: currentIndex === pointIndex,
    tooltipPlacement: pointIndex <= 0 ? 'right' as const : pointIndex >= lastIndex ? 'left' as const : 'center' as const,
  }))
  const activeBarPoint = barPoints.find((point) => point.active)
  return {
    barPoints,
    hasActiveBarPoint: Boolean(activeBarPoint),
    barTooltipLabel: activeBarPoint ? activeBarPoint.label : '',
  }
}
