import { createTabBarBehavior, type TabBarBehaviorPageInstance } from '../../behaviors/tabbar'
import { type BillMode } from '../../constants/bill'
import { createBillHeaderLayout, createBillPageState, getBillPageData } from '../../services/bill'
type BillPageInstance = TabBarBehaviorPageInstance & {
  billInitialized: boolean
  loadPageDataTask: Promise<void> | null
}
Page({
  behaviors: [createTabBarBehavior('/pages/bill/bill')],
  data: {
    ...createBillPageState(),
    ...createBillHeaderLayout(),
  },
  onLoad(this: BillPageInstance) {
    this.initTabBarLayout()
  },
  onReady(this: BillPageInstance) {
    void this.loadPageData()
  },
  onShow(this: BillPageInstance) {
    this.syncTabBarState()
    if (this.billInitialized) {
      void this.loadPageData()
    }
  },
  async loadPageData(this: BillPageInstance) {
    if (this.loadPageDataTask) {
      return this.loadPageDataTask
    }
    const task = this.performLoadPageData()
    this.loadPageDataTask = task
    try {
      await task
    } finally {
      if (this.loadPageDataTask === task) {
        this.loadPageDataTask = null
      }
    }
  },
  async performLoadPageData(this: BillPageInstance) {
    try {
      this.billInitialized = true
      this.setData({
        billLoading: true,
      })
      const data = await getBillPageData({
        year: this.data.selectedYear,
        mode: this.data.activeMode,
      })
      this.setData({
        ...data,
        billLoading: false,
      })
    } catch (error) {
      this.setData({
        billLoading: false,
      })
      console.error('load bill page failed', error)
    }
  },
  async handleModeChange(this: BillPageInstance, e: WechatMiniprogram.CustomEvent<{ mode?: BillMode }>) {
    const { mode } = e.detail
    if (!mode || mode === this.data.activeMode) {
      return
    }
    this.setData({
      activeMode: mode,
    })
    await this.loadPageData()
  },
  async handleYearChange(this: BillPageInstance, e: WechatMiniprogram.CustomEvent) {
    const selectedIndex = Number(e.detail.value)
    const selectedOption = this.data.yearOptions[selectedIndex]
    const selectedYear = selectedOption ? selectedOption.value : undefined
    if (!selectedYear || selectedYear === this.data.selectedYear) {
      return
    }
    this.setData({
      selectedYear,
    })
    await this.loadPageData()
  },
  toggleAmountVisible() {
    this.setData({
      amountVisible: !this.data.amountVisible,
    })
  },
  goToMonthDetail(e: WechatMiniprogram.CustomEvent<{ periodKey?: string }>) {
    const { periodKey } = e.detail
    if (!periodKey || this.data.activeMode !== 'month') {
      return
    }
    const month = periodKey.replace('month-', '')
    wx.navigateTo({
      url: `/pages/bill/bill-month-detail/bill-month-detail?year=${this.data.selectedYear}&month=${month}`,
    })
  },
  handleEmptyAction() {
    wx.showToast({
      title: '先去记一笔吧',
      icon: 'none',
    })
  },
  billInitialized: false,
  loadPageDataTask: null,
})
