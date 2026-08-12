import { ensureOpenId } from './auth'
import { get } from './request'

type RankingDTO = {
  rankings: Array<{
    id: string
    categoryName: string
    categoryIcon: string | null
    categoryIconText: string | null
    amount: string
    occurredAt: string
  }>
}

function formatRankingAmount(value: string) {
  const amount = Number(value || 0)
  const amountText = amount.toFixed(2).replace(/\.00$/, '').replace(/(\.\d)0$/, '$1')
  return `-${amountText}`
}

function formatRankingDate(value: string) {
  const dateParts = String(value || '').slice(5, 10).split('-')
  return dateParts.length === 2 ? `${dateParts[0]}月${dateParts[1]}日` : ''
}

export function createBillRankingPageState(monthKey = '') {
  return {
    monthKey,
    records: [] as Array<Record<string, unknown>>,
    rankingLoading: true,
    rankingError: '',
  }
}

export async function getBillRankingPageState(monthKey: string) {
  const openId = await ensureOpenId()
  const data = await get<RankingDTO>('/frontend/bookkeeping/transaction/month-bill/detail', {
    openId,
    month: monthKey,
  }, { skipToken: true })
  const rankings = data && Array.isArray(data.rankings)
    ? data.rankings.slice().sort((left, right) => Number(right.amount || 0) - Number(left.amount || 0))
    : []
  return {
    monthKey,
    records: rankings.map((item) => ({
      id: item.id,
      category: item.categoryName || '其它',
      categoryIcon: item.categoryIcon || '',
      categoryIconText: item.categoryIconText || (item.categoryName || '其').slice(0, 1),
      amountText: formatRankingAmount(item.amount),
      dateText: formatRankingDate(item.occurredAt),
    })),
    rankingLoading: false,
    rankingError: '',
  }
}
