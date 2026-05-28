export type HomeRecordItem = {
  id: number
  title: string
  timeText: string
  amountText: string
  amountClass: 'expense' | 'income'
  tagText: string
  avatarText: string
}

export type HomePageState = {
  nickname: string
  statusText: string
  disposableAmountText: string
  monthIncomeText: string
  monthExpenseText: string
  trendText: string
  recentRecords: HomeRecordItem[]
}

export function createHomePageState(): HomePageState {
  return {
    nickname: '',
    statusText: '',
    disposableAmountText: '',
    monthIncomeText: '',
    monthExpenseText: '',
    trendText: '',
    recentRecords: [],
  }
}

export async function getHomePageData() {
  return createHomePageState()
}
