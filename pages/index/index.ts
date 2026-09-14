import { createTabBarBehavior, TabBarBehaviorPageInstance } from '../../behaviors/tabbar'
import type {
  PagedScrollFetchMethod,
  PagedScrollInstance,
  PagedScrollRequest,
} from '../../components/paged-scroll/index'
import {
  buildHomeRecentRecordGroups,
  createHomePageState,
  getHomeMonthOverview,
  getHomeRecentRecordPage,
  type HomeRecentRecordDTO,
  type HomeRecordItem,
} from '../../services/home'
import {
  cacheEditingHomeTransaction,
  deleteTransactionById,
} from '../../services/transaction-detail'
import {
  createAvailableMonthOptions,
  createMonthPickerState,
  createRecentYearOptions,
} from '../../utils/month-picker'

type EntryType = 'expense' | 'income'
type CustomTabBarPage = WechatMiniprogram.Page.Instance<WechatMiniprogram.IAnyObject, WechatMiniprogram.IAnyObject> & {
  getTabBar?: () => WechatMiniprogram.Component.TrivialInstance
}
type TransactionSwipeRowInstance = WechatMiniprogram.Component.TrivialInstance & {
  data: {
    record?: HomeRecordItem
  }
  close: () => void
}
type HomePageInstance = TabBarBehaviorPageInstance & {
  homeInitialized: boolean
  loadPageDataVersion: number
  data: ReturnType<typeof createHomePageState> & {
    statusBarHeight: number
    navBarHeight: number
    capsuleTop: number
    capsuleHeight: number
    capsuleWidth: number
    capsuleRight: number
    showDatePicker: boolean
    pickerYears: string[]
    pickerMonths: string[]
    pickerValue: number[]
  }
}

function setCustomTabBarHidden(page: HomePageInstance, hidden: boolean) {
  const tabBarPage = page as unknown as CustomTabBarPage
  const tabBar = typeof tabBarPage.getTabBar === 'function' ? tabBarPage.getTabBar() : undefined
  if (tabBar) {
    tabBar.setData({ hidden })
  }
}

const initialPickerYears = createRecentYearOptions()

