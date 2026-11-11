import { buildHomeRecentRecordGroups, type HomeRecordGroup, type HomeRecordItem } from '../../services/home'
import {
  getSearchCategoryOptions,
  searchTransactions,
  summarizeSearchRecords,
  type SearchCategoryOption,
  type SearchSummary,
  type SearchType,
} from '../../services/search'
import { cacheEditingHomeTransaction, deleteTransactionById } from '../../services/transaction-detail'
import { createCurrentMonthValue, createRecentMonthOptions } from '../../utils/month-picker'
import { getWindowInfo } from '../../utils/system-info'

type SearchMonth = {
  value: string
  label: string
}

type SearchPageData = {
  statusBarHeight: number
  months: SearchMonth[]
  monthLabels: string[]
  monthIndex: number
  typeOptions: Array<{ key: SearchType; label: string }>
  activeType: SearchType
  categoryOptions: SearchCategoryOption[]
  categoryLabels: string[]
  categoryIndex: number
  keyword: string
  isSearching: boolean
  hasSearched: boolean
  errorMessage: string
  groups: HomeRecordGroup[]
  summary: SearchSummary
  truncated: boolean
  fetchedCount: number
}

type SearchPageInstance = WechatMiniprogram.Page.Instance<SearchPageData, WechatMiniprogram.IAnyObject> & {
  requestVersion: number
  pageVisible: boolean
  data: SearchPageData
}

type SwipeRowInstance = WechatMiniprogram.Component.TrivialInstance & {
  data: {
    record?: HomeRecordItem
  }
  close: () => void
}

const TYPE_OPTIONS: Array<{ key: SearchType; label: string }> = [
  { key: 'all', label: '全部' },
  { key: 'expense', label: '支出' },
  { key: 'income', label: '收入' },
]

const CURRENT_MONTH = createCurrentMonthValue()
const MONTH_OPTIONS: SearchMonth[] = [{ value: '', label: '全部时间' }, ...createRecentMonthOptions(24)]
const DEFAULT_MONTH_INDEX = Math.max(
  0,
  MONTH_OPTIONS.findIndex((item) => item.value === CURRENT_MONTH),
)

function buildCategoryLabels(options: SearchCategoryOption[]) {
  return ['全部分类', ...options.map((item) => `${item.name}（${item.type === 'expense' ? '支出' : '收入'}）`)]
}

