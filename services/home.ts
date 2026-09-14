import { get } from './request'
import { ensureOpenId } from './auth'
import { getCategoryIconAsset } from '../constants/design'
import { getBudgetSummary, type BudgetSummary } from './budget'
export type HomeMonthOption = {
  label: string
  value: string
}
export type HomeRecordItem = {
  id: string
  recordKey: string
  categoryId: string
  occurredTimeText: string
  occurredAt: string
  title: string
  iconUrl: string
  fallbackIconUrl: string
  iconColor: string
  iconBackgroundColor: string
  iconBorderColor: string
  amountSign: string
  amountValue: string
  amountClass: 'expense' | 'income'
  remark: string
  tagText: string
}
export type HomeRecordGroup = {
  groupKey: string
  dateLabel: string
  weekLabel: string
  expenseText: string
  incomeText: string
  hasIncome: boolean
  records: HomeRecordItem[]
}
export type HomePageState = {
  nickname: string
  statusText: string
  selectedMonth: string
  selectedMonthLabel: string
  selectedMonthIndex: number
  monthOptions: HomeMonthOption[]
  summaryLabel: string
  disposableAmountText: string
  monthIncomeText: string
  monthExpenseText: string
  trendText: string
  budgetConfigured: boolean
  budgetRemainingText: string
  budgetSpentText: string
  budgetTotalText: string
  budgetUsagePercent: number
  budgetIsOver: boolean
  recentRecordGroups: HomeRecordGroup[]
}
export type HomeRecentRecordDTO = {
  id: string | number
  categoryId: string
  categoryName: string
  categoryIcon?: string | null
  categoryIconText?: string | null
  categoryIconColor?: string | null
  type: 'expense' | 'income'
  amount: string
  title: string
  remark?: string | null
  occurredAt: string
}
type HomeRecentRecordQuery = {
  pageNo?: number
  pageSize?: number
  month?: string
  status?: string
}
type HomeRecentRecordPageResult = {
  data: HomeRecentRecordDTO[]
  total: number
  current: number
  totalPage: number
  hasMore: boolean
}
type HomeMonthBillDTO = {
  month: string
  totalExpense: string
  totalIncome: string
  totalBalance: string
  days: Array<{
    date: string
    expense: string
    income: string
    balance: string
  }>
}
function padNumber(value: number) {
  return `${value}`.padStart(2, '0')
}
function getWeekLabel(date: Date) {
  const weekMap = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
  return weekMap[date.getDay()] || ''
}
function formatDayLabel(date: Date) {
  return `${date.getMonth() + 1}月${date.getDate()}日`
}
function formatTimeLabel(date: Date) {
  return `${padNumber(date.getHours())}:${padNumber(date.getMinutes())}`
}

function parseOccurredDate(value: string) {
  const matched = value.match(
    /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?/,
  )
  if (!matched) {
    return new Date(value)
  }
  return new Date(
    Number(matched[1]),
    Number(matched[2]) - 1,
    Number(matched[3]),
    Number(matched[4] || 0),
    Number(matched[5] || 0),
    Number(matched[6] || 0),
  )
}
function createAmountParts(amount: string, type: 'expense' | 'income') {
  return {
    amountSign: type === 'income' ? '' : '-',
    amountValue: amount,
  }
}
function formatSummaryAmount(value: number) {
  const absolute = Math.abs(value)
  const formatted = absolute.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return value < 0 ? `-${formatted}` : formatted
}

