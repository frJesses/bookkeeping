export type BillListItem = {
  id: number
  avatarText: string
  title: string
  timeText: string
  amountText: string
  amountClass: 'expense' | 'income'
  tagText: string
}

export type BillGroupItem = {
  date: string
  dateLabel: string
  summaryText: string
  items: BillListItem[]
}

export type BillPageState = {
  amountVisible: boolean
  monthLabel: string
  todayExpenseText: string
  monthExpenseText: string
  monthIncomeText: string
  groups: BillGroupItem[]
}

export function createBillPageState(): BillPageState {
  return {
    amountVisible: true,
    monthLabel: '',
    todayExpenseText: '',
    monthExpenseText: '',
    monthIncomeText: '',
    groups: [],
  }
}

export async function getBillPageData() {
  return createBillPageState()
}
