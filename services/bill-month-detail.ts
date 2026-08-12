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

const CATEGORY_COLORS = ['#526dff', '#14a878', '#f1a624', '#e65e73', '#39a6c8', '#7b61a8']

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

function buildChartOptions() {
  return {
    color: ['#f0ad1d'],
    padding: [18, 12, 8, 6],
    enableScroll: false,
    animation: true,
    dataLabel: false,
    legend: { show: false },
    xAxis: { disableGrid: true, fontColor: '#8b94a8', fontSize: 10 },
    yAxis: {
      gridType: 'dash',
      dashLength: 3,
      gridColor: '#e8ebf2',
      data: [{ min: 0, fontColor: '#a0a8b8', fontSize: 9, axisLine: false }],
    },
    extra: { line: { type: 'curve', width: 2, activeType: 'hollow' } },
  }
}

function buildCategoryRingBackground(categories: Array<{ ratio: number; color: string }>) {
  let current = 0
  const segments = categories.map((item) => {
    const start = current
    current += toAmount(item.ratio) * 3.6
    return `${item.color} ${start}deg ${current}deg`
  })
  return segments.length ? `conic-gradient(${segments.join(', ')})` : '#e9edf3'
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
  const rankingRows = Array.isArray(data.rankings) ? data.rankings : []
  const rankings = rankingRows.slice(0, 3).map((item, index) => ({
    ...item,
    rank: index + 1,
    iconText: item.categoryIconText || (item.categoryName || '其').slice(0, 1),
    amountText: `-¥${formatMoney(item.amount)}`,
    dateText: item.occurredAt ? item.occurredAt.slice(5, 16).replace('-', '/') : '',
  }))
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
    expenseBarWidth: `${Math.max(expenseRatio, totalExpense > 0 ? 1.5 : 0)}%`,
    incomeBarWidth: `${Math.max(incomeRatio, totalIncome > 0 ? 1.5 : 0)}%`,
    dataUpdatedText: `数据更新至${Number(lastDataDay.slice(5, 7))}月${Number(lastDataDay.slice(-2))}日`,
    flowRingBackground: flowTotal
      ? `conic-gradient(#ef6370 0deg ${expenseRatio * 3.6}deg, #2db487 ${expenseRatio * 3.6}deg 360deg)`
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
      categories: days.map((item) => String(Number(item.date.slice(-2)))),
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
