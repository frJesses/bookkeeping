import {
  addBudgetCategory,
  createBudgetMonths,
  getCurrentBudgetMonth,
  getBudgetPageData,
  deleteBudgetCategory,
  saveBudgetPageData,
  type BudgetCategory,
  type BudgetPageData,
} from '../../services/budget'
import type { AddCategoryItem } from '../../services/add'
import { createRecentYearOptions } from '../../utils/month-picker'
import { getWindowInfo } from '../../utils/system-info'

function money(value: number) {
  return Number(value || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function getMonthScrollLeft(index: number) {
  const windowWidth = getWindowInfo().windowWidth || 375
  const rpx = windowWidth / 750
  const cardWidth = 106 * rpx
  const gap = 12 * rpx
  return Math.max(0, index * (cardWidth + gap))
}

function calculateBudgetTotals(categories: BudgetCategory[], income: number) {
  const totalBudget = categories.reduce((sum, item) => sum + Number(item.value || 0), 0)
  const remainingBudget = income - totalBudget
  return {
    totalBudget,
    totalBudgetText: money(totalBudget),
    remainingBudget,
    remainingBudgetText: money(remainingBudget),
  }
}

const initialMonth = getCurrentBudgetMonth()
const initialMonths = createBudgetMonths(initialMonth)
const initialMonthIndex = initialMonths.findIndex((item) => item.active)
const initialYearOptions = createRecentYearOptions().map((item) => `${item}年`)
const initialYearIndex = Math.max(
  0,
  initialYearOptions.findIndex((item) => item === `${initialMonth.slice(0, 4)}年`),
)

Page({
  data: {
    statusBarHeight: 20,
    isLoading: false,
    errorMessage: '',
    year: Number(initialMonth.slice(0, 4)),
    yearOptions: initialYearOptions,
    yearIndex: initialYearIndex,
    month: initialMonth,
    months: initialMonths,
    monthScrollLeft: getMonthScrollLeft(Math.max(0, initialMonthIndex)),
    addedMonthCount: 0,
    income: 0,
    incomeText: '0.00',
    totalBudget: 0,
    totalBudgetText: '0.00',
    remainingBudget: 0,
    remainingBudgetText: '0.00',
    categories: [] as BudgetCategory[],
    categoryCandidates: [] as AddCategoryItem[],
    showIncomeModal: false,
    incomeDraft: '',
    showCategoryModal: false,
    categoryPickerCandidates: [] as AddCategoryItem[],
    deletingCategoryId: '',
    savingCategoryId: '',
  },
  onLoad() {
    this.setData({ statusBarHeight: getWindowInfo().statusBarHeight || 20 })
    void this.loadBudgetPage()
  },
  async loadBudgetPage(month?: string, preserveDrafts = false) {
    const targetMonth = month || this.data.month || getCurrentBudgetMonth()
    this.setData({ isLoading: true, errorMessage: '' })
    try {
      const data = await getBudgetPageData(targetMonth)
      this.applyBudgetData(data, preserveDrafts)
    } catch (error) {
      console.error('load budget page failed', error)
      this.setData({ isLoading: false, errorMessage: '预算加载失败，请稍后重试' })
    }
  },
  handleRetry() {
    void this.loadBudgetPage(this.data.month)
  },
  applyBudgetData(data: BudgetPageData, preserveDrafts = false) {
    const drafts = preserveDrafts ? this.data.categories.filter((item: BudgetCategory) => item.isDraft) : []
    const categories = drafts.length ? [...data.categories, ...drafts] : data.categories
    this.setData({
      ...data,
      categories,
      isLoading: false,
      yearIndex: Math.max(
        0,
        this.data.yearOptions.findIndex((item: string) => item === `${data.year}年`),
      ),
      monthScrollLeft: getMonthScrollLeft(
        Math.max(
          0,
          data.months.findIndex((item) => item.active),
        ),
      ),
      incomeText: money(data.income),
      addedMonthCount: data.months.filter((item) => item.added).length,
      ...calculateBudgetTotals(categories, data.income),
    })
  },
  goBack() {
    if (getCurrentPages().length > 1) {
      wx.navigateBack()
      return
    }
    wx.switchTab({ url: '/pages/profile/profile' })
  },
  selectMonth(e: WechatMiniprogram.BaseEvent) {
    const index = Number(e.currentTarget.dataset.index)
    const month = this.data.months[index]
    if (!month || month.value === this.data.month) return
    void this.loadBudgetPage(month.value)
  },
  selectYear(e: WechatMiniprogram.CustomEvent<{ value?: string | number }>) {
    const index = Number(e.detail.value)
    const label = this.data.yearOptions[index]
    const year = Number(String(label || '').replace('年', ''))
    if (!year || year === this.data.year) return
    const monthNumber = this.data.month.slice(5) || `${new Date().getMonth() + 1}`.padStart(2, '0')
    const month = `${year}-${monthNumber}`
    this.setData({
      year,
      yearIndex: index,
      month,
      months: createBudgetMonths(month),
      addedMonthCount: 0,
      monthScrollLeft: getMonthScrollLeft(Math.max(0, Number(monthNumber) - 1)),
    })
    void this.loadBudgetPage(month)
  },
  updateBudgetValue(index: number, value: number) {
    const category = this.data.categories[index]
    const isDraft = Boolean(category && category.isDraft)
    const categories = this.data.categories.map((item: BudgetCategory, itemIndex: number) =>
      itemIndex === index ? { ...item, value } : item,
    )
    const income = Number(this.data.income || 0)
    const nextCategories = categories.map((item) => ({
      ...item,
      percent: item.value > 0 ? Math.round((item.spent / item.value) * 100) : 0,
    }))
    this.setData({
      categories: nextCategories,
      ...calculateBudgetTotals(nextCategories, income),
    })
    return { isDraft, income, categories: nextCategories }
  },
  previewBudget(e: WechatMiniprogram.CustomEvent<{ value?: number }>) {
    const index = Number(e.currentTarget.dataset.index)
    const value = Math.max(0, Number(e.detail.value || 0))
    this.updateBudgetValue(index, value)
  },
  async changeBudget(e: WechatMiniprogram.CustomEvent<{ value?: number }>) {
    const index = Number(e.currentTarget.dataset.index)
    const value = Math.max(0, Number(e.detail.value || 0))
    const { isDraft, income, categories } = this.updateBudgetValue(index, value)
    if (isDraft) return
    try {
      await saveBudgetPageData(
        this.data.month,
        income,
        categories.filter((item) => !item.isDraft),
      )
    } catch (error) {
      console.error('save budget failed', error)
      wx.showToast({ title: '预算保存失败', icon: 'none' })
      void this.loadBudgetPage(this.data.month, true)
    }
  },
  adjustIncome() {
    this.setData({ showIncomeModal: true, incomeDraft: `${this.data.income || 0}` })
  },
  closeIncomeModal() {
    this.setData({ showIncomeModal: false })
  },
  handleIncomeInput(e: WechatMiniprogram.CustomEvent<{ value?: string }>) {
    this.setData({ incomeDraft: (e.detail.value || '').replace(/[^\d.]/g, '') })
  },
  async confirmIncome() {
    const income = Number(this.data.incomeDraft || 0)
    if (!Number.isFinite(income) || income < 0) {
      wx.showToast({ title: '请输入正确收入', icon: 'none' })
      return
    }
    try {
      const persistedCategories = this.data.categories.filter((item: BudgetCategory) => !item.isDraft)
      await saveBudgetPageData(this.data.month, income, persistedCategories)
      const months = this.data.months.map((item) => (item.value === this.data.month ? { ...item, added: true } : item))
      this.setData({
        showIncomeModal: false,
        income,
        incomeText: money(income),
        months,
        addedMonthCount: months.filter((item) => item.added).length,
        ...calculateBudgetTotals(this.data.categories, income),
      })
    } catch (error) {
      console.error('save budget income failed', error)
      wx.showToast({ title: '收入保存失败', icon: 'none' })
    }
  },
  addBudget() {
    const candidates = this.data.categoryCandidates.filter(
      (category) => !this.data.categories.some((item: BudgetCategory) => `${item.id}` === `${category.id}`),
    )
    if (!candidates.length) {
      wx.showToast({ title: '所有分类都已添加预算', icon: 'none' })
      return
    }
    this.setData({ showCategoryModal: true, categoryPickerCandidates: candidates })
  },
  closeCategoryModal() {
    this.setData({ showCategoryModal: false })
  },
  selectBudgetCategory(e: WechatMiniprogram.BaseEvent) {
    const index = Number(e.currentTarget.dataset.index)
    const category = this.data.categoryPickerCandidates[index]
    if (!category) return
    const categories = addBudgetCategory(this.data.categories, category)
    this.setData({
      showCategoryModal: false,
      categories,
      ...calculateBudgetTotals(categories, this.data.income),
    })
  },
  async confirmBudgetCategory(e: WechatMiniprogram.BaseEvent) {
    const index = Number(e.currentTarget.dataset.index)
    const category = this.data.categories[index] as BudgetCategory | undefined
    if (!category || !category.isDraft || this.data.savingCategoryId) return
    const categoryId = `${category.id}`
    this.setData({ savingCategoryId: categoryId })
    try {
      const categoriesToSave = this.data.categories.filter(
        (item: BudgetCategory) => !item.isDraft || `${item.id}` === categoryId,
      )
      await saveBudgetPageData(this.data.month, this.data.income, categoriesToSave)
      this.setData({
        categories: this.data.categories.map((item: BudgetCategory) =>
          `${item.id}` === categoryId ? { ...item, isDraft: false } : item,
        ),
      })
      wx.showToast({ title: '预算已保存', icon: 'success' })
      await this.loadBudgetPage(this.data.month, true)
    } catch (error) {
      console.error('confirm budget category failed', error)
      wx.showToast({ title: '预算保存失败', icon: 'none' })
    } finally {
      this.setData({ savingCategoryId: '' })
    }
  },
  removeBudgetCategory(e: WechatMiniprogram.BaseEvent) {
    const index = Number(e.currentTarget.dataset.index)
    const category = this.data.categories[index] as BudgetCategory | undefined
    if (!category) return
    wx.showModal({
      title: '删除分类预算',
      content: `确定删除“${category.name}”预算吗？已记录的账单不会受到影响。`,
      confirmText: '删除',
      confirmColor: '#ff6b6b',
      success: async (result) => {
        if (!result.confirm || this.data.deletingCategoryId || this.data.savingCategoryId) return
        if (category.isDraft) {
          const categories = this.data.categories.filter((item: BudgetCategory) => `${item.id}` !== `${category.id}`)
          this.setData({ categories, ...calculateBudgetTotals(categories, this.data.income) })
          return
        }
        const categoryId = `${category.id}`
        this.setData({ deletingCategoryId: categoryId })
        try {
          await deleteBudgetCategory(this.data.month, category.id)
          wx.showToast({ title: '预算已删除', icon: 'success' })
          await this.loadBudgetPage(this.data.month, true)
        } catch (error) {
          console.error('delete budget category failed', error)
          wx.showToast({ title: '删除失败，请重试', icon: 'none' })
        } finally {
          this.setData({ deletingCategoryId: '' })
        }
      },
    })
  },
  noop() {},
})
