import { SETTINGS_CATEGORY_NAME, type RecordType } from '../../constants/add'
import { createCategory, deleteCategory, getCategoryOptions, type AddCategoryItem } from '../../services/add'
import { getWindowInfo } from '../../utils/system-info'

type CategoryPageInstance = WechatMiniprogram.Page.Instance<
  WechatMiniprogram.IAnyObject,
  WechatMiniprogram.IAnyObject
> & {
  categoryInitialized: boolean
  updateNameValue: (value: string, limit: boolean) => void
}

function getManageableCategories(categories: AddCategoryItem[]) {
  return categories.filter((item) => item.name !== SETTINGS_CATEGORY_NAME)
}

function getIconOptions(categories: AddCategoryItem[]) {
  return [
    ...new Set(
      getManageableCategories(categories)
        .map((item) => item.icon)
        .filter(Boolean),
    ),
  ]
}

Page({
  data: {
    statusBarHeight: 20,
    activeType: 'expense' as RecordType,
    categories: [] as AddCategoryItem[],
    iconOptions: [] as string[],
    isLoading: false,
    errorMessage: '',
    showCreateModal: false,
    newName: '',
    nameLength: 0,
    isComposingName: false,
    selectedIcon: '',
    saving: false,
    deletingId: '',
  },
  onLoad(this: CategoryPageInstance) {
    this.setData({ statusBarHeight: getWindowInfo().statusBarHeight || 20 })
    void this.loadCategories()
  },
  onShow(this: CategoryPageInstance) {
    if (this.categoryInitialized) {
      void this.loadCategories()
    }
  },
  async loadCategories(this: CategoryPageInstance) {
    this.categoryInitialized = true
    this.setData({ isLoading: true, errorMessage: '' })
    try {
      const categories = getManageableCategories(await getCategoryOptions(this.data.activeType))
      const iconOptions = getIconOptions(categories)
      this.setData({
        categories,
        iconOptions,
        selectedIcon:
          this.data.selectedIcon && iconOptions.includes(this.data.selectedIcon)
            ? this.data.selectedIcon
            : iconOptions[0] || '',
        isLoading: false,
      })
    } catch (error) {
      console.error('load category management failed', error)
      this.setData({ isLoading: false, errorMessage: error instanceof Error ? error.message : '分类加载失败' })
    }
  },
  async handleTypeChange(this: CategoryPageInstance, event: WechatMiniprogram.BaseEvent) {
    const type = String((event.currentTarget.dataset as { type?: string }).type || '') as RecordType
    if ((type !== 'expense' && type !== 'income') || type === this.data.activeType) {
      return
    }
    this.setData({ activeType: type, categories: [], iconOptions: [], selectedIcon: '' })
    await this.loadCategories()
  },
  openCreateModal(this: CategoryPageInstance) {
    const selectedIcon = this.data.selectedIcon || this.data.iconOptions[0] || ''
    this.setData({ showCreateModal: true, newName: '', nameLength: 0, isComposingName: false, selectedIcon })
  },
  closeCreateModal(this: CategoryPageInstance) {
    if (!this.data.saving) {
      this.setData({ showCreateModal: false, newName: '', nameLength: 0, isComposingName: false })
    }
  },
  noop() {},
  handleNameCompositionStart(this: CategoryPageInstance) {
    this.setData({ isComposingName: true })
  },
  handleNameCompositionEnd(this: CategoryPageInstance, event: WechatMiniprogram.CustomEvent<{ value?: string }>) {
    this.updateNameValue(event.detail.value || this.data.newName, true)
  },
  handleNameInput(this: CategoryPageInstance, event: WechatMiniprogram.CustomEvent<{ value?: string }>) {
    this.updateNameValue(event.detail.value || '', !this.data.isComposingName)
  },
  updateNameValue(this: CategoryPageInstance, value: string, limit: boolean) {
    const nextValue = limit ? Array.from(value).slice(0, 4).join('') : value
    this.setData({
      newName: nextValue,
      nameLength: Array.from(nextValue).length,
      isComposingName: !limit,
    })
  },
  selectIcon(this: CategoryPageInstance, event: WechatMiniprogram.BaseEvent) {
    const index = Number((event.currentTarget.dataset as { index?: string | number }).index)
    const icon = this.data.iconOptions[index]
    if (icon) {
      this.setData({ selectedIcon: icon })
    }
  },
  async confirmCreate(this: CategoryPageInstance) {
    const name = this.data.newName.trim()
    if (!name) {
      wx.showToast({ title: '请输入分类名称', icon: 'none' })
      return
    }
    if ([...name].length > 4) {
      wx.showToast({ title: '分类名称最多4个字', icon: 'none' })
      return
    }
    if (!this.data.selectedIcon) {
      wx.showToast({ title: '请选择分类图标', icon: 'none' })
      return
    }
    this.setData({ saving: true })
    try {
      await createCategory({ type: this.data.activeType, name, icon: this.data.selectedIcon })
      this.setData({ showCreateModal: false, newName: '', nameLength: 0, isComposingName: false, saving: false })
      await this.loadCategories()
      wx.showToast({ title: '分类已添加', icon: 'success' })
    } catch (error) {
      console.error('create managed category failed', error)
      this.setData({ saving: false })
      wx.showToast({ title: '分类添加失败，请重试', icon: 'none' })
    }
  },
  removeCategory(this: CategoryPageInstance, event: WechatMiniprogram.BaseEvent) {
    const index = Number((event.currentTarget.dataset as { index?: string | number }).index)
    const category = this.data.categories[index]
    if (!category || category.isDefault) {
      return
    }
    wx.showModal({
      title: '删除分类',
      content: `确定删除“${category.name}”吗？已有流水会保留。`,
      confirmText: '删除',
      confirmColor: '#ff6b6b',
      success: (result) => {
        if (result.confirm) {
          void this.confirmRemoveCategory(category)
        }
      },
    })
  },
  async confirmRemoveCategory(this: CategoryPageInstance, category: AddCategoryItem) {
    const id = String(category.id)
    if (this.data.deletingId) {
      return
    }
    this.setData({ deletingId: id })
    try {
      await deleteCategory(category.id)
      await this.loadCategories()
      wx.showToast({ title: '分类已删除', icon: 'success' })
    } catch (error) {
      console.error('delete managed category failed', error)
      wx.showToast({ title: '删除失败，请重试', icon: 'none' })
    } finally {
      this.setData({ deletingId: '' })
    }
  },
  goBack() {
    if (getCurrentPages().length > 1) {
      wx.navigateBack()
      return
    }
    wx.switchTab({ url: '/pages/profile/profile' })
  },
  categoryInitialized: false,
})
