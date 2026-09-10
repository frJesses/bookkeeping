import { ensureOpenId } from './auth'
import { get } from './request'

type RankingDTO = {
  rankings: Array<{
    id: string
    categoryName: string
    categoryIcon: string | null
    categoryIconText: string | null
    categoryIconColor: string | null
    remark: string | null
    amount: string
    occurredAt: string
  }>
}

const DEFAULT_ICON_COLORS = ['#8fd12b', '#f0525b', '#f5ad1a', '#5b86e7', '#965bd9', '#b55ce8']

function resolveIconColor(value: string | null, index: number) {
  const color = String(value || '').trim()
  return /^#(?:[\da-f]{3}|[\da-f]{6})$/i.test(color)
    ? color
    : DEFAULT_ICON_COLORS[index % DEFAULT_ICON_COLORS.length]
}

function createIconBackgroundColor(color: string) {
  const hex = color.slice(1)
  const normalized = hex.length === 3 ? hex.split('').map((item) => `${item}${item}`).join('') : hex
  const red = parseInt(normalized.slice(0, 2), 16)
  const green = parseInt(normalized.slice(2, 4), 16)
  const blue = parseInt(normalized.slice(4, 6), 16)
  return `rgba(${red}, ${green}, ${blue}, .12)`
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
    records: rankings.map((item, index) => {
      const categoryIconColor = resolveIconColor(item.categoryIconColor, index)
      return {
        id: item.id,
        category: item.categoryName || '其它',
        categoryIcon: item.categoryIcon || '',
        categoryIconText: item.categoryIconText || (item.categoryName || '其').slice(0, 1),
        categoryIconColor,
        categoryIconBackgroundColor: createIconBackgroundColor(categoryIconColor),
        remarkText: item.remark || '',
        amountText: formatRankingAmount(item.amount),
        dateText: formatRankingDate(item.occurredAt),
      }
    }),
    rankingLoading: false,
    rankingError: '',
  }
}
