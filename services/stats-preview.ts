import { ensureOpenId } from './auth'
import { get } from './request'

type PreviewDetail = {
  totalExpense: string
  totalIncome: string
  totalBalance: string
  days: Array<{ date: string }>
  rankings: unknown[]
  incomeRankings: unknown[]
}

export type StatsPreviewPageData = {
  month: string
  previewTitle: string
  totalIncome: string
  totalExpense: string
  totalBalance: string
  totalCount: string
  currentExpense: string
  previousExpense: string
  currentDailyExpense: string
  previousDailyExpense: string
}

function shiftMonth(month: string, offset: number) {
  const [year, monthNumber] = month.split('-').map(Number)
  const date = new Date(year, monthNumber - 1 + offset, 1)
  return `${date.getFullYear()}-${`${date.getMonth() + 1}`.padStart(2, '0')}`
}

function amount(value: string) {
  const parsed = Number(value || 0)
  return Number.isFinite(parsed) ? parsed : 0
}

function averageExpense(detail: PreviewDetail) {
  const dayCount = Array.isArray(detail.days) ? detail.days.length : 0
  return dayCount ? amount(detail.totalExpense) / dayCount : 0
}

export async function getStatsPreviewPageData(month: string): Promise<StatsPreviewPageData> {
  const openId = await ensureOpenId()
  const [current, previous] = await Promise.all([
    get<PreviewDetail>('/frontend/bookkeeping/transaction/month-bill/detail', { openId, month }, { skipToken: true }),
    get<PreviewDetail>('/frontend/bookkeeping/transaction/month-bill/detail', { openId, month: shiftMonth(month, -1) }, { skipToken: true }),
  ])
  const totalCount = (current.rankings || []).length + (current.incomeRankings || []).length
  return {
    month,
    previewTitle: `${Number(month.slice(5))}月收支预览`,
    totalIncome: amount(current.totalIncome).toFixed(2),
    totalExpense: amount(current.totalExpense).toFixed(2),
    totalBalance: amount(current.totalBalance).toFixed(2),
    totalCount: `${totalCount}`,
    currentExpense: amount(current.totalExpense).toFixed(2),
    previousExpense: amount(previous.totalExpense).toFixed(2),
    currentDailyExpense: averageExpense(current).toFixed(2),
    previousDailyExpense: averageExpense(previous).toFixed(2),
  }
}
