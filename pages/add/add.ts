import { type RecordType } from '../../constants/add'
import { createAddPageState, getCategoryOptions, submitTransaction } from '../../services/add'

type InputFieldKey = 'amount' | 'remark'

type MiniProgramInputEvent = WechatMiniprogram.CustomEvent<WechatMiniprogram.IAnyObject> & {
  detail: string | { value?: string }
}

Page({
  data: createAddPageState(),
  async onLoad(options: Record<string, string | undefined>) {
    const initialState = createAddPageState(options.type)
    this.setData(initialState)
    await this.loadCategories(initialState.activeType)
  },
  async loadCategories(type: RecordType) {
    try {
      const categories = await getCategoryOptions(type)
      const firstCategory = categories.length > 0 ? categories[0] : null
      this.setData({
        categories,
        activeCategory: firstCategory ? firstCategory.name : '',
      })
    } catch (error) {
      console.error('load categories failed', error)
    }
  },
  async selectType(e: WechatMiniprogram.BaseEvent) {
    const { type } = e.currentTarget.dataset as { type: RecordType }
    if (!type || type === this.data.activeType) {
      return
    }
    this.setData({
      activeType: type,
    })
    await this.loadCategories(type)
  },
  selectCategory(e: WechatMiniprogram.BaseEvent) {
    const { name } = e.currentTarget.dataset as { name: string }
    if (!name || name === this.data.activeCategory) {
      return
    }
    this.setData({
      activeCategory: name,
    })
  },
  onFieldInput(e: MiniProgramInputEvent) {
    const { field } = e.currentTarget.dataset as { field?: InputFieldKey }
    const value = typeof e.detail === 'string' ? e.detail : e.detail.value || ''
    if (!field) {
      return
    }
    this.setData({
      [field]: value,
    })
  },
  async saveRecord() {
    const categories = this.data.categories as Array<{ id: number; name: string }>
    const activeCategory = categories.find((item) => item.name === this.data.activeCategory)

    if (!activeCategory) {
      wx.showToast({
        title: '请选择分类',
        icon: 'none',
      })
      return
    }

    if (!this.data.amount || Number(this.data.amount) <= 0) {
      wx.showToast({
        title: '请输入正确金额',
        icon: 'none',
      })
      return
    }

    try {
      await submitTransaction({
        categoryId: activeCategory.id,
        type: this.data.activeType,
        amount: this.data.amount,
        remark: this.data.remark,
      })

      wx.showToast({
        title: '保存成功',
        icon: 'success',
      })

      setTimeout(() => {
        wx.navigateBack()
      }, 500)
    } catch (error) {
      console.error('save transaction failed', error)
    }
  },
})
