import { BILL_MONTH_DETAIL_MAP, type BillMonthDetailData } from '../constants/bill-month-detail'
import { get } from './request'
import { ensureOpenId } from './auth'
export type BillMonthDetailState = BillMonthDetailData & {
  statusBarHeight: number
  navBarHeight: number
  capsuleTop: number
  capsuleHeight: number
  capsuleWidth: number
  capsuleRight: number
  categoryRingBackground: string
  categoryLegend: Array<{ name: string; ratioText: string; amountText: string; color: string }>
  expenseTrackWidth: string
  incomeTrackWidth: string
  lineChartData: {
    categories: string[]
    series: Array<{ name: string; data: number[]; color: string }>
  }
  lineChartOpts: Record<string, unknown>
  compareMax: number
  compareItemsWithHeight: Array<{ monthLabel: string; value: number; active?: boolean; height: string; valueText: string }>
}
type MonthBillDayDTO = {
  date: string
  expense: string
  income: string
  balance: string
}
type MonthBillDTO = {
  month: string
  totalExpense: string
  totalIncome: string
  totalBalance: string
  days: MonthBillDayDTO[]
}
type YearBillMonthDTO = {
  month: string
  expense: string
  income: string
  balance: string
}
type YearBillDTO = {
  year: string
  totalExpense: string
  totalIncome: string
  totalBalance: string
  months: YearBillMonthDTO[]
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
function buildRingBackground(data: BillMonthDetailData) {
  const segments = data.categories
    .map((item, index) => {
      const ratio = Number(item.ratioText.replace('%', '')) / 100
      return {
        color: item.color,
        ratio,
        index,
      }
    })
    .reduce(
      (accumulator, item) => {
        const start = accumulator.current
        const end = start + item.ratio * 360
        accumulator.current = end
        accumulator.parts.push(`${item.color} ${start}deg ${end}deg`)
        return accumulator
      },
      { current: 0, parts: [] as string[] }
    )
  return `conic-gradient(${segments.parts.join(', ')})`
}
function buildLineChartData(data: BillMonthDetailData) {
  return {
    categories: data.trendPoints.map((item) => item.day),
    series: [
      {
        name: '支出',
        data: data.trendPoints.map((item) => item.value),
        color: '#f3b018',
      },
    ],
  }
}
function buildLineChartOpts() {
  return {
    color: ['#f3b018'],
    padding: [18, 12, 8, 6],
    enableScroll: false,
    animation: true,
    fontSize: 11,
    dataLabel: false,
    dataPointShape: true,
    dataPointShapeType: 'hollow',
    legend: { show: false },
    xAxis: {
      disableGrid: true,
      fontColor: '#b4bbca',
      fontSize: 10,
      marginTop: 8,
    },
    yAxis: {
      gridColor: '#eceff5',
      splitNumber: 4,
      data: [
        {
          min: 0,
          fontColor: '#c2c8d4',
          fontSize: 9,
          axisLine: false,
          labelGap: 8,
        },
      ],
    },
    extra: {
      line: {
        type: 'curve',
        width: 2,
        activeType: 'hollow',
      },
    },
  }
}
function parseAmount(value: string) {
  const amount = Number(value || 0)
  return Number.isNaN(amount) ? 0 : amount
}
function parseMonthNumber(value: string) {
  const matched = value.match(/^\d{4}-(\d{2})$/)
  if (!matched) {
    return 0
  }
  return Number(matched[1]) || 0
}
function formatAmountText(value: number) {
  const absolute = Math.abs(value)
  return value < 0 ? `-${absolute.toFixed(2)}` : absolute.toFixed(2)
}
function buildCompareItems(yearBill: YearBillDTO | null, currentMonth: string) {
  if (!yearBill || !Array.isArray(yearBill.months)) {
    return []
  }
  const currentMonthValue = parseMonthNumber(currentMonth)
  const filtered = yearBill.months
    .map((item) => ({
      monthLabel: `${parseMonthNumber(item.month)}月`,
      value: parseAmount(item.expense),
      active: item.month === currentMonth,
      monthValue: parseMonthNumber(item.month),
    }))
    .filter((item) => item.monthValue > 0 && item.monthValue <= currentMonthValue)
    .slice(-6)
  return filtered.map((item) => ({
    monthLabel: item.monthLabel,
    value: item.value,
    active: item.active,
  }))
}
function mapMonthBillToDetail(baseData: BillMonthDetailData, monthBill: MonthBillDTO, yearBill: YearBillDTO | null): BillMonthDetailData {
  const days = Array.isArray(monthBill.days) ? monthBill.days : []
  const totalExpense = parseAmount(monthBill.totalExpense)
  const totalIncome = parseAmount(monthBill.totalIncome)
  const totalBalance = parseAmount(monthBill.totalBalance)
  const previousMonthData = yearBill && Array.isArray(yearBill.months)
    ? yearBill.months.find((item) => {
        const currentMonthNumber = parseMonthNumber(monthBill.month)
        return parseMonthNumber(item.month) === currentMonthNumber - 1
      })
    : null
  const previousBalance = previousMonthData ? parseAmount(previousMonthData.balance) : 0
  const dailyExpenseValues = days.map((item) => parseAmount(item.expense))
  const highestExpense = dailyExpenseValues.length ? Math.max(...dailyExpenseValues) : 0
  const expenseDayIndex = dailyExpenseValues.findIndex((item) => item === highestExpense)
  const trendPoints = days.map((item) => ({
    day: (item.date.split('-')[2] || '').padStart(2, '0'),
    value: parseAmount(item.expense),
  }))
  const compareItems = buildCompareItems(yearBill, monthBill.month)
  return {
    ...baseData,
    year: Number(monthBill.month.split('-')[0] || baseData.year),
    month: parseMonthNumber(monthBill.month) || baseData.month,
    monthLabel: `${parseMonthNumber(monthBill.month) || baseData.month}月账单`,
    currentBalanceText: formatAmountText(totalBalance),
    previousBalanceText: formatAmountText(previousBalance),
    expenseAmountText: totalExpense.toFixed(2),
    incomeAmountText: totalIncome.toFixed(2),
    expenseRatio: totalExpense + totalIncome > 0 ? Number(((totalExpense / (totalExpense + totalIncome)) * 100).toFixed(2)) : 0,
    incomeRatio: totalExpense + totalIncome > 0 ? Number(((totalIncome / (totalExpense + totalIncome)) * 100).toFixed(2)) : 0,
    trendSummary: [
      {
        label: '单日支出最高',
        value: highestExpense.toFixed(2),
        note: expenseDayIndex >= 0 && days[expenseDayIndex] ? `${parseMonthNumber(monthBill.month)}月${Number(days[expenseDayIndex].date.split('-')[2] || 0)}日` : '',
      },
      {
        label: '日均支出',
        value: days.length ? (totalExpense / days.length).toFixed(2) : '0.00',
        note: '',
      },
      {
        label: '本月支出',
        value: totalExpense.toFixed(2),
        note: '',
      },
    ],
    trendPoints: trendPoints.length ? trendPoints : baseData.trendPoints,
    compareItems: compareItems.length ? compareItems : baseData.compareItems,
  }
}
function createBillMonthDetailStateFromData(data: BillMonthDetailData): BillMonthDetailState {
  const compareMax = Math.max(...data.compareItems.map((item) => item.value), 1)
  const expenseTrackWidth = data.expenseRatio > 0 ? `${data.expenseRatio}%` : '3px'
  const incomeTrackWidth = data.incomeRatio > 0 ? `${data.incomeRatio}%` : '3px'
  return {
    ...data,
    ...createHeaderLayout(),
    categoryRingBackground: buildRingBackground(data),
    categoryLegend: data.categories.map((item) => ({
      name: item.name,
      ratioText: item.ratioText,
      amountText: `${item.amount}`,
      color: item.color,
    })),
    expenseTrackWidth,
    incomeTrackWidth,
    lineChartData: buildLineChartData(data),
    lineChartOpts: buildLineChartOpts(),
    compareMax,
    compareItemsWithHeight: data.compareItems.map((item) => ({
      ...item,
      height: `${Math.max((item.value / compareMax) * 180, item.value > 0 ? 10 : 0)}rpx`,
      valueText: `${item.value}`,
    })),
  }
}
export function createBillMonthDetailState(key = '2025-09'): BillMonthDetailState {
  const data = BILL_MONTH_DETAIL_MAP[key] || BILL_MONTH_DETAIL_MAP['2025-09']
  return createBillMonthDetailStateFromData(data)
}
export async function getBillMonthDetailState(key = '2025-09') {
  const fallback = BILL_MONTH_DETAIL_MAP[key] || BILL_MONTH_DETAIL_MAP['2025-09']
  try {
    const openId = await ensureOpenId()
    const monthBill = await get<MonthBillDTO>('/frontend/bookkeeping/transaction/month-bill', {
      openId,
      month: key,
    }, {
      skipToken: true,
    })
    const year = key.split('-')[0] || `${fallback.year}`
    let yearBill: YearBillDTO | null = null
    try {
      yearBill = await get<YearBillDTO>('/frontend/bookkeeping/transaction/year-bill', {
        openId,
        year,
      }, {
        skipToken: true,
      })
    } catch (yearError) {
      console.error('get year bill for compare failed', yearError)
    }
    if (!monthBill || !Array.isArray(monthBill.days)) {
      return createBillMonthDetailStateFromData(fallback)
    }
    return createBillMonthDetailStateFromData(mapMonthBillToDetail(fallback, monthBill, yearBill))
  } catch (error) {
    console.error('get month bill failed', error)
    return createBillMonthDetailStateFromData(fallback)
  }
}
