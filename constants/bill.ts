export type BillMode = 'month' | 'year'
export type AnnualMonthItem = {
  month: number
  income: number
  expense: number
  balance: number
}
export type AnnualSummary = {
  year: number
  totalIncome: number
  totalExpense: number
  totalBalance: number
  months: AnnualMonthItem[]
  coverTitle: string
  coverActionText: string
}
export type BillYearOption = {
  label: string
  value: number
}
export const BILL_MODE_OPTIONS: Array<{ label: string; value: BillMode }> = [
  {
    label: '月账单',
    value: 'month',
  },
  {
    label: '年账单',
    value: 'year',
  },
]
export function createBillYearOptions() {
  const currentYear = new Date().getFullYear()
  return Array.from({ length: 8 }, (_, index) => {
    const year = currentYear - index
    return {
      label: `${year}年`,
      value: year,
    }
  })
}
export const BILL_ANNUAL_DATA: Record<number, AnnualSummary> = {
  2025: {
    year: 2025,
    totalIncome: 0,
    totalExpense: 6474.74,
    totalBalance: -6474.74,
    coverTitle: '我的 2025 年度账单',
    coverActionText: '点击开启',
    months: [
      { month: 9, income: 0, expense: 2801.3, balance: -2801.3 },
      { month: 8, income: 0, expense: 3316.03, balance: -3316.03 },
      { month: 7, income: 0, expense: 357.41, balance: -357.41 },
      { month: 6, income: 0, expense: 0, balance: 0 },
      { month: 5, income: 0, expense: 0, balance: 0 },
      { month: 4, income: 0, expense: 0, balance: 0 },
      { month: 3, income: 0, expense: 0, balance: 0 },
      { month: 2, income: 0, expense: 0, balance: 0 },
      { month: 1, income: 0, expense: 0, balance: 0 },
    ],
  },
}
