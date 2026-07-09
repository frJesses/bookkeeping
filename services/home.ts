import { get } from './request'
import { ensureOpenId } from './auth'
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
  recentRecordGroups: HomeRecordGroup[]
}
export type HomeRecentRecordDTO = {
  id: string | number
  categoryId: string
  categoryName: string
  categoryIcon?: string | null
  categoryIconText?: string | null
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
  const weekMap = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return weekMap[date.getDay()] || ''
}
function formatDayLabel(date: Date) {
  return `${padNumber(date.getMonth() + 1)}/${padNumber(date.getDate())}`
}
function formatTimeLabel(date: Date) {
  return `${padNumber(date.getHours())}:${padNumber(date.getMinutes())}`
}
function createAmountParts(amount: string, type: 'expense' | 'income') {
  return {
    amountSign: type === 'income' ? '+ ¥' : '- ¥',
    amountValue: amount,
  }
}
function formatSummaryAmount(value: number) {
  const absolute = Math.abs(value)
  return value < 0 ? `-${absolute.toFixed(2)}` : absolute.toFixed(2)
}
function parseAmount(value: string) {
  const amount = Number(value || 0)
  return Number.isNaN(amount) ? 0 : amount
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
  return `${matched[1]}年${matched[2]}月`
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
    const occurredDate = new Date(item.occurredAt)
    const groupKey = `${occurredDate.getFullYear()}-${padNumber(occurredDate.getMonth() + 1)}-${padNumber(occurredDate.getDate())}`
    if (!groupMap[groupKey]) {
      groupMap[groupKey] = {
        groupKey,
        dateLabel: formatDayLabel(occurredDate),
        weekLabel: getWeekLabel(occurredDate),
        expenseText: '¥0.00',
        incomeText: '¥0.00',
        records: [],
      }
    }
    const currentGroup = groupMap[groupKey]
    const amount = Number(item.amount || 0)
    const nextExpense = item.type === 'expense' ? amount + Number(currentGroup.expenseText.replace('¥', '')) : Number(currentGroup.expenseText.replace('¥', ''))
    const nextIncome = item.type === 'income' ? amount + Number(currentGroup.incomeText.replace('¥', '')) : Number(currentGroup.incomeText.replace('¥', ''))
    currentGroup.expenseText = `¥${nextExpense.toFixed(2)}`
    currentGroup.incomeText = `¥${nextIncome.toFixed(2)}`
    const amountParts = createAmountParts(item.amount, item.type)
    const normalizedId = `${item.id || index + 1}`
    currentGroup.records.push({
      id: normalizedId,
      recordKey: `${groupKey}-${normalizedId}-${index}`,
      categoryId: item.categoryId || '',
      occurredTimeText: formatTimeLabel(occurredDate),
      occurredAt: item.occurredAt,
      title: item.categoryName || '未分类',
      iconUrl: item.categoryIcon || '',
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
    recentRecordGroups: [],
  }
}
export async function getHomeRecentRecordPage(params: HomeRecentRecordQuery = {}) {
  try {
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
  } catch (error) {
    console.error('get home recent records failed', error)
    const pageNo = typeof params.pageNo === 'number' ? params.pageNo : 1
    return {
      data: [],
      total: 0,
      current: pageNo,
      totalPage: 1,
      hasMore: false,
    }
  }
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
    const data = await get<HomeMonthBillDTO>('/frontend/bookkeeping/transaction/month-bill', {
      openId,
      month: selectedMonth,
    }, {
      skipToken: true,
    })
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
      monthIncomeText: parseAmount(data.totalIncome).toFixed(2),
      monthExpenseText: parseAmount(data.totalExpense).toFixed(2),
      trendText: '',
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