Page({
  data: {
    statusBarHeight: 20,
    months: MONTH_OPTIONS,
    monthLabels: MONTH_OPTIONS.map((item) => item.label),
    monthIndex: DEFAULT_MONTH_INDEX,
    typeOptions: TYPE_OPTIONS,
    activeType: 'all' as SearchType,
    categoryOptions: [] as SearchCategoryOption[],
    categoryLabels: ['全部分类'],
    categoryIndex: 0,
    keyword: '',
    isSearching: false,
    hasSearched: false,
    errorMessage: '',
    groups: [] as HomeRecordGroup[],
    summary: { count: 0, expenseText: '0.00', incomeText: '0.00' },
    truncated: false,
    fetchedCount: 0,
  },
  onLoad(this: SearchPageInstance) {
    this.setData({ statusBarHeight: getWindowInfo().statusBarHeight || 20 })
    void this.loadCategories()
    void this.performSearch()
  },
  onShow(this: SearchPageInstance) {
    if (this.pageVisible && this.data.hasSearched) {
      void this.performSearch()
    }
    this.pageVisible = true
  },
  async loadCategories(this: SearchPageInstance) {
    try {
      const options = await getSearchCategoryOptions()
      this.setData({
        categoryOptions: options,
        categoryLabels: buildCategoryLabels(options),
        categoryIndex: Math.min(this.data.categoryIndex, options.length),
      })
    } catch (error) {
      console.error('load search categories failed', error)
    }
  },
  getQuery(this: SearchPageInstance) {
    const month = this.data.months[this.data.monthIndex]
    const category = this.data.categoryIndex > 0 ? this.data.categoryOptions[this.data.categoryIndex - 1] : undefined
    return {
      month: month ? month.value : '',
      type: this.data.activeType,
      categoryId: category ? `${category.id}` : '',
      keyword: this.data.keyword,
    }
  },
  async performSearch(this: SearchPageInstance) {
    this.requestVersion += 1
    const requestVersion = this.requestVersion
    this.setData({ isSearching: true, errorMessage: '', hasSearched: true })
    try {
      const result = await searchTransactions(this.getQuery())
      if (requestVersion !== this.requestVersion) {
        return
      }
      this.setData({
        isSearching: false,
        groups: buildHomeRecentRecordGroups(result.records),
        summary: summarizeSearchRecords(result.records),
        truncated: result.truncated,
        fetchedCount: result.fetchedCount,
      })
    } catch (error) {
      if (requestVersion !== this.requestVersion) {
        return
      }
      console.error('search transactions failed', error)
      this.setData({
        isSearching: false,
        errorMessage: '搜索失败，请检查网络后重试',
        groups: [],
        summary: { count: 0, expenseText: '0.00', incomeText: '0.00' },
        truncated: false,
        fetchedCount: 0,
      })
    }
  },
  handleKeywordInput(this: SearchPageInstance, e: WechatMiniprogram.Input) {
    this.setData({ keyword: e.detail.value || '' })
  },
  handleSearch(this: SearchPageInstance) {
    if (this.data.isSearching) {
      return
    }
    void this.performSearch()
  },
  clearKeyword(this: SearchPageInstance) {
    this.setData({ keyword: '' })
    if (!this.data.isSearching) {
      void this.performSearch()
    }
  },
  handleMonthChange(this: SearchPageInstance, e: WechatMiniprogram.CustomEvent<{ value?: string | number }>) {
    const index = Number(e.detail.value)
    if (!Number.isInteger(index) || index < 0 || index >= this.data.months.length) {
      return
    }
    this.setData({ monthIndex: index })
    void this.performSearch()
  },
  handleTypeSelect(this: SearchPageInstance, e: WechatMiniprogram.BaseEvent) {
    const { type } = e.currentTarget.dataset as { type?: SearchType }
    if (!type || type === this.data.activeType) {
      return
    }
    this.setData({ activeType: type })
    void this.performSearch()
  },
  handleCategoryChange(this: SearchPageInstance, e: WechatMiniprogram.CustomEvent<{ value?: string | number }>) {
    const index = Number(e.detail.value)
    const maxIndex = this.data.categoryOptions.length
    if (!Number.isInteger(index) || index < 0 || index > maxIndex) {
      return
    }
    this.setData({ categoryIndex: index })
    void this.performSearch()
  },
  handleRetry(this: SearchPageInstance) {
    void this.performSearch()
  },
  handleSwipeOpen(this: SearchPageInstance, e: WechatMiniprogram.CustomEvent<{ id?: string }>) {
    const openedId = `${e.detail.id || ''}`
    const rows = this.selectAllComponents('.record-swipe-row') as unknown as SwipeRowInstance[]
    rows.forEach((row) => {
      const recordId = row.data.record ? row.data.record.id : ''
      if (`${recordId}` !== openedId) {
        row.close()
      }
    })
  },
  handleRecordEdit(this: SearchPageInstance, e: WechatMiniprogram.CustomEvent<{ record?: HomeRecordItem }>) {
    const record = e.detail.record
    if (!record) {
      return
    }
    cacheEditingHomeTransaction(record)
    wx.navigateTo({ url: `/pages/add/add?mode=edit&type=${record.amountClass}` })
  },
  handleRecordDelete(this: SearchPageInstance, e: WechatMiniprogram.CustomEvent<{ record?: HomeRecordItem }>) {
    const record = e.detail.record
    if (!record) {
      return
    }
    wx.showModal({
      title: '删除记录',
      content: '删除后无法恢复，确定删除这条记录吗？',
      confirmText: '删除',
      confirmColor: '#ff6b6b',
      success: async (result) => {
        if (!result.confirm) {
          return
        }
        try {
          await deleteTransactionById(record.id)
          wx.showToast({ title: '删除成功', icon: 'success' })
          await this.performSearch()
        } catch (error) {
          console.error('delete transaction failed', error)
          wx.showToast({ title: '删除失败，请重试', icon: 'none' })
        }
      },
    })
  },
  goBack() {
    if (getCurrentPages().length > 1) {
      wx.navigateBack()
      return
    }
    wx.switchTab({ url: '/pages/index/index' })
  },
  requestVersion: 0,
  pageVisible: false,
})
