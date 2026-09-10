import { ensureOpenId } from './auth'
import { get } from './request'

type MonthDetailDTO = {
  month: string
  totalExpense: string
  totalIncome: string
  totalBalance: string
  previousBalance: string
  days: Array<{ date: string; expense: string; income: string; balance: string }>
  categories: Array<{
    categoryId: string
    name: string
    icon: string | null
    iconText: string
    color: string | null
    amount: string
    ratio: number
  }>
  rankings: Array<{
    id: string
    categoryId: string
    categoryName: string
    categoryIcon: string | null
    categoryIconText: string | null
    categoryIconColor: string | null
    title: string
    remark: string | null
    amount: string
    occurredAt: string
  }>
  comparisons: Array<{ month: string; expense: string }>
}

const CATEGORY_COLORS = ['#8fd12b', '#f0525b', '#f5ad1a', '#5b86e7', '#965bd9', '#b55ce8']

function getCurrentMonthKey() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

function createHeaderLayout() {
  const systemInfo = wx.getSystemInfoSync()
  const menuButton = wx.getMenuButtonBoundingClientRect()
  const statusBarHeight = systemInfo.statusBarHeight || 20
  const navBarHeight = (menuButton.top - statusBarHeight) * 2 + menuButton.height
  return {
    statusBarHeight,
    navBarHeight,
    capsuleTop: menuButton.top,
    capsuleHeight: menuButton.height,
    capsuleWidth: menuButton.width,
    capsuleRight: systemInfo.windowWidth - menuButton.right,
  }
}

function toAmount(value: string | number) {
  const amount = Number(value || 0)
  return Number.isFinite(amount) ? amount : 0
}

function formatMoney(value: string | number) {
  return toAmount(value).toFixed(2)
}

function formatSignedMoney(value: string | number) {
  const amount = toAmount(value)
  return amount < 0 ? `-¥${Math.abs(amount).toFixed(2)}` : `¥${amount.toFixed(2)}`
}

function formatRankingDateTime(value: string | null) {
  const normalized = String(value || '').trim().replace('T', ' ')
  const matched = normalized.match(/^(?:\d{4})-(\d{2})-(\d{2})[ ](\d{2}):(\d{2})/)
  if (matched) return `${matched[1]}/${matched[2]} ${matched[3]}:${matched[4]}`
  const dateOnly = normalized.match(/^(?:\d{4})-(\d{2})-(\d{2})/)
  return dateOnly ? `${dateOnly[1]}/${dateOnly[2]}` : ''
}

function createIconBackgroundColor(color: string) {
  const hex = color.replace('#', '')
  const normalized = hex.length === 3 ? hex.split('').map((item) => `${item}${item}`).join('') : hex
  const red = parseInt(normalized.slice(0, 2), 16)
  const green = parseInt(normalized.slice(2, 4), 16)
  const blue = parseInt(normalized.slice(4, 6), 16)
  return `rgba(${red}, ${green}, ${blue}, .08)`
}

function buildChartOptions() {
  return {
    color: ['#f0ad1d'],
    padding: [18, 12, 8, 6],
    enableScroll: false,
    animation: true,
    dataLabel: false,
    legend: { show: false },
    xAxis: { disableGrid: true, fontColor: '#8b94a8', fontSize: 10, rotateLabel: false },
    yAxis: {
      gridType: 'dash',
      dashLength: 3,
      gridColor: '#e8ebf2',
      data: [{ min: 0, fontColor: '#a0a8b8', fontSize: 9, axisLine: false }],
    },
    extra: { line: { type: 'curve', width: 2, activeType: 'hollow' } },
  }
}

function buildTrendAxisLabels(days: Array<{ date: string }>) {
  if (days.length <= 1) {
    return days.map((item) => String(Number(item.date.slice(-2))))
  }
  const labelCount = days.length > 24 ? 7 : days.length > 16 ? 6 : days.length > 10 ? 5 : days.length
  const visibleIndexes = new Set(
    Array.from({ length: labelCount }, (_, index) => Math.round((index * (days.length - 1)) / (labelCount - 1))),
  )
  return days.map((item, index) => {
    return visibleIndexes.has(index) ? String(Number(item.date.slice(-2))) : ''
  })
}

