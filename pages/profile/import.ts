import { confirmImport, previewImport, type ImportPreview, type ImportRow } from '../../services/import'
import { getWindowInfo } from '../../utils/system-info'

type ImportPageInstance = WechatMiniprogram.Page.Instance<
  WechatMiniprogram.IAnyObject,
  WechatMiniprogram.IAnyObject
> & {
  data: {
    statusBarHeight: number
    fileName: string
    preview: ImportPreview | null
    isLoading: boolean
    errorMessage: string
  }
}

function formatType(type: ImportRow['type']) {
  return type === 'income' ? '收入' : '支出'
}

function mapPreviewRow(row: ImportRow) {
  return {
    ...row,
    typeLabel: formatType(row.type),
    errorText: row.errors.join('、'),
  }
}

Page({
  data: {
    statusBarHeight: 20,
    fileName: '',
    preview: null as ImportPreview | null,
    isLoading: false,
    errorMessage: '',
  },
  onLoad(this: ImportPageInstance) {
    this.setData({ statusBarHeight: getWindowInfo().statusBarHeight || 20 })
  },
  chooseFile(this: ImportPageInstance) {
    if (this.data.isLoading) return
    wx.chooseMessageFile({
      count: 1,
      type: 'file',
      extension: ['csv', 'xlsx', 'xls'],
      success: (result) => {
        const file = result.tempFiles && result.tempFiles[0]
        if (!file || !file.path) return
        this.setData({ fileName: file.name || '账单文件', preview: null, errorMessage: '' })
        void this.loadPreview(file.path)
      },
    })
  },
  clearImport(this: ImportPageInstance) {
    if (this.data.isLoading) return
    this.setData({ fileName: '', preview: null, errorMessage: '' })
  },
  async loadPreview(this: ImportPageInstance, filePath: string) {
    this.setData({ isLoading: true, errorMessage: '' })
    wx.showLoading({ title: '正在解析', mask: true })
    try {
      const preview = await previewImport(filePath)
      this.setData({ preview: { ...preview, rows: preview.rows.map(mapPreviewRow) }, isLoading: false })
    } catch (error) {
      console.error('preview bookkeeping import failed', error)
      this.setData({
        isLoading: false,
        errorMessage: error instanceof Error ? error.message : '账单解析失败，请检查文件格式',
      })
      wx.showToast({ title: '解析失败，请检查文件', icon: 'none' })
    } finally {
      wx.hideLoading()
    }
  },
  submitImport(this: ImportPageInstance) {
    const preview = this.data.preview
    const invalidCount = preview ? preview.invalidCount : 0
    if (!preview || !preview.validCount || preview.invalidCount) {
      wx.showToast({ title: invalidCount ? '请先处理无效记录' : '请先选择账单文件', icon: 'none' })
      return
    }
    wx.showModal({
      title: '确认导入',
      content: `将导入${preview.validCount}条账单，已存在记录会自动跳过。确定继续吗？`,
      confirmText: '确认导入',
      success: (result) => {
        if (result.confirm) void this.commitImport(preview.rows)
      },
    })
  },
  async commitImport(this: ImportPageInstance, rows: ImportRow[]) {
    this.setData({ isLoading: true, errorMessage: '' })
    wx.showLoading({ title: '正在导入', mask: true })
    try {
      const result = await confirmImport(rows)
      wx.showModal({
        title: '导入成功',
        content: `新增${result.importedCount}条，重复记录${result.duplicateCount}条已跳过。`,
        showCancel: false,
        confirmText: '知道了',
        success: () => wx.navigateBack(),
      })
    } catch (error) {
      console.error('commit bookkeeping import failed', error)
      this.setData({ errorMessage: '导入失败，请检查记录后重试' })
      wx.showToast({ title: '导入失败，请重试', icon: 'none' })
    } finally {
      this.setData({ isLoading: false })
      wx.hideLoading()
    }
  },
  goBack() {
    wx.navigateBack()
  },
})
