import { applyBillFilter, createBillPageState, getBillPageData, type BillFilter } from '../../services/bill'
import { getWindowInfo } from '../../utils/system-info'

type BillPageInstance = WechatMiniprogram.Page.Instance<WechatMiniprogram.IAnyObject, WechatMiniprogram.IAnyObject> & {
  data: ReturnType<typeof createBillPageState>
  billInitialized: boolean
  requestVersion: number
}

const initialState = createBillPageState()

Page({
  data: initialState,
  onLoad(this: BillPageInstance) {
    this.setData({ statusBarHeight: getWindowInfo().statusBarHeight || 20 })
    void this.loadPageData()
  },
  onShow(this: BillPageInstance) {
    if (this.billInitialized && !this.data.isLoading) {
      void this.loadPageData()
    }
  },
  async loadPageData(this: BillPageInstance) {
    this.billInitialized = true
    this.requestVersion += 1
    const requestVersion = this.requestVersion
    this.setData({ isLoading: true, errorMessage: '' })
    try {
      const data = await getBillPageData(this.data.year, this.data.activeFilter)
      if (requestVersion !== this.requestVersion) return
      this.setData({ ...data, isLoading: false, errorMessage: '' })
    } catch (error) {
      if (requestVersion !== this.requestVersion) return
      console.error('load bill page failed', error)
      this.setData({ isLoading: false, errorMessage: '账单加载失败，请稍后重试' })
    }
  },
  selectFilter(this: BillPageInstance, e: WechatMiniprogram.BaseEvent) {
    const filter = e.currentTarget.dataset.filter as BillFilter | undefined
    if (!filter || filter === this.data.activeFilter) return
    this.setData({
      activeFilter: filter,
      ...applyBillFilter(this.data, filter),
    })
  },
  selectYear(this: BillPageInstance, e: WechatMiniprogram.CustomEvent<{ value?: string | number }>) {
    const index = Number(e.detail.value)
    const label = this.data.yearOptions[index]
    const year = Number(String(label || '').replace('年', ''))
    if (!year || year === this.data.year) return
    this.setData({ year, yearIndex: index, months: [], bills: [] })
    void this.loadPageData()
  },
  openDetail(e: WechatMiniprogram.BaseEvent) {
    const month = String(e.currentTarget.dataset.month || '')
    if (!/^\d{4}-\d{2}$/.test(month)) return
    wx.navigateTo({ url: `/pages/bill/record-detail/index?month=${encodeURIComponent(month)}` })
  },
  handleRetry(this: BillPageInstance) {
    void this.loadPageData()
  },
  goBack() {
    if (getCurrentPages().length > 1) {
      wx.navigateBack()
      return
    }
    wx.switchTab({ url: '/pages/profile/profile' })
  },
  billInitialized: false,
  requestVersion: 0,
})
