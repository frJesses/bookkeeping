import { SETTINGS_CATEGORY_NAME, type RecordType } from '../../constants/add'
import {
  applyEditingRecord,
  applyAmountAction,
  buildSubmitPayload,
  createAddPageState,
  createCategory,
  formatDateLabel,
  formatAmountDisplay,
  getCategoryOptions,
  getCategorySelection,
  isRelativeDateLabel,
  normalizeRemark,
  resolveSubmitAction,
  submitTransaction,
  updateTransaction,
} from '../../services/add'
import { clearEditingTransaction, getEditingTransaction } from '../../services/transaction-detail'
import { getWindowInfo } from '../../utils/system-info'

function getCustomIconSwiperHeight(pages: string[][]) {
  const windowWidth = getWindowInfo().windowWidth || 375
  const rpx = windowWidth / 750
  const gridWidth = windowWidth - 60 * rpx
  const columnGap = 30 * rpx
  const rowGap = 20 * rpx
  const iconWidth = (gridWidth - columnGap * 3) / 4
  const rowCount = Math.max(1, ...pages.map((page) => Math.ceil(page.length / 4)))
  return Math.ceil(iconWidth * rowCount + rowGap * Math.max(0, rowCount - 1) + 32 * rpx)
}

Page({
  data: {
    ...createAddPageState(),
    statusBarHeight: 20,
    navBarHeight: 44,
    capsuleTop: 0,
    capsuleHeight: 32,
    capsuleWidth: 96,
    capsuleRight: 16,
    viewportHeight: 0,
    categoryScrollTop: 0,
    categoryLoading: false,
    categoryError: '',
    showTagModal: false,
    customTagName: '',
    selectedCustomIcon: '',
    customIconPages: [] as string[][],
    customIconPage: 0,
    customIconSwiperHeight: 0,
    customIconCircular: false,
  },
  async onLoad(options: Record<string, string | undefined>) {
    const initialState = createAddPageState(options.type, options.date)
    const pageMode = options.mode === 'edit' ? 'edit' : 'create'
    this.initCustomHeader()
    this.setData({ ...initialState, pageMode })
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
      const customIcons = categories.filter((item) => item.name !== SETTINGS_CATEGORY_NAME).map((item) => item.icon)
      const customIconPages = [] as string[][]
      for (let index = 0; index < customIcons.length; index += 12) {
        customIconPages.push(customIcons.slice(index, index + 12))
      }
      const nextState: WechatMiniprogram.IAnyObject = {
        categories,
        customIconPages,
        customIconPage: 0,
        customIconSwiperHeight: getCustomIconSwiperHeight(customIconPages),
        selectedCustomIcon: customIcons[0] || '',
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
      categoryScrollTop: 0,
    })
    await this.loadCategories(type)
  },
  handleCategorySelect(e: WechatMiniprogram.CustomEvent<{ name?: string }>) {
    const { name } = e.detail
    if (!name) {
      return
    }
    if (name === SETTINGS_CATEGORY_NAME) {
      const selectedCategory = this.data.categories.find((item) => item.name === name)
      this.openTagModal(selectedCategory ? selectedCategory.icon : '')
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
  handleNativeKeyTap(e: WechatMiniprogram.BaseEvent) {
    const { action, value } = e.currentTarget.dataset as {
      action?: 'digit' | 'operator' | 'backspace'
      value?: string
    }
    if (!action) return
    this.setData({ ...applyAmountAction(this.data.amount, action, value) })
  },
  openTagModal(selectedIcon = '') {
    const customIcons = this.data.categories
      .filter((item) => item.name !== SETTINGS_CATEGORY_NAME)
      .map((item) => item.icon)
    const customIconPages = [] as string[][]
    for (let index = 0; index < customIcons.length; index += 12) {
      customIconPages.push(customIcons.slice(index, index + 12))
    }
    const selectedCustomIcon = selectedIcon
      ? customIcons.includes(selectedIcon)
        ? selectedIcon
        : ''
      : customIcons.includes(this.data.selectedCustomIcon)
        ? this.data.selectedCustomIcon
        : customIcons[0] || ''
    const selectedIndex = customIcons.indexOf(selectedCustomIcon)
    const customIconPage = selectedIndex >= 0 ? Math.floor(selectedIndex / 12) : 0
    this.setData({
      customIconPages,
      customIconPage,
      customIconSwiperHeight: getCustomIconSwiperHeight(customIconPages),
      selectedCustomIcon,
      showTagModal: true,
    })
  },
  closeTagModal() {
    this.setData({ showTagModal: false })
  },
  handleCustomTagName(e: WechatMiniprogram.CustomEvent<{ value?: string }>) {
    this.setData({ customTagName: e.detail.value || '' })
  },
  selectCustomIcon(e: WechatMiniprogram.BaseEvent) {
    const { icon } = e.currentTarget.dataset as { icon?: string }
    if (icon) this.setData({ selectedCustomIcon: icon })
  },
  selectCustomIconPage(e: WechatMiniprogram.BaseEvent) {
    const page = Number((e.currentTarget.dataset as { page?: string | number }).page)
    if (!Number.isInteger(page) || page < 0 || page >= this.data.customIconPages.length) {
      return
    }
    this.setData({ customIconPage: page })
  },
  handleCustomIconPageChange(e: WechatMiniprogram.CustomEvent<{ current?: number }>) {
    const page = Number(e.detail.current)
    if (!Number.isInteger(page) || page < 0 || page >= this.data.customIconPages.length) {
      return
    }
    this.setData({ customIconPage: page })
  },
  async confirmCustomTag() {
    const name = (this.data.customTagName || '').trim()
    if (!name) {
      wx.showToast({ title: '请输入标签名称', icon: 'none' })
      return
    }
    if (Array.from(name).length > 4) {
      wx.showToast({ title: '分类名称最多4个字', icon: 'none' })
      return
    }
    if (!this.data.selectedCustomIcon) {
      wx.showToast({ title: '请选择分类图标', icon: 'none' })
      return
    }
    try {
      await createCategory({
        type: this.data.activeType,
        name,
        icon: this.data.selectedCustomIcon,
      })
      await this.loadCategories(this.data.activeType)
      this.setData({ showTagModal: false, customTagName: '' })
      wx.showToast({ title: '分类已添加', icon: 'success' })
    } catch (error) {
      console.error('create custom category failed', error)
      wx.showToast({ title: '分类添加失败，请重试', icon: 'none' })
    }
  },
  noop() {},
  handleRemarkChange(e: WechatMiniprogram.CustomEvent<{ value?: string }>) {
    this.setData({
      remark: e.detail.value || '',
    })
  },
  handleRemarkBlur(this: WechatMiniprogram.Page.Instance<WechatMiniprogram.IAnyObject, WechatMiniprogram.IAnyObject>) {
    const remark = normalizeRemark(this.data.remark || '')
    if (remark !== this.data.remark) {
      this.setData({ remark })
    }
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
    if (this.data.pageMode === 'edit') {
      if (getCurrentPages().length > 1) {
        wx.navigateBack()
      } else {
        wx.switchTab({ url: '/pages/index/index' })
      }
      return
    }
    if (this.data.activeCategory) {
      this.setData({ activeCategory: '', activeCategoryIcon: '', amount: '', amountDisplay: '0', remark: '' })
      return
    }
    if (getCurrentPages().length > 1) {
      wx.navigateBack()
      return
    }
    wx.switchTab({
      url: '/pages/index/index',
    })
  },
  handleChangeCategory() {
    this.setData({
      activeCategory: '',
      activeCategoryIcon: '',
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
          wx.navigateBack()
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
    const systemInfo = getWindowInfo()
    const menuButton = wx.getMenuButtonBoundingClientRect()
    const statusBarHeight = systemInfo.statusBarHeight || 20
    const navBarHeight = (menuButton.top - statusBarHeight) * 2 + menuButton.height
    this.setData({
      statusBarHeight,
      viewportHeight: systemInfo.windowHeight,
      navBarHeight,
      capsuleTop: menuButton.top,
      capsuleHeight: menuButton.height,
      capsuleWidth: menuButton.width,
      capsuleRight: systemInfo.windowWidth - menuButton.right,
    })
  },
})
