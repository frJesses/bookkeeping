import { createBillRankingPageState, getBillRankingPageState } from '../../../services/bill-ranking'

Page({
  data: {
    ...createBillRankingPageState(),
  },
  onLoad(options: Record<string, string | undefined>) {
    const now = new Date()
    const year = options.year || `${now.getFullYear()}`
    const month = (options.month || `${now.getMonth() + 1}`).padStart(2, '0')
    const monthKey = `${year}-${month}`
    wx.setNavigationBarTitle({ title: `${year}年${Number(month)}月支出排行` })
    void this.loadRanking(monthKey)
  },
  async loadRanking(monthKey: string) {
    this.setData({ ...createBillRankingPageState(monthKey), rankingLoading: true })
    try {
      this.setData(await getBillRankingPageState(monthKey))
    } catch (error) {
      console.error('load bill ranking failed', error)
      this.setData({
        rankingLoading: false,
        rankingError: error instanceof Error ? error.message : '支出排行加载失败',
      })
    }
  },
  handleRetry() {
    void this.loadRanking(this.data.monthKey)
  },
})