function buildCategoryRingBackground(categories: Array<{ ratio: number; color: string }>) {
  if (!categories.length) return '#e9edf3'
  const gap = categories.length > 1 ? Math.min(3.2, (360 / categories.length) * 0.1) : 0
  let current = 0
  let lastFillEnd = 0
  const segments: string[] = []
  categories.forEach((item, index) => {
    const degrees = Math.max(0, toAmount(item.ratio) * 3.6)
    const start = current
    const end = Math.min(360, start + degrees)
    const segmentGap = Math.min(gap, degrees * 0.35)
    const fillStart = start + segmentGap / 2
    const fillEnd = Math.max(fillStart, end - segmentGap / 2)
    if (index === 0) {
      segments.push(`#fff 0deg ${fillStart}deg`)
    } else {
      segments.push(`#fff ${lastFillEnd}deg ${fillStart}deg`)
    }
    segments.push(`${item.color} ${fillStart}deg ${fillEnd}deg`)
    lastFillEnd = fillEnd
    current = end
  })
  segments.push(`#fff ${lastFillEnd}deg 360deg`)
  return `conic-gradient(${segments.join(', ')})`
}

function buildDisplayCategories(categories: Array<{
  categoryId: string
  name: string
  icon: string | null
  iconText: string
  color: string
  amount: string
  ratio: number
}>) {
  if (categories.length <= 6) return categories
  const visible = categories.slice(0, 5)
  const remainder = categories.slice(5)
  const remainderAmount = remainder.reduce((total, item) => total + toAmount(item.amount), 0)
  const remainderRatio = remainder.reduce((total, item) => total + toAmount(item.ratio), 0)
  return [
    ...visible,
    {
      categoryId: 'other-categories',
      name: '其他',
      icon: null,
      iconText: '其',
      color: CATEGORY_COLORS[5],
      amount: remainderAmount.toFixed(2),
      ratio: Number(remainderRatio.toFixed(2)),
    },
  ]
}

export function createBillMonthDetailState(monthKey = getCurrentMonthKey()) {
  const [yearText, monthText] = monthKey.split('-')
  const month = Number(monthText) || new Date().getMonth() + 1
  return {
    ...createHeaderLayout(),
    monthKey,
    year: Number(yearText) || new Date().getFullYear(),
    month,
    monthLabel: `${month}月账单`,
    detailLoading: true,
    detailError: '',
    isEmpty: false,
    totalBalanceText: '0.00',
    previousBalanceText: '0.00',
    expenseAmountText: '0.00',
    incomeAmountText: '0.00',
    expenseRatioText: '0%',
    incomeRatioText: '0%',
    balanceRateText: '0%',
    expenseBarWidth: '0%',
    incomeBarWidth: '0%',
    dataUpdatedText: '',
    flowRingBackground: '#e9edf3',
    categoryRingBackground: '#e9edf3',
    categories: [] as Array<Record<string, unknown>>,
    rankings: [] as Array<Record<string, unknown>>,
    trendMetrics: [] as Array<Record<string, unknown>>,
    chartData: { categories: [] as string[], series: [{ name: '支出', data: [] as number[], color: '#526dff' }] },
    chartOpts: buildChartOptions(),
    comparisons: [] as Array<Record<string, unknown>>,
  }
}

