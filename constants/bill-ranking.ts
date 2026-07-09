export type BillRankingRecord = {
  id: string
  title: string
  category: string
  categoryIcon: string
  amount: number
  amountText: string
  dateText: string
  note: string
}
export type BillRankingData = {
  monthKey: string
  monthLabel: string
  summaryText: string
  totalExpenseText: string
  records: BillRankingRecord[]
}
export const BILL_RANKING_MAP: Record<string, BillRankingData> = {
  '2025-09': {
    monthKey: '2025-09',
    monthLabel: '9月消费记录',
    summaryText: '按消费金额从高到低排列',
    totalExpenseText: '¥2,801.30',
    records: [
      {
        id: '2025-09-01-rent',
        title: '9月房租',
        category: '住房',
        categoryIcon: '房',
        amount: 1330,
        amountText: '-¥1,330.00',
        dateText: '09-01 09:20',
        note: '月初固定支出',
      },
      {
        id: '2025-09-11-food',
        title: '朋友聚餐',
        category: '餐饮',
        categoryIcon: '餐',
        amount: 498,
        amountText: '-¥498.00',
        dateText: '09-11 19:42',
        note: '火锅店 AA 补差',
      },
      {
        id: '2025-09-07-grocery',
        title: '周末大采购',
        category: '买菜',
        categoryIcon: '菜',
        amount: 339.42,
        amountText: '-¥339.42',
        dateText: '09-07 17:26',
        note: '盒马生鲜',
      },
      {
        id: '2025-09-15-express',
        title: '家居快递补款',
        category: '快递',
        categoryIcon: '递',
        amount: 241,
        amountText: '-¥241.00',
        dateText: '09-15 13:08',
        note: '衣架和收纳箱',
      },
      {
        id: '2025-09-20-social',
        title: '同事生日礼物',
        category: '社交',
        categoryIcon: '交',
        amount: 170,
        amountText: '-¥170.00',
        dateText: '09-20 18:15',
        note: '一起凑份子',
      },
      {
        id: '2025-09-09-market',
        title: '晚餐食材',
        category: '买菜',
        categoryIcon: '菜',
        amount: 128.8,
        amountText: '-¥128.80',
        dateText: '09-09 18:03',
        note: '蔬菜水果',
      },
      {
        id: '2025-09-27-food',
        title: '工作日午餐',
        category: '餐饮',
        categoryIcon: '餐',
        amount: 75.2,
        amountText: '-¥75.20',
        dateText: '09-27 12:11',
        note: '写字楼简餐',
      },
      {
        id: '2025-09-30-other',
        title: '临时补给',
        category: '其它',
        categoryIcon: '其',
        amount: 19.08,
        amountText: '-¥19.08',
        dateText: '09-30 21:06',
        note: '纸巾和电池',
      },
    ],
  },
}
