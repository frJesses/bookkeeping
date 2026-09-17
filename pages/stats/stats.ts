import { getStatsPageData, type StatsFlowMode, type StatsPageData, type StatsReportMode } from '../../services/stats'
import { getWindowInfo } from '../../utils/system-info'

type StatsPageInstance = WechatMiniprogram.Page.Instance<WechatMiniprogram.IAnyObject, WechatMiniprogram.IAnyObject> & {
  requestVersion: number
  data: StatsPageData & {
    statusBarHeight: number
    activeReport: StatsReportMode
    activeFlow: StatsFlowMode
    isLoading: boolean
    errorMessage: string
    categoryModalVisible: boolean
    categoryModalTitle: string
    categoryModalRows: StatsPageData['allCategories']
    pickerStart: string
    pickerEnd: string
    periodPickerFields: 'year' | 'month' | 'day'
    periodPickerValue: string
    showWeekPicker: boolean
    weekOptions: Array<{ label: string; value: string; rangeLabel: string }>
    weekPickerIndex: number
  }
}

function createCurrentMonth() {
  const now = new Date()
  return `${now.getFullYear()}-${`${now.getMonth() + 1}`.padStart(2, '0')}`
}

function createCurrentDate() {
  const now = new Date()
  return `${createCurrentMonth()}-${`${now.getDate()}`.padStart(2, '0')}`
}

function getDayOfYear(date: Date) {
  const start = new Date(date.getFullYear(), 0, 1)
  return Math.floor((date.getTime() - start.getTime()) / 86400000) + 1
}

function formatPeriodLabel(report: StatsReportMode, month: string, periodDate = '') {
  if (report === 'month') {
    return `${month.slice(0, 4)}年${Number(month.slice(5))}月`
  }
  if (report === 'year') {
    return `${month.slice(0, 4)}年`
  }
  const date = periodDate ? new Date(periodDate.replace(/-/g, '/')) : new Date()
  const firstWeekday = new Date(date.getFullYear(), 0, 1).getDay()
  const week = Math.ceil((getDayOfYear(date) + firstWeekday) / 7)
  return `第${week}周`
}

function formatDateValue(date: Date) {
  return `${date.getFullYear()}-${`${date.getMonth() + 1}`.padStart(2, '0')}-${`${date.getDate()}`.padStart(2, '0')}`
}

function getWeekStart(date: Date) {
  const result = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const weekday = result.getDay()
  result.setDate(result.getDate() - (weekday === 0 ? 6 : weekday - 1))
  return result
}

function createWeekOptions() {
  const current = getWeekStart(new Date())
  const options: Array<{ label: string; value: string; rangeLabel: string }> = []
  for (let index = 0; index < 208; index += 1) {
    const start = new Date(current)
    start.setDate(start.getDate() - index * 7)
    const end = new Date(start)
    end.setDate(end.getDate() + 6)
    const weekNumber = Math.ceil((getDayOfYear(start) + new Date(start.getFullYear(), 0, 1).getDay()) / 7)
    options.push({
      label: index === 0 ? '本周' : `第${weekNumber}周`,
      value: formatDateValue(start),
      rangeLabel: `${start.getMonth() + 1}月${start.getDate()}日 - ${end.getMonth() + 1}月${end.getDate()}日`,
    })
  }
  return options
}

const initialMonth = createCurrentMonth()
const initialDate = createCurrentDate()

