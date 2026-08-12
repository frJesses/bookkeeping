export type MonthCategoryBreakdownItem = {
  name: string
  amount: number
  ratioText: string
  color: string
  icon: string
}
export type MonthRankingItem = {
  rank: number
  name: string
  amount: string
  dateText: string
  icon: string
}
export type MonthTrendPoint = { day: string; value: number }
export type MonthCompareItem = { monthLabel: string; value: number; active?: boolean }
