import { BUDGET_MONTH_LABELS, type BudgetMonthItem } from '../constants/budget'

export type BudgetPageState = {
  hasBudget: boolean
  isEditing: boolean
  yearBudget: string
  monthlyBudgets: BudgetMonthItem[]
}

export function buildMonthlyBudgets(): BudgetMonthItem[] {
  return BUDGET_MONTH_LABELS.map((label, index) => ({
    key: `m${index + 1}`,
    label,
    value: '',
  }))
}

export function createBudgetPageState(): BudgetPageState {
  return {
    hasBudget: false,
    isEditing: false,
    yearBudget: '',
    monthlyBudgets: buildMonthlyBudgets(),
  }
}

export function updateMonthlyBudget(items: BudgetMonthItem[], monthIndex: number, value: string) {
  return items.map((item, currentIndex) => (currentIndex === monthIndex ? { ...item, value } : item))
}

export async function getBudgetPageData() {
  return createBudgetPageState()
}

export async function saveBudgetPageData(_: {
  yearBudget: string
  monthlyBudgets: BudgetMonthItem[]
}) {
  return null
}
