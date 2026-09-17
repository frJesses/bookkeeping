import { getCategoryIconAsset } from '../constants/design'
import { ensureOpenId } from './auth'
import { get } from './request'

export type StatsReportMode = 'week' | 'month' | 'year'
export type StatsFlowMode = 'expense' | 'income'

type TrendItem = {
  key: string
  label: string
  amount: string
}

type ExpenseTrendResponse = {
  range: StatsReportMode
  type: StatsFlowMode
  currentTrend: { list: TrendItem[] }
  trend: { list: TrendItem[] }
}

type MonthCategory = {
  categoryId: string
  name: string
  icon: string | null
  iconText: string
  color: string | null
  amount: string
  ratio: number
}

type MonthRanking = {
  categoryId: string
  categoryName: string
  categoryIcon?: string | null
  categoryIconColor?: string | null
  type: StatsFlowMode
  amount: string
  title?: string
  occurredAt?: string
  remark?: string
}

type MonthDetailResponse = {
  month: string
  totalExpense: string
  totalIncome: string
  totalBalance: string
  categories: MonthCategory[]
  incomeCategories: MonthCategory[]
  rankings: MonthRanking[]
  incomeRankings: MonthRanking[]
}

type YearBillResponse = {
  year: string
  totalExpense: string
  totalIncome: string
  totalBalance: string
}

type CategoryDistributionResponse = {
  categories: MonthCategory[]
  rankings: MonthRanking[]
}

export type StatsCategory = {
  name: string
  percent: number
  value: string
  count: number
  icon: string
  color: string
  records: StatsCategoryRecord[]
  expanded?: boolean
}

export type StatsCategoryRecord = {
  title: string
  amount: string
  occurredAt: string
  remark: string
}

export type StatsBar = {
  label: string
  income: number
  expense: number
}

export type StatsPageData = {
  month: string
  monthLabel: string
  periodLabel: string
  periodDate: string
  totalIncome: string
  totalExpense: string
  totalBalance: string
  categories: StatsCategory[]
  allCategories: StatsCategory[]
  bars: StatsBar[]
  barScaleLabels: string[]
  donutGradient: string
}

const CATEGORY_COLORS = ['#01c6a6', '#ffd85a', '#ff8087', '#75a9ef', '#5bd3ef', '#a57cff']

function formatMonthLabel(month: string) {
  const [year, monthNumber] = month.split('-')
  return `${year}年${Number(monthNumber)}月`
}

function getDateForMonth(month: string) {
  const now = new Date()
  const currentMonth = `${now.getFullYear()}-${`${now.getMonth() + 1}`.padStart(2, '0')}`
  return month === currentMonth ? `${month}-${`${now.getDate()}`.padStart(2, '0')}` : `${month}-15`
}

function parseAmount(value: string) {
  const amount = Number(value || 0)
  return Number.isFinite(amount) ? amount : 0
}

function formatRecordTime(value: string) {
  const matched = value.match(/^(\d{4}-\d{2}-\d{2})[ T](\d{2}):(\d{2})/)
  if (matched) {
    return `${matched[1]} ${matched[2]}:${matched[3]}`
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value || '--'
  }
  return `${date.getFullYear()}-${`${date.getMonth() + 1}`.padStart(2, '0')}-${`${date.getDate()}`.padStart(2, '0')} ${`${date.getHours()}`.padStart(2, '0')}:${`${date.getMinutes()}`.padStart(2, '0')}`
}

function sumTrendItems(items: TrendItem[]) {
  return items.reduce((sum, item) => sum + parseAmount(item.amount), 0)
}

function mapAllCategories(detail: MonthDetailResponse, flow: StatsFlowMode) {
  const source = flow === 'income' ? detail.incomeCategories : detail.categories
  const rankings = flow === 'income' ? detail.incomeRankings : detail.rankings
  const counts = new Map<string, number>()
  const records = new Map<string, StatsCategoryRecord[]>()
  rankings.forEach((item) => {
    const key = item.categoryId || item.categoryName
    counts.set(key, (counts.get(key) || 0) + 1)
    const list = records.get(key) || []
    list.push({
      title: item.title || item.categoryName || '未分类',
      amount: Number(item.amount || 0).toFixed(2),
      occurredAt: formatRecordTime(item.occurredAt || ''),
      remark: item.remark || '',
    })
    records.set(key, list)
  })
  return source.map((item, index) => ({
    name: item.name || '未分类',
    percent: Number(item.ratio || 0),
    value: Number(item.amount || 0).toFixed(2),
    count: counts.get(item.categoryId || item.name) || 0,
    icon: (item.icon || '').trim() || getCategoryIconAsset(item.name),
    color: item.color || CATEGORY_COLORS[index % CATEGORY_COLORS.length],
    records: records.get(item.categoryId || item.name) || [],
  }))
}

