import { createDefaultExportDates, createExport, formatExportDate, type ExportType } from '../../services/export'
import { getWindowInfo } from '../../utils/system-info'

type ExportPageInstance = WechatMiniprogram.Page.Instance<
  WechatMiniprogram.IAnyObject,
  WechatMiniprogram.IAnyObject
> & {
  data: {
    statusBarHeight: number
    startDate: string
    endDate: string
    todayDate: string
    startDateLabel: string
    endDateLabel: string
    type: ExportType
    typeIndex: number
    typeOptions: string[]
    email: string
    isSubmitting: boolean
    errorMessage: string
  }
}

const TYPE_OPTIONS = ['全部账单', '仅支出', '仅收入']
const TYPE_VALUES: ExportType[] = ['all', 'expense', 'income']

Page({
  data: {
    statusBarHeight: 20,
    ...createDefaultExportDates(),
    todayDate: createDefaultExportDates().endDate,
    startDateLabel: '',
    endDateLabel: '',
    type: 'all' as ExportType,
    typeIndex: 0,
    typeOptions: TYPE_OPTIONS,
    email: '',
    isSubmitting: false,
    errorMessage: '',
  },
  onLoad(this: ExportPageInstance) {
    const dates = createDefaultExportDates()
    this.setData({
      statusBarHeight: getWindowInfo().statusBarHeight || 20,
      ...dates,
      todayDate: dates.endDate,
      startDateLabel: formatExportDate(dates.startDate),
      endDateLabel: formatExportDate(dates.endDate),
    })
  },
  handleDateChange(this: ExportPageInstance, e: WechatMiniprogram.CustomEvent<{ value?: string }>) {
    const field = String(e.currentTarget.dataset.field || '') as 'startDate' | 'endDate'
    const value = e.detail.value || ''
    if ((field !== 'startDate' && field !== 'endDate') || !value) return
    if (field === 'startDate') {
      const endDate = this.data.endDate < value ? value : this.data.endDate
      this.setData({
        startDate: value,
        startDateLabel: formatExportDate(value),
        endDate,
        endDateLabel: formatExportDate(endDate),
      })
      return
    }
    const startDate = this.data.startDate > value ? value : this.data.startDate
    this.setData({
      endDate: value,
      endDateLabel: formatExportDate(value),
      startDate,
      startDateLabel: formatExportDate(startDate),
    })
  },
  handleTypeChange(this: ExportPageInstance, e: WechatMiniprogram.CustomEvent<{ value?: string | number }>) {
    const index = Number(e.detail.value)
    if (!Number.isInteger(index) || !TYPE_VALUES[index]) return
    this.setData({ typeIndex: index, type: TYPE_VALUES[index] })
  },
  handleEmailInput(this: ExportPageInstance, e: WechatMiniprogram.Input) {
    this.setData({ email: e.detail.value || '' })
  },
  async submitExport(this: ExportPageInstance) {
    if (this.data.isSubmitting) return
    const email = this.data.email.trim()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      wx.showToast({ title: '请输入正确的邮箱', icon: 'none' })
      return
    }
    if (this.data.startDate > this.data.endDate) {
      wx.showToast({ title: '开始日期不能晚于结束日期', icon: 'none' })
      return
    }
    this.setData({ isSubmitting: true, errorMessage: '' })
    wx.showLoading({ title: '正在导出', mask: true })
    try {
      await createExport({
        email,
        startDate: this.data.startDate,
        endDate: this.data.endDate,
        type: this.data.type,
      })
      wx.showModal({
        title: '导出成功',
        content: 'ZIP 文件已发送到你的邮箱，解压密码请在导出记录中获取。',
        confirmText: '查看记录',
        cancelText: '留在当前页',
        success: (result) => {
          if (result.confirm) wx.navigateTo({ url: '/pages/profile/export-records' })
        },
      })
    } catch (error) {
      console.error('create bookkeeping export failed', error)
      this.setData({ errorMessage: '导出失败，请检查邮箱和网络后重试' })
      wx.showToast({ title: '导出失败，请重试', icon: 'none' })
    } finally {
      wx.hideLoading()
      this.setData({ isSubmitting: false })
    }
  },
  openRecords() {
    wx.navigateTo({ url: '/pages/profile/export-records' })
  },
  goBack() {
    wx.navigateBack()
  },
})
