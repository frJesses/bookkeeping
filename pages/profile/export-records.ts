import {
  formatExportDate,
  formatExportDateTime,
  getExportPassword,
  getExportRecords,
  type ExportRecord,
} from '../../services/export'
import { getWindowInfo } from '../../utils/system-info'

type ExportRecordsPageInstance = WechatMiniprogram.Page.Instance<
  WechatMiniprogram.IAnyObject,
  WechatMiniprogram.IAnyObject
> & {
  data: {
    statusBarHeight: number
    records: ExportRecord[]
    isLoading: boolean
    errorMessage: string
  }
}

function formatType(type: ExportRecord['type']) {
  return type === 'all' ? '全部账单' : type === 'income' ? '仅收入' : '仅支出'
}

function mapRecord(record: ExportRecord) {
  return {
    ...record,
    typeLabel: formatType(record.type),
    rangeLabel: `${formatExportDate(record.startDate)} - ${formatExportDate(record.endDate)}`,
    createdAtLabel: formatExportDateTime(record.createdAt),
    statusLabel: record.status === 'sent' ? '已发送' : record.status === 'failed' ? '发送失败' : '处理中',
    canGetPassword: record.status === 'sent',
  }
}

Page({
  data: {
    statusBarHeight: 20,
    records: [] as Array<ExportRecord & Record<string, unknown>>,
    isLoading: false,
    errorMessage: '',
  },
  onLoad(this: ExportRecordsPageInstance) {
    this.setData({ statusBarHeight: getWindowInfo().statusBarHeight || 20 })
    void this.loadRecords()
  },
  onShow(this: ExportRecordsPageInstance) {
    if (this.data.records.length) void this.loadRecords()
  },
  async loadRecords(this: ExportRecordsPageInstance) {
    this.setData({ isLoading: true, errorMessage: '' })
    try {
      const result = await getExportRecords()
      this.setData({ records: (result.data || []).map(mapRecord), isLoading: false })
    } catch (error) {
      console.error('load export records failed', error)
      this.setData({ isLoading: false, errorMessage: '导出记录加载失败，请稍后重试' })
    }
  },
  async handleGetPassword(this: ExportRecordsPageInstance, e: WechatMiniprogram.BaseEvent) {
    const id = String(e.currentTarget.dataset.id || '')
    if (!id) return
    try {
      const result = await getExportPassword(id)
      wx.showModal({
        title: '解压密码',
        content: `${result.password}\n有效期至 ${formatExportDateTime(result.expiresAt)}`,
        showCancel: false,
        confirmText: '知道了',
      })
    } catch (error) {
      console.error('get export password failed', error)
      wx.showToast({ title: '解压码获取失败', icon: 'none' })
    }
  },
  goBack() {
    wx.navigateBack()
  },
})
