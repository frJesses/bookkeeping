import {
  getStatsPreviewPageData,
  type StatsPreviewPageData,
} from '../../services/stats-preview'

type PreviewPageInstance = WechatMiniprogram.Page.Instance<
  WechatMiniprogram.IAnyObject,
  WechatMiniprogram.IAnyObject
> & {
  data: StatsPreviewPageData & {
    statusBarHeight: number
    isLoading: boolean
    errorMessage: string
  }
}

function createCurrentMonth() {
  const now = new Date()
  return `${now.getFullYear()}-${`${now.getMonth() + 1}`.padStart(2, '0')}`
}

Page({
  data: {
    month: '',
    previewTitle: '',
    totalIncome: '0.00',
    totalExpense: '0.00',
    totalBalance: '0.00',
    totalCount: '0',
    currentExpense: '0.00',
    previousExpense: '0.00',
    currentDailyExpense: '0.00',
    previousDailyExpense: '0.00',
    statusBarHeight: 20,
    isLoading: false,
    errorMessage: '',
  },
  onLoad(this: PreviewPageInstance, options: Record<string, string | undefined>) {
    this.setData({ statusBarHeight: wx.getSystemInfoSync().statusBarHeight || 20 })
    void this.loadPreview(options.month || createCurrentMonth())
  },
  async loadPreview(this: PreviewPageInstance, month: string) {
    this.setData({ month, isLoading: true, errorMessage: '' })
    wx.showLoading({ title: '', mask: true })
    try {
      const data = await getStatsPreviewPageData(month)
      this.setData({ ...data, isLoading: false })
    } catch (error) {
      console.error('load stats preview failed', error)
      this.setData({ isLoading: false, errorMessage: '收支预览加载失败，请稍后重试' })
    } finally {
      wx.hideLoading()
    }
  },
  goBack() {
    wx.navigateBack()
  },
  handleRetry(this: PreviewPageInstance) {
    void this.loadPreview(this.data.month)
  },
})
