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
  { label: '月账单', value: 'month' },
  { label: '年账单', value: 'year' },
]
export function createBillYearOptions() {
  const currentYear = new Date().getFullYear()
  return Array.from({ length: 8 }, (_, index) => ({
    label: `${currentYear - index}年`,
    value: currentYear - index,
  }))
}
