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
export type MonthTrendPoint = {
  day: string
  value: number
}
export type MonthCompareItem = {
  monthLabel: string
  value: number
  active?: boolean
}
export type MonthChangeItem = {
  rank: number
  name: string
  deltaText: string
  trend: 'up' | 'down'
  icon: string
}
export type BillMonthDetailData = {
  year: number
  month: number
  monthLabel: string
  relationshipText: string
  currentBalanceText: string
  previousBalanceText: string
  expenseAmountText: string
  incomeAmountText: string
  expenseRatio: number
  incomeRatio: number
  categories: MonthCategoryBreakdownItem[]
  rankings: MonthRankingItem[]
  trendSummary: Array<{ label: string; value: string; note: string }>
  trendPoints: MonthTrendPoint[]
  compareItems: MonthCompareItem[]
  changeItems: MonthChangeItem[]
  achievementItems: Array<{ value: string; label: string }>
  shareItems: Array<{ name: string; color: string; icon: string }>
}
export const BILL_MONTH_DETAIL_MAP: Record<string, BillMonthDetailData> = {
  '2025-09': {
    year: 2025,
    month: 9,
    monthLabel: '9月账单',
    relationshipText: '这是你和蓝鱼记账相识的第61天',
    currentBalanceText: '-2801.30',
    previousBalanceText: '-3316.03',
    expenseAmountText: '2801.30',
    incomeAmountText: '0.00',
    expenseRatio: 100,
    incomeRatio: 0,
    categories: [
      { name: '住房', amount: 1330, ratioText: '47.5%', color: '#7c7ef3', icon: '房' },
      { name: '餐饮', amount: 498, ratioText: '17.8%', color: '#21c18b', icon: '餐' },
      { name: '买菜', amount: 339.42, ratioText: '12.1%', color: '#ff9f1a', icon: '菜' },
      { name: '快递', amount: 241, ratioText: '8.6%', color: '#ffd43b', icon: '递' },
      { name: '社交', amount: 170, ratioText: '6.1%', color: '#39b8f2', icon: '交' },
      { name: '其它', amount: 222.88, ratioText: '7.9%', color: '#ff5f9a', icon: '其' },
    ],
    rankings: [
      { rank: 1, name: '住房', amount: '-1330', dateText: '9月1日', icon: '房' },
      { rank: 2, name: '餐饮', amount: '-498', dateText: '9月11日', icon: '餐' },
      { rank: 3, name: '买菜', amount: '-189.42', dateText: '9月7日', icon: '菜' },
    ],
    trendSummary: [
      { label: '单日支出最高', value: '1363.45', note: '9月1日' },
      { label: '日均支出', value: '93.38', note: '' },
      { label: '本月支出', value: '2801.30', note: '' },
    ],
    trendPoints: [
      { day: '01', value: 1363.45 },
      { day: '05', value: 15 },
      { day: '09', value: 184.2 },
      { day: '12', value: 487.6 },
      { day: '15', value: 95.4 },
      { day: '22', value: 312.2 },
      { day: '30', value: 18.8 },
    ],
    compareItems: [
      { monthLabel: '4月', value: 0 },
      { monthLabel: '5月', value: 0 },
      { monthLabel: '6月', value: 0 },
      { monthLabel: '7月', value: 357 },
      { monthLabel: '8月', value: 3316 },
      { monthLabel: '9月', value: 2801, active: true },
    ],
    changeItems: [
      { rank: 1, name: '餐饮', deltaText: '下降 533.01', trend: 'down', icon: '餐' },
      { rank: 2, name: '买菜', deltaText: '增长 312.22', trend: 'up', icon: '菜' },
      { rank: 3, name: '快递', deltaText: '增长 220', trend: 'up', icon: '箱' },
    ],
    achievementItems: [
      { value: '0天', label: '已连续打卡' },
      { value: '61天', label: '记账总天数' },
      { value: '75笔', label: '记账总笔数' },
    ],
    shareItems: [
      { name: '保存图片', color: '#57b9ff', icon: '↓' },
      { name: '微信', color: '#1ecf4f', icon: '微' },
      { name: '朋友圈', color: '#15c643', icon: '圈' },
      { name: 'QQ', color: '#37a8ff', icon: 'Q' },
    ],
  },
}