Page({
  data: {
    month: initialMonth,
    monthLabel: `${initialMonth.slice(0, 4)}年${Number(initialMonth.slice(5))}月`,
    periodLabel: formatPeriodLabel('month', initialMonth),
    periodDate: initialDate,
    totalIncome: '0.00',
    totalExpense: '0.00',
    totalBalance: '0.00',
    categories: [],
    allCategories: [],
    bars: [],
    barScaleLabels: ['0', '0', '0'],
    donutGradient: '#e9eeee 0 100%',
    statusBarHeight: 20,
    activeReport: 'month' as StatsReportMode,
    activeFlow: 'expense' as StatsFlowMode,
    isLoading: false,
    errorMessage: '',
    categoryModalVisible: false,
    categoryModalTitle: '',
    categoryModalRows: [],
    pickerStart: `${new Date().getFullYear() - 3}-01-01`,
    pickerEnd: `${new Date().getFullYear()}-${`${new Date().getMonth() + 1}`.padStart(2, '0')}-${`${new Date().getDate()}`.padStart(2, '0')}`,
    periodPickerFields: 'month' as 'year' | 'month' | 'day',
    periodPickerValue: initialMonth,
    showWeekPicker: false,
    weekOptions: createWeekOptions(),
    weekPickerIndex: 0,
    reportOptions: [
      { key: 'week', label: '周' },
      { key: 'month', label: '月' },
      { key: 'year', label: '年' },
    ],
  },
  onLoad(this: StatsPageInstance) {
    this.setData({ statusBarHeight: getWindowInfo().statusBarHeight || 20 })
    void this.loadStats()
  },
  onShow(this: StatsPageInstance) {
    if (this.requestVersion > 0) {
      void this.loadStats()
    }
  },
  async loadStats(this: StatsPageInstance) {
    this.requestVersion += 1
    const requestVersion = this.requestVersion
    this.setData({ isLoading: true, errorMessage: '' })
    wx.showLoading({ title: '', mask: true })
    try {
      const data = await getStatsPageData(
        this.data.month,
        this.data.activeReport,
        this.data.activeFlow,
        this.data.periodDate,
      )
      if (requestVersion !== this.requestVersion) {
        return
      }
      this.setData({
        ...data,
        periodLabel: formatPeriodLabel(this.data.activeReport, data.month, data.periodDate),
        periodPickerFields:
          this.data.activeReport === 'year' ? 'year' : this.data.activeReport === 'week' ? 'day' : 'month',
        periodPickerValue:
          this.data.activeReport === 'year'
            ? data.month.slice(0, 4)
            : this.data.activeReport === 'week'
              ? data.periodDate
              : data.month,
        isLoading: false,
      })
    } catch (error) {
      if (requestVersion !== this.requestVersion) {
        return
      }
      console.error('load stats data failed', error)
      this.setData({ isLoading: false, errorMessage: '统计数据加载失败，请稍后重试' })
    } finally {
      if (requestVersion === this.requestVersion) {
        wx.hideLoading()
      }
    }
  },
  goBack() {
    if (getCurrentPages().length > 1) {
      wx.navigateBack()
      return
    }
    wx.switchTab({ url: '/pages/index/index' })
  },
  goToPreview() {
    wx.navigateTo({ url: `/pages/stats/preview?month=${this.data.month}` })
  },
  selectReport(this: StatsPageInstance, event: WechatMiniprogram.BaseEvent) {
    const { report } = event.currentTarget.dataset as { report?: StatsReportMode }
    if (!report || report === this.data.activeReport) {
      return
    }
    const currentMonth = createCurrentMonth()
    const currentDate = createCurrentDate()
    this.setData({
      activeReport: report,
      month: currentMonth,
      periodDate: currentDate,
      periodPickerFields: report === 'year' ? 'year' : report === 'week' ? 'day' : 'month',
      periodPickerValue: report === 'year' ? currentMonth.slice(0, 4) : report === 'week' ? currentDate : currentMonth,
    })
    void this.loadStats()
  },
  selectFlow(this: StatsPageInstance, event: WechatMiniprogram.BaseEvent) {
    const { flow } = event.currentTarget.dataset as { flow?: StatsFlowMode }
    if (!flow || flow === this.data.activeFlow) {
      return
    }
    this.setData({ activeFlow: flow })
    void this.loadStats()
  },
  handlePeriodPickerChange(this: StatsPageInstance, event: WechatMiniprogram.CustomEvent<{ value?: string }>) {
    const value = event.detail.value
    if (!value) {
      return
    }
    let month = this.data.month
    let periodDate = this.data.periodDate
    if (this.data.activeReport === 'year') {
      const currentYear = new Date().getFullYear()
      const currentMonth = `${new Date().getMonth() + 1}`.padStart(2, '0')
      month = `${value}-${value === `${currentYear}` ? currentMonth : '12'}`
      periodDate = `${month}-01`
    } else if (this.data.activeReport === 'week') {
      periodDate = value
      month = value.slice(0, 7)
    } else {
      month = value
      periodDate = `${value}-01`
    }
    this.setData({ month, periodDate, periodPickerValue: value })
    void this.loadStats()
  },
  openWeekPicker(this: StatsPageInstance) {
    const options = createWeekOptions()
    const selectedIndex = options.findIndex((item) => item.value === this.data.periodDate)
    this.setData({
      showWeekPicker: true,
      weekOptions: options,
      weekPickerIndex: selectedIndex >= 0 ? selectedIndex : 0,
    })
  },
  selectWeekOption(this: StatsPageInstance, event: WechatMiniprogram.BaseEvent) {
    const index = Number((event.currentTarget.dataset as { index?: number | string }).index)
    if (Number.isNaN(index) || !this.data.weekOptions[index]) {
      return
    }
    this.setData({ weekPickerIndex: index })
  },
  confirmWeekPicker(this: StatsPageInstance) {
    const option = this.data.weekOptions[this.data.weekPickerIndex]
    if (!option) {
      return
    }
    this.setData({ showWeekPicker: false })
    this.setData({
      month: option.value.slice(0, 7),
      periodDate: option.value,
      periodPickerValue: option.value,
    })
    void this.loadStats()
  },
  closeWeekPicker() {
    this.setData({ showWeekPicker: false })
  },
  openCategoryDetail(this: StatsPageInstance, event: WechatMiniprogram.BaseEvent) {
    const index = Number((event.currentTarget.dataset as { index?: number | string }).index)
    const category = this.data.categories[index]
    if (!category) {
      return
    }
    const categoryRows =
      category.name === '其他' ? this.data.allCategories.slice(5) : [this.data.allCategories[index] || category]
    this.setData({
      categoryModalVisible: true,
      categoryModalTitle: category.name,
      categoryModalRows: categoryRows.map((item) => ({ ...item, expanded: false })),
    })
  },
  openAllCategories(this: StatsPageInstance) {
    this.setData({
      categoryModalVisible: true,
      categoryModalTitle: '全部分类',
      categoryModalRows: this.data.allCategories.map((item) => ({ ...item, expanded: false })),
    })
  },
  closeCategoryModal() {
    this.setData({ categoryModalVisible: false })
  },
  toggleCategoryRecords(this: StatsPageInstance, event: WechatMiniprogram.BaseEvent) {
    const index = Number((event.currentTarget.dataset as { index?: number | string }).index)
    if (Number.isNaN(index) || !this.data.categoryModalRows[index]) {
      return
    }
    const rows = this.data.categoryModalRows.map((item, itemIndex) => ({
      ...item,
      expanded: itemIndex === index ? !item.expanded : item.expanded,
    }))
    this.setData({ categoryModalRows: rows })
  },
  noop() {},
  handleRetry(this: StatsPageInstance) {
    void this.loadStats()
  },
  requestVersion: 0,
})