function createBudgetDisplay(summary: BudgetSummary | null) {
  const configured = Boolean(summary && summary.configured)
  const remainingBudget = summary ? summary.remainingBudget || 0 : 0
  return {
    budgetConfigured: configured,
    budgetRemainingText: formatSummaryAmount(remainingBudget),
    budgetSpentText: formatSummaryAmount(summary ? summary.totalSpent || 0 : 0),
    budgetTotalText: formatSummaryAmount(summary ? summary.totalBudget || 0 : 0),
    budgetUsagePercent: configured ? Number(summary ? summary.usagePercent || 0 : 0) : 0,
    budgetIsOver: configured && remainingBudget < 0,
  }
}
function parseAmount(value: string) {
  const amount = Number(value || 0)
  return Number.isNaN(amount) ? 0 : amount
}
function normalizeIconColor(value?: string | null) {
  const color = value ? value.trim() : ''
  return /^#(?:[\da-fA-F]{3}|[\da-fA-F]{4}|[\da-fA-F]{6}|[\da-fA-F]{8})$/.test(color) ? color : ''
}
function createIconSurfaceColors(color: string) {
  if (!color) {
    return {
      iconBackgroundColor: '#ffffff',
      iconBorderColor: 'rgba(228, 233, 242, 0.9)',
    }
  }
  const hex = color.slice(1)
  const red = parseInt(hex.length <= 4 ? `${hex[0]}${hex[0]}` : hex.slice(0, 2), 16)
  const green = parseInt(hex.length <= 4 ? `${hex[1]}${hex[1]}` : hex.slice(2, 4), 16)
  const blue = parseInt(hex.length <= 4 ? `${hex[2]}${hex[2]}` : hex.slice(4, 6), 16)
  return {
    iconBackgroundColor: `rgba(${red}, ${green}, ${blue}, 0.08)`,
    iconBorderColor: `rgba(${red}, ${green}, ${blue}, 0.22)`,
  }
}
function createCurrentMonthValue() {
  const now = new Date()
  return `${now.getFullYear()}-${padNumber(now.getMonth() + 1)}`
}
function formatMonthOptionLabel(value: string) {
  const matched = value.match(/^(\d{4})-(\d{2})$/)
  if (!matched) {
    return value
  }
  return `${matched[1]}年${Number(matched[2])}月`
}
function createMonthOptions(total = 12) {
  const now = new Date()
  return Array.from({ length: total }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - index, 1)
    const value = `${date.getFullYear()}-${padNumber(date.getMonth() + 1)}`
    return {
      label: formatMonthOptionLabel(value),
      value,
    }
  })
}
export function buildHomeRecentRecordGroups(items: HomeRecentRecordDTO[]): HomeRecordGroup[] {
  const groupMap: Record<string, HomeRecordGroup> = {}
  items.forEach((item, index) => {
    const occurredDate = parseOccurredDate(item.occurredAt)
    const groupKey = `${occurredDate.getFullYear()}-${padNumber(occurredDate.getMonth() + 1)}-${padNumber(occurredDate.getDate())}`
    if (!groupMap[groupKey]) {
      groupMap[groupKey] = {
        groupKey,
        dateLabel: formatDayLabel(occurredDate),
        weekLabel: getWeekLabel(occurredDate),
        expenseText: '0.00',
        incomeText: '0.00',
        hasIncome: false,
        records: [],
      }
    }
    const currentGroup = groupMap[groupKey]
    const amount = Number(item.amount || 0)
    const nextExpense = item.type === 'expense' ? amount + Number(currentGroup.expenseText) : Number(currentGroup.expenseText)
    const nextIncome = item.type === 'income' ? amount + Number(currentGroup.incomeText) : Number(currentGroup.incomeText)
    currentGroup.expenseText = nextExpense.toFixed(2)
    currentGroup.incomeText = nextIncome.toFixed(2)
    currentGroup.hasIncome = currentGroup.hasIncome || (item.type === 'income' && amount !== 0)
    const amountParts = createAmountParts(item.amount, item.type)
    const normalizedId = `${item.id || index + 1}`
    const iconColor = normalizeIconColor(item.categoryIconColor)
    currentGroup.records.push({
      id: normalizedId,
      recordKey: `${groupKey}-${normalizedId}-${index}`,
      categoryId: item.categoryId || '',
      occurredTimeText: formatTimeLabel(occurredDate),
      occurredAt: item.occurredAt,
      title: item.categoryName || '未分类',
      iconUrl: (item.categoryIcon || '').trim() || getCategoryIconAsset(item.categoryName),
      fallbackIconUrl: getCategoryIconAsset(item.categoryName, item.categoryIcon || ''),
      iconColor,
      ...createIconSurfaceColors(iconColor),
      amountSign: amountParts.amountSign,
      amountValue: amountParts.amountValue,
      amountClass: item.type,
      remark: item.remark || '',
      tagText: item.remark || item.categoryName || '',
    })
  })
  return Object.values(groupMap)
}
export function getHomeOverviewState() {
  const currentMonth = createCurrentMonthValue()
  return {
    nickname: '',
    statusText: '',
    selectedMonth: currentMonth,
    selectedMonthLabel: formatMonthOptionLabel(currentMonth),
    selectedMonthIndex: 0,
    monthOptions: createMonthOptions(),
    summaryLabel: '本月结余',
    disposableAmountText: '0.00',
    monthIncomeText: '0.00',
    monthExpenseText: '0.00',
    trendText: '',
    ...createBudgetDisplay(null),
  }
}
export function createHomePageState(): HomePageState {
  const currentMonth = createCurrentMonthValue()
  return {
    nickname: '',
    statusText: '',
    selectedMonth: currentMonth,
    selectedMonthLabel: formatMonthOptionLabel(currentMonth),
    selectedMonthIndex: 0,
    monthOptions: createMonthOptions(),
    summaryLabel: '本月结余',
    disposableAmountText: '0.00',
    monthIncomeText: '0.00',
    monthExpenseText: '0.00',
    trendText: '',
    ...createBudgetDisplay(null),
    recentRecordGroups: [],
  }
}
export async function getHomeRecentRecordPage(params: HomeRecentRecordQuery = {}) {
  const openId = await ensureOpenId()
  const pageNo = typeof params.pageNo === 'number' ? params.pageNo : 1
  const pageSize = typeof params.pageSize === 'number' ? params.pageSize : 10
  return get<HomeRecentRecordPageResult>('/frontend/bookkeeping/transaction/recent', {
    openId,
    page: pageNo,
    size: pageSize,
    month: params.month || '',
    status: params.status || 'normal',
  }, {
    skipToken: true,
  })
}
export async function getHomeMonthOverview(month: string) {
  const monthOptions = createMonthOptions()
  const selectedMonth = month || createCurrentMonthValue()
  const selectedMonthIndex = monthOptions.findIndex((item) => item.value === selectedMonth)
  const currentMonth = createCurrentMonthValue()
  const summaryLabel = selectedMonth === currentMonth ? '本月结余' : `${Number(selectedMonth.split('-')[1] || 0)}月结余`
  const statusText = `${formatMonthOptionLabel(selectedMonth)} 收支概览`
  try {
    const openId = await ensureOpenId()
    const [data, budget] = await Promise.all([
      get<HomeMonthBillDTO>('/frontend/bookkeeping/transaction/month-bill', {
        openId,
        month: selectedMonth,
      }, {
        skipToken: true,
      }),
      getBudgetSummary(selectedMonth).catch((error) => {
        console.error('get home budget summary failed', error)
        return null
      }),
    ])
    if (!data) {
      throw new Error('month bill response empty')
    }
    return {
      nickname: '小迹',
      statusText,
      selectedMonth,
      selectedMonthLabel: formatMonthOptionLabel(selectedMonth),
      selectedMonthIndex: selectedMonthIndex >= 0 ? selectedMonthIndex : 0,
      monthOptions,
      summaryLabel,
      disposableAmountText: formatSummaryAmount(parseAmount(data.totalBalance)),
      monthIncomeText: formatSummaryAmount(parseAmount(data.totalIncome)),
      monthExpenseText: formatSummaryAmount(parseAmount(data.totalExpense)),
      trendText: '',
      ...createBudgetDisplay(budget),
    }
  } catch (error) {
    console.error('get home month overview failed', error)
    return {
      nickname: '',
      statusText: '',
      selectedMonth,
      selectedMonthLabel: formatMonthOptionLabel(selectedMonth),
      selectedMonthIndex: selectedMonthIndex >= 0 ? selectedMonthIndex : 0,
      monthOptions,
      summaryLabel,
      disposableAmountText: '0.00',
      monthIncomeText: '0.00',
      monthExpenseText: '0.00',
      trendText: '',
      ...createBudgetDisplay(null),
    }
  }
}
export async function getHomePageData() {
  const overview = await getHomeMonthOverview(createCurrentMonthValue())
  const records = await getHomeRecentRecordPage({
    pageNo: 1,
    pageSize: 10,
    month: overview.selectedMonth,
    status: 'normal',
  })
  return {
    ...overview,
    recentRecordGroups: buildHomeRecentRecordGroups(Array.isArray(records.data) ? records.data : []),
  }
}
