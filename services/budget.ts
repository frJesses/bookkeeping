import { getCategoryOptions, type AddCategoryItem } from './add'
import { ensureOpenId } from './auth'
import { del, get, put } from './request'
import { getStatsPageData } from './stats'

const SETTINGS_CATEGORY_NAME = '设置'

export type BudgetMonth = {
  value: string
  label: string
  added: boolean
  active: boolean
}

export type BudgetCategory = {
  id: string | number
  name: string
  icon: string
  value: number
  spent: number
  percent: number
  isDraft?: boolean
}

export type BudgetPageData = {
  year: number
  month: string
  months: BudgetMonth[]
  income: number
  totalBudget: number
  remainingBudget: number
  categories: BudgetCategory[]
  categoryCandidates: AddCategoryItem[]
}

type BudgetDetailResponse = {
  exists: boolean
  id?: string
  month: string
  income: string | null
  totalBudget?: string
  totalSpent?: string
  remainingBudget?: string
  usagePercent?: number
  configuredMonths: string[]
  items: Array<{
    id: string
    categoryId: string
    amount: string
    spent?: string
    usagePercent?: number
  }>
}

export type BudgetSummary = {
  configured: boolean
  totalBudget: number
  totalSpent: number
  remainingBudget: number
  usagePercent: number
}

function pad(value: number) {
  return `${value}`.padStart(2, '0')
}

export function getCurrentBudgetMonth() {
  const now = new Date()
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}`
}

export function createBudgetMonths(activeMonth: string, configuredMonths: string[] = []) {
  const configured = new Set(configuredMonths)
  const year = Number(activeMonth.slice(0, 4))
  return Array.from({ length: 12 }, (_, index) => {
    const value = `${year}-${pad(index + 1)}`
    return {
      value,
      label: `${index + 1}月`,
      added: configured.has(value),
      active: value === activeMonth,
    }
  })
}

export async function getBudgetPageData(month = getCurrentBudgetMonth()): Promise<BudgetPageData> {
  const openId = await ensureOpenId()
  const [categoryCandidates, stats, budget] = await Promise.all([
    getCategoryOptions('expense'),
    getStatsPageData(month, 'month', 'expense').catch(() => null),
    get<BudgetDetailResponse>('/frontend/bookkeeping/budget/detail', {
      openId,
      month,
    }, { skipToken: true }),
  ])
  const spentMap = new Map(((stats && stats.allCategories) || []).map((item) => [item.name, Number(item.value || 0)]))
  const itemMap = new Map((budget.items || []).map((item) => [String(item.categoryId), item]))
  const income = budget.exists ? Number(budget.income || 0) : Number((stats && stats.totalIncome) || 0)
  const categories = categoryCandidates
    .filter((item) => item.name !== SETTINGS_CATEGORY_NAME && itemMap.has(`${item.id}`))
    .map((item) => {
      const budgetItem = itemMap.get(`${item.id}`)
      const spent = !budgetItem || budgetItem.spent == null
        ? (spentMap.get(item.name) || 0)
        : Number(budgetItem.spent || 0)
      const value = Number((budgetItem && budgetItem.amount) || 0)
      return {
        id: item.id,
        name: item.name,
        icon: item.icon,
        value,
        spent,
        percent: value > 0 ? Math.round((spent / value) * 100) : 0,
      }
    })
  const totalBudget = categories.reduce((sum, item) => sum + item.value, 0)
  return {
    year: Number(month.slice(0, 4)),
    month,
    months: createBudgetMonths(month, budget.configuredMonths || []),
    income,
    totalBudget,
    remainingBudget: income - totalBudget,
    categories,
    categoryCandidates: categoryCandidates.filter((item) => item.name !== SETTINGS_CATEGORY_NAME),
  }
}

export async function getBudgetSummary(month = getCurrentBudgetMonth()): Promise<BudgetSummary> {
  const openId = await ensureOpenId()
  const budget = await get<BudgetDetailResponse>('/frontend/bookkeeping/budget/detail', {
    openId,
    month,
  }, { skipToken: true })
  const totalBudget = budget.totalBudget == null
    ? (budget.items || []).reduce((sum, item) => sum + Number(item.amount || 0), 0)
    : Number(budget.totalBudget || 0)
  const totalSpent = budget.totalSpent == null
    ? (budget.items || []).reduce((sum, item) => sum + Number(item.spent || 0), 0)
    : Number(budget.totalSpent || 0)
  const remainingBudget = budget.remainingBudget == null
    ? totalBudget - totalSpent
    : Number(budget.remainingBudget || 0)
  const usagePercent = budget.usagePercent == null
    ? (totalBudget > 0 ? Math.min(100, Number(((totalSpent / totalBudget) * 100).toFixed(2))) : 0)
    : Number(budget.usagePercent || 0)
  return {
    configured: Boolean(budget.exists && totalBudget > 0),
    totalBudget,
    totalSpent,
    remainingBudget,
    usagePercent,
  }
}

export async function saveBudgetPageData(
  month: string,
  income: number,
  categories: BudgetCategory[],
) {
  const openId = await ensureOpenId()
  return put<BudgetDetailResponse>('/frontend/bookkeeping/budget/save', {
    openId,
    month,
    income: Math.max(0, Number(income || 0)).toFixed(2),
    items: categories.map((item) => ({
      categoryId: item.id,
      amount: Math.max(0, Number(item.value || 0)).toFixed(2),
    })),
  }, { skipToken: true })
}

export async function deleteBudgetCategory(month: string, categoryId: string | number) {
  const openId = await ensureOpenId()
  return del<BudgetDetailResponse>('/frontend/bookkeeping/budget/item', {
    openId,
    month,
    categoryId,
  }, { skipToken: true })
}

export function addBudgetCategory(categories: BudgetCategory[], category: AddCategoryItem) {
  if (categories.some((item) => `${item.id}` === `${category.id}`)) return categories
  return [
    ...categories,
    {
      id: category.id,
      name: category.name,
      icon: category.icon,
      value: 0,
      spent: 0,
      percent: 0,
      isDraft: true,
    },
  ]
}