function mapMonthDetail(data: MonthDetailDTO) {
  const totalExpense = toAmount(data.totalExpense)
  const totalIncome = toAmount(data.totalIncome)
  const totalBalance = totalIncome - totalExpense
  const flowTotal = totalExpense + totalIncome
  const days = Array.isArray(data.days) ? data.days : []
  const rawCategories = (Array.isArray(data.categories) ? data.categories : []).map((item, index) => ({
    ...item,
    iconText: item.iconText || item.name.slice(0, 1),
    color: item.color || CATEGORY_COLORS[index % CATEGORY_COLORS.length],
  }))
  const categories = buildDisplayCategories(rawCategories).map((item) => ({
    ...item,
    amountText: `¥${formatMoney(item.amount)}`,
    ratioText: `${toAmount(item.ratio).toFixed(1)}%`,
  }))
  const categoryColorMap = new Map(categories.map((item) => [item.categoryId, item.color]))
  const rankingRows = Array.isArray(data.rankings) ? data.rankings : []
  const rankings = rankingRows.slice(0, 3).map((item, index) => {
    const categoryIconColor = item.categoryIconColor || categoryColorMap.get(item.categoryId) || CATEGORY_COLORS[index % CATEGORY_COLORS.length]
    return {
      ...item,
      rank: index + 1,
      iconText: item.categoryIconText || (item.categoryName || '其').slice(0, 1),
      categoryIconColor,
      categoryIconBackgroundColor: createIconBackgroundColor(categoryIconColor),
      amountText: `-¥${formatMoney(item.amount)}`,
      dateText: formatRankingDateTime(item.occurredAt),
    }
  })
  const comparisonRows = Array.isArray(data.comparisons) ? data.comparisons : []
  const maxComparison = Math.max(...comparisonRows.map((item) => toAmount(item.expense)), 1)
  const comparisons = comparisonRows.map((item) => ({
    month: item.month,
    label: `${Number(item.month.split('-')[1])}月`,
    amountText: formatMoney(item.expense),
    height: `${Math.max((toAmount(item.expense) / maxComparison) * 160, toAmount(item.expense) > 0 ? 8 : 2)}rpx`,
    active: item.month === data.month,
  }))
  const expenseRatio = flowTotal ? (totalExpense / flowTotal) * 100 : 0
  const incomeRatio = flowTotal ? (totalIncome / flowTotal) * 100 : 0
  const balanceRate = flowTotal ? Math.max(0, Math.min((totalBalance / flowTotal) * 100, 100)) : 0
  const balanceDegree = balanceRate * 3.6
  const highestDay = days.reduce<{ date: string; expense: string } | null>((highest, item) => {
    if (!highest || toAmount(item.expense) > toAmount(highest.expense)) return item
    return highest
  }, null)
  const lastDataDay = days.length ? days[days.length - 1].date : data.month
  const dayCount = Math.max(days.length, 1)
  return {
    monthKey: data.month,
    year: Number(data.month.split('-')[0]),
    month: Number(data.month.split('-')[1]),
    monthLabel: `${Number(data.month.split('-')[1])}月账单`,
    detailLoading: false,
    detailError: '',
    isEmpty: totalExpense === 0 && totalIncome === 0,
    totalBalanceText: formatSignedMoney(data.totalBalance),
    previousBalanceText: formatSignedMoney(data.previousBalance),
    expenseAmountText: formatMoney(totalExpense),
    incomeAmountText: formatMoney(totalIncome),
    expenseRatioText: `${expenseRatio.toFixed(1)}%`,
    incomeRatioText: `${incomeRatio.toFixed(1)}%`,
    balanceRateText: `${balanceRate.toFixed(0)}%`,
    expenseBarWidth: `${Math.max(expenseRatio, totalExpense > 0 ? 1.5 : 0)}%`,
    incomeBarWidth: `${Math.max(incomeRatio, totalIncome > 0 ? 1.5 : 0)}%`,
    dataUpdatedText: `数据更新至${Number(lastDataDay.slice(5, 7))}月${Number(lastDataDay.slice(-2))}日`,
    flowRingBackground: flowTotal
      ? `conic-gradient(#ef6370 0deg ${360 - balanceDegree}deg, #2db487 ${360 - balanceDegree}deg 360deg)`
      : '#e9edf3',
    categoryRingBackground: buildCategoryRingBackground(categories),
    categories,
    rankings,
    trendMetrics: [
      {
        label: '单日支出最高',
        value: formatMoney(highestDay ? highestDay.expense : 0),
        note: highestDay && toAmount(highestDay.expense) > 0 ? `${Number(highestDay.date.slice(-2))}日` : '--',
      },
      { label: '日均支出', value: formatMoney(totalExpense / dayCount), note: `${days.length}天` },
      { label: '本月支出', value: formatMoney(totalExpense), note: `${rankingRows.length}笔` },
    ],
    chartData: {
      categories: buildTrendAxisLabels(days),
      series: [{ name: '支出', data: days.map((item) => toAmount(item.expense)), color: '#f0ad1d' }],
    },
    chartOpts: buildChartOptions(),
    comparisons,
  }
}

export async function getBillMonthDetailState(monthKey: string) {
  const openId = await ensureOpenId()
  const data = await get<MonthDetailDTO>('/frontend/bookkeeping/transaction/month-bill/detail', {
    openId,
    month: monthKey,
  }, { skipToken: true })
  if (!data || !data.month) throw new Error('月度账单数据为空')
  return mapMonthDetail(data)
}