function mapCategories(detail: MonthDetailResponse, flow: StatsFlowMode) {
  const mapped = mapAllCategories(detail, flow)
  if (mapped.length <= 5) {
    return mapped
  }
  const visible = mapped.slice(0, 5)
  const rest = mapped.slice(5)
  return [
    ...visible,
    {
      name: '其他',
      percent: Number(rest.reduce((sum, item) => sum + item.percent, 0).toFixed(2)),
      value: rest.reduce((sum, item) => sum + parseAmount(item.value), 0).toFixed(2),
      count: rest.reduce((sum, item) => sum + item.count, 0),
      icon: getCategoryIconAsset('日用'),
      color: '#5bd3ef',
      records: rest.reduce((all, item) => all.concat(item.records), [] as StatsCategoryRecord[]),
    },
  ]
}

function formatAxisAmount(value: number) {
  if (value >= 10000) {
    return `${(value / 10000).toFixed(value >= 100000 ? 0 : 1)}万`
  }
  return value.toFixed(0)
}

function mapBars(expenseTrend: ExpenseTrendResponse, incomeTrend: ExpenseTrendResponse) {
  const expenseItems = expenseTrend.trend && Array.isArray(expenseTrend.trend.list) ? expenseTrend.trend.list : []
  const incomeItems = incomeTrend.trend && Array.isArray(incomeTrend.trend.list) ? incomeTrend.trend.list : []
  const incomeByKey = new Map(incomeItems.map((item) => [item.key, item]))
  const maxAmount = Math.max(
    1,
    ...expenseItems.map((item) => parseAmount(item.amount)),
    ...incomeItems.map((item) => parseAmount(item.amount)),
  )
  const bars = expenseItems.map((item) => {
    const incomeItem = incomeByKey.get(item.key)
    return {
      label: item.label,
      income: Math.round((parseAmount(incomeItem ? incomeItem.amount : '0') / maxAmount) * 100),
      expense: Math.round((parseAmount(item.amount) / maxAmount) * 100),
    }
  })
  return {
    bars,
    scaleLabels: [formatAxisAmount(maxAmount), formatAxisAmount(maxAmount / 2), '0'],
  }
}

function createDonutGradient(categories: StatsCategory[]) {
  if (!categories.length) {
    return '#e9eeee 0 100%'
  }
  let start = 0
  return categories
    .map((item) => {
      const end = start + item.percent
      const segment = `${item.color} ${start}% ${end}%`
      start = end
      return segment
    })
    .join(', ')
}

export async function getStatsPageData(
  month: string,
  report: StatsReportMode,
  flow: StatsFlowMode,
  periodDate = '',
): Promise<StatsPageData> {
  const openId = await ensureOpenId()
  const [detail, trendExpense, trendIncome, distribution] = await Promise.all([
    get<MonthDetailResponse>(
      '/frontend/bookkeeping/transaction/month-bill/detail',
      {
        openId,
        month,
      },
      { skipToken: true },
    ),
    get<ExpenseTrendResponse>(
      '/frontend/bookkeeping/transaction/expense-trend',
      {
        openId,
        range: report,
        type: 'expense',
        date: periodDate || getDateForMonth(month),
      },
      { skipToken: true },
    ),
    get<ExpenseTrendResponse>(
      '/frontend/bookkeeping/transaction/expense-trend',
      {
        openId,
        range: report,
        type: 'income',
        date: periodDate || getDateForMonth(month),
      },
      { skipToken: true },
    ),
    get<CategoryDistributionResponse>(
      '/frontend/bookkeeping/transaction/category-distribution',
      {
        openId,
        range: report,
        type: flow,
        date: periodDate || getDateForMonth(month),
      },
      { skipToken: true },
    ),
  ])
  const yearSummary =
    report === 'year'
      ? await get<YearBillResponse>(
          '/frontend/bookkeeping/transaction/year-bill',
          {
            openId,
            year: (periodDate || month).slice(0, 4),
          },
          { skipToken: true },
        )
      : null
  const periodDetail =
    flow === 'expense'
      ? { ...detail, categories: distribution.categories, rankings: distribution.rankings }
      : { ...detail, incomeCategories: distribution.categories, incomeRankings: distribution.rankings }
  const categories = mapCategories(periodDetail, flow)
  const allCategories = mapAllCategories(periodDetail, flow)
  const periodExpense =
    report === 'week'
      ? sumTrendItems(trendExpense.currentTrend.list)
      : yearSummary
        ? parseAmount(yearSummary.totalExpense)
        : parseAmount(detail.totalExpense)
  const periodIncome =
    report === 'week'
      ? sumTrendItems(trendIncome.currentTrend.list)
      : yearSummary
        ? parseAmount(yearSummary.totalIncome)
        : parseAmount(detail.totalIncome)
  const barData = mapBars(trendExpense, trendIncome)
  return {
    month: detail.month,
    monthLabel: formatMonthLabel(detail.month),
    periodLabel: formatMonthLabel(detail.month),
    periodDate: periodDate || getDateForMonth(detail.month),
    totalIncome: periodIncome.toFixed(2),
    totalExpense: periodExpense.toFixed(2),
    totalBalance: (periodIncome - periodExpense).toFixed(2),
    categories,
    allCategories,
    bars: barData.bars,
    barScaleLabels: barData.scaleLabels,
    donutGradient: createDonutGradient(categories),
  }
}
