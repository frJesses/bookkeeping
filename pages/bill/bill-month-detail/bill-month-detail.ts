import { createBillMonthDetailState, getBillMonthDetailState } from '../../../services/bill-month-detail'
Page({
  data: {
    ...createBillMonthDetailState(),
    headerSolid: false,
  },
  async onLoad(options: Record<string, string | undefined>) {
    const year = options.year || '2025'
    const month = options.month || '09'
    try {
      const data = await getBillMonthDetailState(`${year}-${month}`)
      this.setData(data)
    } catch (error) {
      console.error('load month bill detail failed', error)
      this.setData(createBillMonthDetailState(`${year}-${month}`))
    }
  },
  handlePageScroll(e: WechatMiniprogram.ScrollViewScroll) {
    const headerSolid = e.detail.scrollTop > 88
    if (headerSolid === this.data.headerSolid) {
      return
    }
    this.setData({ headerSolid })
  },
  goBack() {
    wx.navigateBack()
  },
  goToRanking() {
    const month = String(this.data.month).padStart(2, '0')
    wx.navigateTo({
      url: `/pages/bill/bill-ranking/index?year=${this.data.year}&month=${month}`,
    })
  },
})
