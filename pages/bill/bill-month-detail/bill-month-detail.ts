import { createBillMonthDetailState, getBillMonthDetailState } from '../../../services/bill-month-detail'

function getCurrentMonthParts() {
  const now = new Date()
  return { year: `${now.getFullYear()}`, month: `${now.getMonth() + 1}`.padStart(2, '0') }
}

Page({
  data: {
    ...createBillMonthDetailState(),
    headerSolid: false,
  },
  onLoad(options: Record<string, string | undefined>) {
    const current = getCurrentMonthParts()
    const year = options.year || current.year
    const month = (options.month || current.month).padStart(2, '0')
    void this.loadDetail(`${year}-${month}`)
  },
  async loadDetail(monthKey: string) {
    this.setData({ detailLoading: true, detailError: '', monthKey })
    try {
      this.setData(await getBillMonthDetailState(monthKey))
    } catch (error) {
      console.error('load month bill detail failed', error)
      this.setData({
        detailLoading: false,
        detailError: error instanceof Error ? error.message : '月度详情加载失败',
      })
    }
  },
  handleRetry() {
    void this.loadDetail(this.data.monthKey)
  },
  handlePageScroll(e: WechatMiniprogram.ScrollViewScroll) {
    const headerSolid = e.detail.scrollTop > 64
    if (headerSolid !== this.data.headerSolid) this.setData({ headerSolid })
  },
  goBack() {
    wx.navigateBack()
  },
  goToRanking() {
    wx.navigateTo({
      url: `/pages/bill/bill-ranking/index?year=${this.data.year}&month=${String(this.data.month).padStart(2, '0')}`,
    })
  },
})
