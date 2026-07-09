import { BILL_RANKING_MAP, type BillRankingData } from '../constants/bill-ranking'
export type BillRankingPageState = BillRankingData & {
  recordCountText: string
}
export function createBillRankingPageState(monthKey = '2025-09'): BillRankingPageState {
  const data = BILL_RANKING_MAP[monthKey] || BILL_RANKING_MAP['2025-09']
  const records = [...data.records].sort((left, right) => right.amount - left.amount)
  return {
    ...data,
    records,
    recordCountText: `${records.length} 笔支出`,
  }
}
