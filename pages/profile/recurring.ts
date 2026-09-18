import {
  createRecurringDayOptions,
  createRecurringRule,
  deleteRecurringRule,
  getRecurringCategoryOptions,
  getRecurringRules,
  getTodayValue,
  updateRecurringRule,
  type RecurringRule,
} from '../../services/recurring'
import type { AddCategoryItem } from '../../services/add'
import { getWindowInfo } from '../../utils/system-info'

type RecurringPageInstance = WechatMiniprogram.Page.Instance<
  WechatMiniprogram.IAnyObject,
  WechatMiniprogram.IAnyObject
> & {
  data: {
    statusBarHeight: number
    rules: RecurringRule[]
    categoryOptions: AddCategoryItem[]
    dayOptions: string[]
    showForm: boolean
    editingId: string
    formType: 'expense' | 'income'
    formTitle: string
    formAmount: string
    formRemark: string
    formCategoryIndex: number
    formDayIndex: number
    formStartDate: string
    formCategoryLabel: string
    formError: string
    showOptionPicker: boolean
    optionPickerType: 'category' | 'day'
    typeOptions: string[]
    isLoading: boolean
    isSaving: boolean
  }
}

const TYPE_OPTIONS = ['支出', '收入']

Page({
  data: {
    statusBarHeight: 20,
    rules: [] as RecurringRule[],
    categoryOptions: [] as AddCategoryItem[],
    dayOptions: createRecurringDayOptions(),
    showForm: false,
    editingId: '',
    formType: 'expense' as const,
    formTitle: '',
    formAmount: '',
    formRemark: '',
    formCategoryIndex: 0,
    formDayIndex: 0,
    formStartDate: getTodayValue(),
    formCategoryLabel: '',
    formError: '',
    showOptionPicker: false,
    optionPickerType: 'category' as const,
    isLoading: false,
    isSaving: false,
    typeOptions: TYPE_OPTIONS,
  },
  onLoad(this: RecurringPageInstance) {
    this.setData({ statusBarHeight: getWindowInfo().statusBarHeight || 20 })
    void this.loadPage()
  },
  async loadPage(this: RecurringPageInstance) {
    this.setData({ isLoading: true })
    try {
      const [rules, categoryOptions] = await Promise.all([getRecurringRules(), getRecurringCategoryOptions('expense')])
      this.setData({ rules, categoryOptions, isLoading: false })
    } catch (error) {
      console.error('load recurring rules failed', error)
      this.setData({ isLoading: false })
      wx.showToast({ title: '固定收支加载失败', icon: 'none' })
    }
  },
  async openCreateForm(this: RecurringPageInstance) {
    const options = await getRecurringCategoryOptions('expense')
    this.setData({
      showForm: true,
      editingId: '',
      formType: 'expense',
      formTitle: '',
      formAmount: '',
      formRemark: '',
      categoryOptions: options,
      dayOptions: createRecurringDayOptions(getTodayValue()),
      formCategoryIndex: 0,
      formCategoryLabel: options.length ? options[0].name : '请选择分类',
      formDayIndex: 0,
      formStartDate: getTodayValue(),
      formError: '',
    })
  },
  async editRule(this: RecurringPageInstance, e: WechatMiniprogram.BaseEvent) {
    const id = String(e.currentTarget.dataset.id || '')
    const rule = this.data.rules.find((item) => item.id === id)
    if (!rule) return
    const options = await getRecurringCategoryOptions(rule.type)
    const categoryIndex = Math.max(
      0,
      options.findIndex((item) => `${item.id}` === `${rule.categoryId}`),
    )
    const dayOptions = createRecurringDayOptions(rule.startDate)
    this.setData({
      showForm: true,
      editingId: rule.id,
      formType: rule.type,
      formTitle: rule.title,
      formAmount: rule.amount,
      formRemark: rule.remark || '',
      categoryOptions: options,
      formCategoryIndex: categoryIndex,
      formCategoryLabel: options[categoryIndex] ? options[categoryIndex].name : rule.categoryName,
      dayOptions,
      formDayIndex: Math.min(dayOptions.length - 1, Math.max(0, rule.dayOfMonth - 1)),
      formStartDate: rule.startDate,
      formError: '',
    })
  },
  closeForm(this: RecurringPageInstance) {
    if (!this.data.isSaving) this.setData({ showForm: false, showOptionPicker: false })
  },
  openCategoryPicker(this: RecurringPageInstance) {
    this.setData({ showOptionPicker: true, optionPickerType: 'category' })
  },
  openDayPicker(this: RecurringPageInstance) {
    this.setData({ showOptionPicker: true, optionPickerType: 'day' })
  },
  closeOptionPicker(this: RecurringPageInstance) {
    this.setData({ showOptionPicker: false })
  },
  selectCategoryOption(this: RecurringPageInstance, e: WechatMiniprogram.BaseEvent) {
    const index = Number(e.currentTarget.dataset.index)
    const category = this.data.categoryOptions[index]
    if (!category) return
    this.setData({ formCategoryIndex: index, formCategoryLabel: category.name, showOptionPicker: false })
  },
  selectDayOption(this: RecurringPageInstance, e: WechatMiniprogram.BaseEvent) {
    const index = Number(e.currentTarget.dataset.index)
    if (!Number.isInteger(index) || index < 0 || index >= this.data.dayOptions.length) return
    this.setData({ formDayIndex: index, showOptionPicker: false })
  },
  async handleTypeChange(this: RecurringPageInstance, e: WechatMiniprogram.CustomEvent<{ value?: string | number }>) {
    const typeIndex = Number(e.detail.value)
    const type = typeIndex === 1 ? 'income' : 'expense'
    const options = await getRecurringCategoryOptions(type)
    this.setData({
      formType: type,
      categoryOptions: options,
      formCategoryIndex: 0,
      formCategoryLabel: options.length ? options[0].name : '请选择分类',
    })
  },
  handleCategoryChange(this: RecurringPageInstance, e: WechatMiniprogram.CustomEvent<{ value?: string | number }>) {
    const index = Number(e.detail.value)
    const category = this.data.categoryOptions[index]
    if (category) this.setData({ formCategoryIndex: index, formCategoryLabel: category.name })
  },
  handleDayChange(this: RecurringPageInstance, e: WechatMiniprogram.CustomEvent<{ value?: string | number }>) {
    this.setData({ formDayIndex: Number(e.detail.value) || 0 })
  },
  handleStartDateChange(this: RecurringPageInstance, e: WechatMiniprogram.CustomEvent<{ value?: string }>) {
    if (!e.detail.value) return
    const dayOptions = createRecurringDayOptions(e.detail.value)
    this.setData({
      formStartDate: e.detail.value,
      dayOptions,
      formDayIndex: Math.min(this.data.formDayIndex, dayOptions.length - 1),
    })
  },
  handleTitleInput(this: RecurringPageInstance, e: WechatMiniprogram.Input) {
    this.setData({ formTitle: e.detail.value || '' })
  },
  handleAmountInput(this: RecurringPageInstance, e: WechatMiniprogram.Input) {
    this.setData({ formAmount: e.detail.value || '' })
  },
  handleRemarkInput(this: RecurringPageInstance, e: WechatMiniprogram.Input) {
    this.setData({ formRemark: e.detail.value || '' })
  },
  async saveRule(this: RecurringPageInstance) {
    const category = this.data.categoryOptions[this.data.formCategoryIndex]
    const amount = Number(this.data.formAmount)
    if (!category || !Number.isFinite(amount) || amount <= 0) {
      this.setData({ formError: '请选择分类并填写正确金额' })
      return
    }
    this.setData({ isSaving: true, formError: '' })
    try {
      const payload = {
        categoryId: category.id,
        type: this.data.formType,
        title: this.data.formTitle.trim() || category.name,
        amount: amount.toFixed(2),
        remark: this.data.formRemark.trim(),
        dayOfMonth: this.data.formDayIndex + 1,
        startDate: this.data.formStartDate,
      }
      if (this.data.editingId) await updateRecurringRule(this.data.editingId, payload)
      else await createRecurringRule(payload)
      this.setData({ showForm: false, isSaving: false })
      wx.showToast({ title: '已保存', icon: 'success' })
      await this.loadPage()
    } catch (error) {
      console.error('save recurring rule failed', error)
      this.setData({ isSaving: false, formError: '保存失败，请检查后重试' })
    }
  },
  toggleRule(this: RecurringPageInstance, e: WechatMiniprogram.BaseEvent) {
    const id = String(e.currentTarget.dataset.id || '')
    const rule = this.data.rules.find((item) => item.id === id)
    if (!rule) return
    const nextEnabled = !rule.isEnabled
    wx.showModal({
      title: nextEnabled ? '启用固定收支' : '停用固定收支',
      content: nextEnabled
        ? '启用后到执行日会自动生成流水，确定启用吗？'
        : '停用后不会再自动生成新的流水，确定停用吗？',
      confirmText: nextEnabled ? '启用' : '停用',
      confirmColor: nextEnabled ? '#01ad93' : '#e05b61',
      success: (result) => {
        if (!result.confirm) return
        void updateRecurringRule(id, { isEnabled: nextEnabled })
          .then(() => this.loadPage())
          .catch(() => wx.showToast({ title: '状态更新失败', icon: 'none' }))
      },
    })
  },
  deleteRule(this: RecurringPageInstance, e: WechatMiniprogram.BaseEvent) {
    const id = String(e.currentTarget.dataset.id || '')
    if (!id) return
    wx.showModal({
      title: '删除固定收支',
      content: '删除后不会影响已经生成的历史流水，确定删除吗？',
      success: (result) => {
        if (!result.confirm) return
        void deleteRecurringRule(id)
          .then(() => this.loadPage())
          .catch(() => wx.showToast({ title: '删除失败', icon: 'none' }))
      },
    })
  },
  goBack() {
    wx.navigateBack()
  },
  noop() {},
})
