import { createBillDetailPageState, getBillDetailPageData } from '../../../services/bill'
import { createCurrentMonthValue } from '../../../utils/month-picker'
import { getWindowInfo } from '../../../utils/system-info'

type DetailPageInstance = WechatMiniprogram.Page.Instance<
  WechatMiniprogram.IAnyObject,
  WechatMiniprogram.IAnyObject
> & {
  data: ReturnType<typeof createBillDetailPageState> & {
    statusBarHeight: number
  }
  detailInitialized: boolean
  requestVersion: number
}

const initialMonth = createCurrentMonthValue()

Page({
  data: {
    ...createBillDetailPageState(initialMonth),
    statusBarHeight: 20,
  },
  onLoad(this: DetailPageInstance, options: Record<string, string | undefined>) {
    const month = /^\d{4}-\d{2}$/.test(options.month || '') ? (options.month as string) : initialMonth
    this.setData({
      statusBarHeight: getWindowInfo().statusBarHeight || 20,
      ...createBillDetailPageState(month),
    })
    void this.loadPageData(month)
  },
  async loadPageData(this: DetailPageInstance, month: string) {
    this.detailInitialized = true
    this.requestVersion += 1
    const requestVersion = this.requestVersion
    this.setData({ isLoading: true, errorMessage: '' })
    try {
      const data = await getBillDetailPageData(month)
      if (requestVersion !== this.requestVersion) return
      this.setData({ ...data, isLoading: false, errorMessage: '' })
    } catch (error) {
      if (requestVersion !== this.requestVersion) return
      console.error('load bill detail failed', error)
      this.setData({ isLoading: false, errorMessage: '账单详情加载失败，请稍后重试', groups: [] })
    }
  },
  handleRetry(this: DetailPageInstance) {
    void this.loadPageData(this.data.month)
  },
  goBack() {
    if (getCurrentPages().length > 1) {
      wx.navigateBack()
      return
    }
    wx.switchTab({ url: '/pages/profile/profile' })
  },
  detailInitialized: false,
  requestVersion: 0,
})