Page({
  behaviors: [createTabBarBehavior('/pages/index/index')],
  data: {
    ...createHomePageState(),
    statusBarHeight: 20,
    navBarHeight: 88,
    capsuleTop: 0,
    capsuleHeight: 32,
    capsuleWidth: 96,
    capsuleRight: 16,
    showDatePicker: false,
    pickerYears: initialPickerYears,
    pickerMonths: createAvailableMonthOptions(initialPickerYears[0]),
    pickerValue: [0, 0],
  },
  onLoad(this: HomePageInstance) {
    this.initTabBarLayout()
    this.initCustomHeader()
  },
  onReady(this: HomePageInstance) {
    void this.loadPageData()
  },
  onShow(this: HomePageInstance) {
    this.syncTabBarState()
    setCustomTabBarHidden(this, this.data.showDatePicker)
    if (this.homeInitialized) {
      void this.loadPageData()
    }
  },
  onUnload(this: HomePageInstance) {
    setCustomTabBarHidden(this, false)
  },
  async loadPageData(this: HomePageInstance) {
    this.homeInitialized = true
    this.loadPageDataVersion += 1
    const requestVersion = this.loadPageDataVersion
    const selectedMonth = this.data.selectedMonth
    const pagedScroll = this.selectComponent('#homePagedScroll') as PagedScrollInstance | null
    const listTask = pagedScroll
      ? pagedScroll.initLoad(this.fetchRecentRecords.bind(this) as PagedScrollFetchMethod, {
        pageSize: 10,
        month: selectedMonth,
        status: 'normal',
      })
      : Promise.resolve()
    const [overview] = await Promise.all([
      getHomeMonthOverview(selectedMonth),
      listTask,
    ])
    if (requestVersion === this.loadPageDataVersion && selectedMonth === this.data.selectedMonth) {
      this.setData(overview)
    }
  },
  fetchRecentRecords(this: HomePageInstance, params: PagedScrollRequest) {
    return getHomeRecentRecordPage({
      pageNo: params.pageNo,
      pageSize: params.pageSize,
      month: typeof params.month === 'string' ? params.month : this.data.selectedMonth,
      status: typeof params.status === 'string' ? params.status : 'normal',
    })
  },
  handleRecordsChange(e: WechatMiniprogram.CustomEvent<{ list?: HomeRecentRecordDTO[] }>) {
    const list = e.detail && Array.isArray(e.detail.list) ? e.detail.list : []
    this.setData({ recentRecordGroups: buildHomeRecentRecordGroups(list) })
  },
  async handleRecordsRefresh(this: HomePageInstance) {
    const selectedMonth = this.data.selectedMonth
    const overview = await getHomeMonthOverview(selectedMonth)
    if (selectedMonth === this.data.selectedMonth) {
      this.setData(overview)
    }
  },
  goToBudget() {
    wx.navigateTo({ url: '/pages/budget/budget' })
  },
  goToCalendar() {
    wx.navigateTo({ url: '/pages/calendar/calendar' })
  },
  goToStats() {
    wx.navigateTo({ url: '/pages/stats/stats' })
  },
  handleSwipeOpen(e: WechatMiniprogram.CustomEvent<{ id?: string }>) {
    const openedId = `${e.detail.id || ''}`
    const rows = this.selectAllComponents('.record-swipe-row') as unknown as TransactionSwipeRowInstance[]
    rows.forEach((row) => {
      const recordId = row.data.record ? row.data.record.id : ''
      if (`${recordId}` !== openedId) {
        row.close()
      }
    })
  },
  handleRecordEdit(e: WechatMiniprogram.CustomEvent<{ record?: HomeRecordItem }>) {
    const record = e.detail.record
    if (!record) {
      return
    }
    cacheEditingHomeTransaction(record)
    wx.navigateTo({
      url: `/pages/add/add?mode=edit&type=${record.amountClass}`,
    })
  },
  handleRecordDelete(this: HomePageInstance, e: WechatMiniprogram.CustomEvent<{ record?: HomeRecordItem }>) {
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
          await this.loadPageData()
        } catch (error) {
          console.error('delete transaction failed', error)
          wx.showToast({ title: '删除失败，请重试', icon: 'none' })
        }
      },
    })
  },
  openDatePicker(this: HomePageInstance) {
    this.setData({
      showDatePicker: true,
      ...createMonthPickerState(this.data.selectedMonth),
    })
    setCustomTabBarHidden(this, true)
  },
  closeDatePicker(this: HomePageInstance) {
    this.setData({ showDatePicker: false })
    setCustomTabBarHidden(this, false)
  },
  handleDatePickerChange(this: HomePageInstance, e: WechatMiniprogram.CustomEvent<{ value?: number[] }>) {
    if (!Array.isArray(e.detail.value)) {
      return
    }
    const [yearIndex = 0, monthIndex = 0] = e.detail.value
    const previousYear = this.data.pickerYears[this.data.pickerValue[0]]
    const selectedYear = this.data.pickerYears[yearIndex]
    if (!selectedYear) {
      return
    }
    if (selectedYear !== previousYear) {
      this.setData({
        pickerMonths: createAvailableMonthOptions(selectedYear),
        pickerValue: [yearIndex, 0],
      })
      return
    }
    this.setData({ pickerValue: [yearIndex, monthIndex] })
  },
  async confirmDatePicker(this: HomePageInstance) {
    const year = this.data.pickerYears[this.data.pickerValue[0]]
    const month = this.data.pickerMonths[this.data.pickerValue[1]]
    if (!year || !month) {
      return
    }
    const selectedMonth = `${year}-${String(month).padStart(2, '0')}`
    this.setData({
      showDatePicker: false,
      selectedMonth,
      selectedMonthLabel: `${year}年${month}月`,
      recentRecordGroups: [],
    })
    setCustomTabBarHidden(this, false)
    await this.loadPageData()
  },
  noop() {},
  goToAdd(e: WechatMiniprogram.BaseEvent) {
    const { type } = e.currentTarget.dataset as { type?: EntryType }
    const entryType = type === 'income' ? 'income' : 'expense'
    wx.navigateTo({
      url: `/pages/add/add?type=${entryType}`,
    })
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
  homeInitialized: false,
  loadPageDataVersion: 0,
})
