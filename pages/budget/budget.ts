import { type BudgetMonthItem } from '../../constants/budget'
import { createBudgetPageState, getBudgetPageData, saveBudgetPageData, updateMonthlyBudget } from '../../services/budget'
type BudgetFieldKey = 'yearBudget'
type MiniProgramInputEvent = WechatMiniprogram.CustomEvent<WechatMiniprogram.IAnyObject> & {
  detail: string | { value?: string }
}
Page({
  data: createBudgetPageState(),
  onLoad() {
    void this.loadPageData()
  },
  async loadPageData() {
    try {
      const data = await getBudgetPageData()
      this.setData(data)
    } catch (error) {
      console.error('load budget page failed', error)
    }
  },
  startEdit() {
    this.setData({
      isEditing: true,
    })
  },
  onFieldInput(e: MiniProgramInputEvent) {
    const { field } = e.currentTarget.dataset as { field?: BudgetFieldKey }
    const value = typeof e.detail === 'string' ? e.detail : e.detail.value || ''
    if (!field) {
      return
    }
    this.setData({
      [field]: value,
    })
  },
  onMonthInput(e: MiniProgramInputEvent) {
    const { index } = e.currentTarget.dataset as { index?: number | string }
    const monthIndex = Number(index)
    if (Number.isNaN(monthIndex)) {
      return
    }
    const value = typeof e.detail === 'string' ? e.detail : e.detail.value || ''
    this.setData({
      monthlyBudgets: updateMonthlyBudget(this.data.monthlyBudgets, monthIndex, value),
    })
  },
  onMonthFocus(e: WechatMiniprogram.BaseEvent) {
    const { index } = e.currentTarget.dataset as { index?: number | string }
    const monthIndex = Number(index)
    if (Number.isNaN(monthIndex)) {
      return
    }
    const query = wx.createSelectorQuery()
    query.select(`#month-card-${monthIndex}`).boundingClientRect()
    query.selectViewport().scrollOffset()
    query.exec((res) => {
      const rect = res[0] as WechatMiniprogram.BoundingClientRectCallbackResult | null
      const viewport = res[1] as WechatMiniprogram.ScrollOffsetCallbackResult | null
      if (!rect || !viewport) {
        return
      }
      const targetTop = viewport.scrollTop + rect.top - 96
      wx.pageScrollTo({
        scrollTop: Math.max(targetTop, 0),
        duration: 0,
      })
    })
  },
  async saveBudget() {
    try {
      await saveBudgetPageData({
        yearBudget: this.data.yearBudget,
        monthlyBudgets: this.data.monthlyBudgets as BudgetMonthItem[],
      })
      this.setData({
        hasBudget: true,
        isEditing: false,
      })
      wx.showToast({
        title: '预算已保存',
        icon: 'success',
      })
    } catch (error) {
      console.error('save budget failed', error)
    }
  },
})
