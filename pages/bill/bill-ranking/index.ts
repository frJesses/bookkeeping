import { createBillRankingPageState } from '../../../services/bill-ranking'
Page({
  data: {
    ...createBillRankingPageState(),
  },
  onLoad(options: Record<string, string | undefined>) {
    const year = options.year || '2025'
    const month = options.month || '09'
    this.setData(createBillRankingPageState(`${year}-${month}`))
    wx.setNavigationBarTitle({
      title: `${year}年${Number(month)}月支出排行`,
    })
  },
})
