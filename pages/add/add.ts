import { type RecordType } from '../../constants/add'
import {
  applyEditingRecord,
  applyAmountAction,
  buildSubmitPayload,
  createAddPageState,
  formatDateLabel,
  formatAmountDisplay,
  getCategoryOptions,
  getCategorySelection,
  isRelativeDateLabel,
  resolveSubmitAction,
  submitTransaction,
  updateTransaction,
} from '../../services/add'
import { clearEditingTransaction, getEditingTransaction } from '../../services/transaction-detail'
Page({
  data: {
    ...createAddPageState(),
    statusBarHeight: 20,
    navBarHeight: 44,
    capsuleTop: 0,
    capsuleHeight: 32,
    capsuleWidth: 96,
    capsuleRight: 16,
    categoryLoading: false,
    categoryError: '',
  },
  async onLoad(options: Record<string, string | undefined>) {
    const initialState = createAddPageState(options.type)
    const pageMode = options.mode === 'edit' ? 'edit' : 'create'
    this.initCustomHeader()
    this.setData(initialState)
    if (pageMode !== 'edit') {
      clearEditingTransaction()
    }
    await this.loadCategories(initialState.activeType, pageMode)
  },
  onUnload() {
    clearEditingTransaction()
  },
  async loadCategories(type: RecordType, pageMode?: 'create' | 'edit') {
    this.setData({ categoryLoading: true, categoryError: '' })
    try {
      const categories = await getCategoryOptions(type)
      const nextState: WechatMiniprogram.IAnyObject = {
        categories,
        activeCategory: '',
        activeCategoryIcon: '',
      }
      const mode = pageMode || this.data.pageMode
      if (mode === 'edit') {
        const editingRecord = getEditingTransaction()
        if (editingRecord) {
          Object.assign(nextState, applyEditingRecord(editingRecord, categories))
        }
      }
      this.setData({ ...nextState, categoryLoading: false })
    } catch (error) {
      console.error('load categories failed', error)
      this.setData({
        categoryLoading: false,
        categoryError: error instanceof Error ? error.message : '分类加载失败',
        categories: [],
      })
    }
  },
  handleCategoryRetry() {
    void this.loadCategories(this.data.activeType)
  },
  async handleTypeChange(e: WechatMiniprogram.CustomEvent<{ type?: RecordType }>) {
    const { type } = e.detail
    if (!type || type === this.data.activeType) {
      return
    }
    this.setData({
      activeType: type,
      activeCategory: '',
      activeCategoryIcon: '',
      amount: '',
      amountDisplay: '0',
      submitLabel: '完成',
    })
    await this.loadCategories(type)
  },
  handleCategorySelect(e: WechatMiniprogram.CustomEvent<{ name?: string }>) {
    const { name } = e.detail
    if (!name) {
      return
    }
    this.setData(getCategorySelection(name, this.data.categories))
  },
  handleKeyTap(e: WechatMiniprogram.CustomEvent<{ action?: 'digit' | 'operator' | 'backspace'; value?: string }>) {
    const { action, value } = e.detail
    if (!action) {
      return
    }
    this.setData({
      ...applyAmountAction(this.data.amount, action, value),
    })
  },
  handleRemarkChange(e: WechatMiniprogram.CustomEvent<{ value?: string }>) {
    this.setData({
      remark: e.detail.value || '',
    })
  },
  handleDateChange(e: WechatMiniprogram.CustomEvent<{ value?: string }>) {
    const selectedDate = e.detail.value || this.data.selectedDate
    this.setData({
      selectedDate,
      dateLabel: formatDateLabel(selectedDate),
      isRelativeDateLabel: isRelativeDateLabel(selectedDate),
    })
  },
  goBack() {
    if (getCurrentPages().length > 1) {
      wx.navigateBack()
      return
    }
    wx.switchTab({
      url: '/pages/index/index',
    })
  },
  async saveRecord() {
    const submitAction = resolveSubmitAction(this.data.amount)
    if (submitAction.mode === 'calculate') {
      const resolvedAmount = formatAmountDisplay(submitAction.rawAmount)
      this.setData({
        amount: resolvedAmount,
        amountDisplay: resolvedAmount,
        submitLabel: '完成',
      })
      return
    }
    const result = buildSubmitPayload({
      pageMode: this.data.pageMode,
      originalOccurredAt: this.data.originalOccurredAt,
      activeCategory: this.data.activeCategory,
      activeType: this.data.activeType,
      amount: this.data.amount,
      remark: this.data.remark,
      selectedDate: this.data.selectedDate,
      categories: this.data.categories,
    })
    if (!result.ok) {
      wx.showToast({
        title: result.message,
        icon: 'none',
      })
      return
    }
    try {
      if (this.data.pageMode === 'edit' && this.data.editingRecordId) {
        await updateTransaction({
          id: this.data.editingRecordId,
          ...result.payload,
        })
      } else {
        await submitTransaction(result.payload)
      }
      clearEditingTransaction()
      wx.showToast({
        title: this.data.pageMode === 'edit' ? '修改成功' : '保存成功',
        icon: 'success',
      })
      setTimeout(() => {
        if (this.data.pageMode === 'edit') {
          wx.navigateBack({
            delta: 2,
          })
          return
        }
        wx.navigateBack()
      }, 500)
    } catch (error) {
      console.error('save transaction failed', error)
      wx.showToast({
        title: this.data.pageMode === 'edit' ? '修改失败' : '保存失败',
        icon: 'none',
      })
    }
  },
  initCustomHeader() {
    const systemInfo = wx.getSystemInfoSync()
    const menuButton = wx.getMenuButtonBoundingClientRect()
    const statusBarHeight = systemInfo.statusBarHeight || 20
    const navBarHeight = (menuButton.top - statusBarHeight) * 2 + menuButton.height
    this.setData({
      statusBarHeight,
      navBarHeight,
      capsuleTop: menuButton.top,
      capsuleHeight: menuButton.height,
      capsuleWidth: menuButton.width,
      capsuleRight: systemInfo.windowWidth - menuButton.right,
    })
  },
})
