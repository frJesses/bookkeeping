import { get } from './request'
import { ensureOpenId } from './auth'
import { buildHomeRecentRecordGroups, type HomeRecentRecordDTO } from './home'
import { createRecentYearOptions } from '../utils/month-picker'

export type BillFilter = 'all' | 'expense' | 'income'

export type BillMonth = {
  month: string
  monthLabel: string
  income: string
  expense: string
  balance: string
}

export type BillPageData = {
  year: number
  yearOptions: string[]
  yearIndex: number
  periodLabel: string
  months: BillMonth[]
  bills: BillMonth[]
  totalIncome: string
  totalExpense: string
  totalBalance: string
}

export type BillDetailRow = {
  recordKey: string
  name: string
  note: string
  amount: string
  icon: string
  type: 'expense' | 'income'
}

export type BillDetailGroup = {
  groupKey: string
  dateLabel: string
  weekLabel: string
  expenseText: string
  incomeText: string
  hasIncome: boolean
  rows: BillDetailRow[]
}

export type BillDetailPageData = {
  month: string
  title: string
  countText: string
  totalIncome: string
  totalExpense: string
  totalBalance: string
  groups: BillDetailGroup[]
}

type YearBillResponse = {
  year: string
  totalExpense: string
  totalIncome: string
  totalBalance: string
  months: Array<{
    month: string
    expense: string
    income: string
    balance: string
  }>
}

type MonthDetailResponse = {
  month: string
  totalExpense: string
  totalIncome: string
  totalBalance: string
  rankings: HomeRecentRecordDTO[]
  incomeRankings: HomeRecentRecordDTO[]
}

const FILTERS: Array<{ key: BillFilter; label: string }> = [
  { key: 'all', label: '全部' },
  { key: 'expense', label: '支出' },
  { key: 'income', label: '收入' },
]

export function getBillFilters() {
  return FILTERS
}

export function getCurrentYear() {
  return new Date().getFullYear()
}

function parseAmount(value: string) {
  const amount = Number(value || 0)
  return Number.isFinite(amount) ? amount : 0
}

function formatAmount(value: number) {
  return value.toFixed(2)
}

function getMonthNumber(month: string) {
  return Number(month.slice(5)) || 0
}

function formatMonthLabel(month: string) {
  return `${getMonthNumber(month)}月账单`
}

function createBillMonths(months: YearBillResponse['months']) {
  return months.map((item) => ({
    month: item.month,
    monthLabel: formatMonthLabel(item.month),
    income: formatAmount(parseAmount(item.income)),
    expense: formatAmount(parseAmount(item.expense)),
    balance: formatAmount(parseAmount(item.balance)),
  }))
}

export function filterBillMonths(months: BillMonth[], filter: BillFilter) {
  return months
    .filter((item) => filter === 'all'
      ? parseAmount(item.income) > 0 || parseAmount(item.expense) > 0
      : filter === 'income'
        ? parseAmount(item.income) > 0
        : parseAmount(item.expense) > 0)
    .map((item) => {
      if (filter === 'all') return item
      const income = filter === 'income' ? parseAmount(item.income) : 0
      const expense = filter === 'expense' ? parseAmount(item.expense) : 0
      return {
        ...item,
        income: formatAmount(income),
        expense: formatAmount(expense),
        balance: formatAmount(income - expense),
      }
    })
    .sort((left, right) => right.month.localeCompare(left.month))
}

export function createBillPageState(year = getCurrentYear()): BillPageData & {
  activeFilter: BillFilter
  filters: Array<{ key: BillFilter; label: string }>
  isLoading: boolean
  errorMessage: string
} {
  const yearOptions = createRecentYearOptions().map((item) => `${item}年`)
  const yearIndex = Math.max(0, yearOptions.findIndex((item) => item === `${year}年`))
  return {
    year,
    yearOptions,
    yearIndex,
    periodLabel: `${year}年`,
    months: [],
    bills: [],
    totalIncome: '0.00',
    totalExpense: '0.00',
    totalBalance: '0.00',
    activeFilter: 'all',
    filters: getBillFilters(),
    isLoading: false,
    errorMessage: '',
  }
}

export function applyBillFilter(data: Pick<BillPageData, 'months' | 'year'>, filter: BillFilter): Pick<BillPageData, 'bills' | 'totalIncome' | 'totalExpense' | 'totalBalance' | 'periodLabel'> {
  const bills = filterBillMonths(data.months, filter)
  const totalIncome = bills.reduce((sum, item) => sum + parseAmount(item.income), 0)
  const totalExpense = bills.reduce((sum, item) => sum + parseAmount(item.expense), 0)
  const latestMonth = bills[0] ? getMonthNumber(bills[0].month) : 0
  return {
    bills,
    totalIncome: formatAmount(totalIncome),
    totalExpense: formatAmount(totalExpense),
    totalBalance: formatAmount(totalIncome - totalExpense),
    periodLabel: latestMonth ? `${data.year}年${latestMonth}月` : `${data.year}年`,
  }
}

export async function getBillPageData(year: number, filter: BillFilter): Promise<BillPageData> {
  const openId = await ensureOpenId()
  const data = await get<YearBillResponse>('/frontend/bookkeeping/transaction/year-bill', {
    openId,
    year,
  }, { skipToken: true })
  const months = createBillMonths(Array.isArray(data.months) ? data.months : [])
  return {
    year,
    yearOptions: createRecentYearOptions().map((item) => `${item}年`),
    yearIndex: Math.max(0, createRecentYearOptions().findIndex((item) => item === `${year}`)),
    months,
    ...applyBillFilter({ months, year }, filter),
  }
}

export function createBillDetailPageState(month: string): BillDetailPageData & {
  isLoading: boolean
  errorMessage: string
} {
  const monthNumber = getMonthNumber(month)
  return {
    month,
    title: `${monthNumber}月账单`,
    countText: '本月记账0次',
    totalIncome: '0.00',
    totalExpense: '0.00',
    totalBalance: '0.00',
    groups: [],
    isLoading: false,
    errorMessage: '',
  }
}

export async function getBillDetailPageData(month: string): Promise<BillDetailPageData> {
  const openId = await ensureOpenId()
  const data = await get<MonthDetailResponse>('/frontend/bookkeeping/transaction/month-bill/detail', {
    openId,
    month,
  }, { skipToken: true })
  const records = [
    ...(Array.isArray(data.rankings) ? data.rankings : []),
    ...(Array.isArray(data.incomeRankings) ? data.incomeRankings : []),
  ].sort((left, right) => String(right.occurredAt || '').localeCompare(String(left.occurredAt || '')))
  const groups = buildHomeRecentRecordGroups(records).map((group) => ({
    groupKey: group.groupKey,
    dateLabel: group.dateLabel,
    weekLabel: group.weekLabel,
    expenseText: parseAmount(group.expenseText) > 0 ? group.expenseText : '',
    incomeText: group.hasIncome ? group.incomeText : '',
    hasIncome: group.hasIncome,
    rows: group.records.map((record) => ({
      recordKey: record.recordKey,
      name: record.title,
      note: record.remark || record.title,
      amount: `${record.amountSign}${record.amountValue}`,
      icon: record.iconUrl,
      type: record.amountClass,
    })),
  }))
  return {
    month: data.month,
    title: `${getMonthNumber(data.month)}月账单`,
    countText: `本月记账${records.length}次`,
    totalIncome: formatAmount(parseAmount(data.totalIncome)),
    totalExpense: formatAmount(parseAmount(data.totalExpense)),
    totalBalance: formatAmount(parseAmount(data.totalBalance)),
    groups,
  }
}
