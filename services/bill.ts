import {
  createBillYearOptions,
  type AnnualSummary,
  type BillMode,
  type BillYearOption,
} from '../constants/bill'
import { get } from './request'
import { ensureOpenId } from './auth'
export type BillPageState = {
  billLoading: boolean
  billError: string
  activeMode: BillMode
  selectedYear: number
  currentYear: number
  selectedYearIndex: number
  yearOptions: BillYearOption[]
  statusBarHeight: number
  navBarHeight: number
  capsuleTop: number
  capsuleHeight: number
  capsuleWidth: number
  capsuleRight: number
  amountVisible: boolean
  summaryTitle: string
  summaryBalanceText: string
  summaryIncomeText: string
  summaryExpenseText: string
  coverTitle: string
  coverActionText: string
  showAnnualCover: boolean
  hasAnnualBill: boolean
  annualRows: AnnualMonthRow[]
}
export type AnnualMonthRow = {
  periodKey: string
  periodLabel: string
  incomeText: string
  expenseText: string
  balanceText: string
  balanceClass: 'income' | 'expense'
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
function formatAmount(value: number) {
  return value.toFixed(2)
}
function parseAmount(value: string) {
  const amount = Number(value || 0)
  return Number.isNaN(amount) ? 0 : amount
}
function createAnnualRows(summary: AnnualSummary): AnnualMonthRow[] {
  return summary.months.map((item) => ({
    periodKey: `month-${item.month}`,
    periodLabel: `${item.month}月`,
    incomeText: formatAmount(item.income),
    expenseText: formatAmount(item.expense),
    balanceText: item.balance >= 0 ? formatAmount(item.balance) : `-${formatAmount(Math.abs(item.balance))}`,
    balanceClass: item.balance >= 0 ? 'income' : 'expense',
  }))
}
function createYearRow(summary: AnnualSummary): AnnualMonthRow[] {
  return [
    {
      periodKey: `year-${summary.year}`,
      periodLabel: `${summary.year}年`,
      incomeText: formatAmount(summary.totalIncome),
      expenseText: formatAmount(summary.totalExpense),
      balanceText:
        summary.totalBalance >= 0
          ? formatAmount(summary.totalBalance)
          : `-${formatAmount(Math.abs(summary.totalBalance))}`,
      balanceClass: summary.totalBalance >= 0 ? 'income' : 'expense',
    },
  ]
}
function mapYearBillToSummary(data: YearBillDTO): AnnualSummary {
  const year = Number(data.year)
  const months = Array.isArray(data.months) ? data.months : []
  return {
    year: Number.isNaN(year) ? new Date().getFullYear() : year,
    totalIncome: parseAmount(data.totalIncome),
    totalExpense: parseAmount(data.totalExpense),
    totalBalance: parseAmount(data.totalBalance),
    coverTitle: `我的 ${data.year} 年度账单`,
    coverActionText: '',
    months: months.map((item) => {
      const monthValue = Number((item.month || '').split('-')[1] || 0)
      return {
        month: Number.isNaN(monthValue) ? 0 : monthValue,
        income: parseAmount(item.income),
        expense: parseAmount(item.expense),
        balance: parseAmount(item.balance),
      }
    }),
  }
}
function createEmptyBillPageData(input: { year: number; mode: BillMode }, yearOptions: BillYearOption[]) {
  const currentYear = new Date().getFullYear()
  return {
    billLoading: false,
    billError: '',
    activeMode: input.mode,
    selectedYear: input.year,
    currentYear,
    selectedYearIndex: yearOptions.findIndex((item) => item.value === input.year),
    yearOptions,
    summaryTitle: '年结余',
    summaryBalanceText: '0.00',
    summaryIncomeText: '0.00',
    summaryExpenseText: '0.00',
    coverTitle: '',
    coverActionText: '',
    showAnnualCover: false,
    hasAnnualBill: false,
    annualRows: [],
  }
}
function createBillPageDataFromSummary(input: { year: number; mode: BillMode }, yearOptions: BillYearOption[], summary: AnnualSummary) {
  const currentYear = new Date().getFullYear()
  const hasAnnualBill = summary.months.some((item) => item.income > 0 || item.expense > 0) || summary.totalIncome > 0 || summary.totalExpense > 0
  return {
    billLoading: false,
    billError: '',
    activeMode: input.mode,
    selectedYear: input.year,
    currentYear,
    selectedYearIndex: yearOptions.findIndex((item) => item.value === input.year),
    yearOptions,
    summaryTitle: '年结余',
    summaryBalanceText:
      summary.totalBalance >= 0
        ? formatAmount(summary.totalBalance)
        : `-${formatAmount(Math.abs(summary.totalBalance))}`,
    summaryIncomeText: formatAmount(summary.totalIncome),
    summaryExpenseText: formatAmount(summary.totalExpense),
    coverTitle: summary.coverTitle,
    coverActionText: '点击开启',
    showAnnualCover: input.mode !== 'year' && input.year !== currentYear,
    hasAnnualBill,
    annualRows: input.mode === 'year' ? createYearRow(summary) : createAnnualRows(summary),
  }
}
export function createBillPageState(): BillPageState {
  const yearOptions = createBillYearOptions()
  const selectedYear = yearOptions[0].value
  return {
    billLoading: true,
    billError: '',
    activeMode: 'month',
    selectedYear,
    currentYear: new Date().getFullYear(),
    selectedYearIndex: 0,
    yearOptions,
    statusBarHeight: 20,
    navBarHeight: 44,
    capsuleTop: 0,
    capsuleHeight: 32,
    capsuleWidth: 96,
    capsuleRight: 16,
    amountVisible: true,
    summaryTitle: '年结余',
    summaryBalanceText: '0.00',
    summaryIncomeText: '0.00',
    summaryExpenseText: '0.00',
    coverTitle: '',
    coverActionText: '',
    showAnnualCover: false,
    hasAnnualBill: false,
    annualRows: [],
  }
}
export function createBillHeaderLayout() {
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
export async function getBillPageData(input: { year: number; mode: BillMode }) {
  const yearOptions = createBillYearOptions()
  const openId = await ensureOpenId()
  const data = await get<YearBillDTO>('/frontend/bookkeeping/transaction/year-bill', {
    openId,
    year: `${input.year}`,
  }, {
    skipToken: true,
  })
  if (!data || !Array.isArray(data.months)) {
    return createEmptyBillPageData(input, yearOptions)
  }
  return createBillPageDataFromSummary(input, yearOptions, mapYearBillToSummary(data))
}
