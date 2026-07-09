import { createTabBarBehavior, TabBarBehaviorPageInstance } from '../../behaviors/tabbar'
import {
  buildHomeRecentRecordGroups,
  createHomePageState,
  getHomeMonthOverview,
  getHomeRecentRecordPage,
  HomeRecentRecordDTO,
} from '../../services/home'
import { cacheTransactionDetail } from '../../services/transaction-detail'
type EntryType = 'expense' | 'income'
type LoadScrollInstance = WechatMiniprogram.Component.TrivialInstance & {
  initLoad: (fetchMethods: (params?: Record<string, unknown>) => Promise<unknown>, params?: Record<string, unknown>) => Promise<void>
  getList: <T = unknown>() => T[]
}
type HomePageInstance = TabBarBehaviorPageInstance & {
  homeInitialized: boolean
  loadPageDataTask: Promise<void> | null
}
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
    headerSolid: false,
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
    if (this.homeInitialized) {
      void this.loadPageData()
    }
  },
  async loadPageData(this: HomePageInstance) {
    if (this.loadPageDataTask) {
      return this.loadPageDataTask
    }
    const task = this.performLoadPageData()
    this.loadPageDataTask = task
    try {
      await task
    } finally {
      if (this.loadPageDataTask === task) {
        this.loadPageDataTask = null
      }
    }
  },
  async performLoadPageData(this: HomePageInstance) {
    try {
      this.homeInitialized = true
      const loadScroll = this.selectComponent('#homeLoadScroll') as LoadScrollInstance | null
      if (!loadScroll || typeof loadScroll.initLoad !== 'function') {
        await this.loadOverviewData(this.data.selectedMonth)
        return
      }
      await loadScroll.initLoad(this.fetchRecentRecordPage.bind(this), {
        month: this.data.selectedMonth,
        status: 'normal',
      })
      const list = loadScroll.getList<HomeRecentRecordDTO>()
      this.setData({
        recentRecordGroups: buildHomeRecentRecordGroups(Array.isArray(list) ? list : []),
      })
    } catch (error) {
      console.error('load home data failed', error)
    }
  },
  async loadOverviewData(month: string) {
    const overview = await getHomeMonthOverview(month)
    this.setData(overview)
  },
  async fetchRecentRecordPage(this: HomePageInstance, params?: Record<string, unknown>) {
    const query = params || {}
    const pageNo = typeof query.pageNo === 'number' ? query.pageNo : 1
    if (pageNo === 1) {
      const month = typeof query.month === 'string' ? query.month : this.data.selectedMonth
      await this.loadOverviewData(month)
    }
    return getHomeRecentRecordPage({
      pageNo,
      pageSize: typeof query.pageSize === 'number' ? query.pageSize : 10,
      month: typeof query.month === 'string' ? query.month : this.data.selectedMonth,
      status: typeof query.status === 'string' ? query.status : 'normal',
    })
  },
  handleRecentRecordsLoaded(e: WechatMiniprogram.CustomEvent<{ list: HomeRecentRecordDTO[] }>) {
    const list = e.detail && Array.isArray(e.detail.list) ? e.detail.list : []
    this.setData({
      recentRecordGroups: buildHomeRecentRecordGroups(list),
    })
  },
  handleEmptyAction() {
    wx.navigateTo({
      url: '/pages/add/add?type=expense',
    })
  },
  handleRecordTap(e: WechatMiniprogram.BaseEvent) {
    const dataset = e.currentTarget.dataset as {
      groupIndex?: number | string
      recordIndex?: number | string
    }
    const groupIndex = Number(dataset.groupIndex)
    const recordIndex = Number(dataset.recordIndex)
    if (Number.isNaN(groupIndex) || Number.isNaN(recordIndex)) {
      return
    }
    const groups = this.data.recentRecordGroups || []
    const targetGroup = groups[groupIndex]
    const targetRecord = targetGroup && Array.isArray(targetGroup.records) ? targetGroup.records[recordIndex] : null
    if (!targetRecord) {
      return
    }
    cacheTransactionDetail(targetRecord)
    wx.navigateTo({
      url: `/pages/bill/record-detail/index?id=${targetRecord.id}`,
    })
  },
  async handleMonthChange(this: HomePageInstance, e: WechatMiniprogram.CustomEvent) {
    const selectedIndex = Number(e.detail.value)
    const selectedOption = this.data.monthOptions[selectedIndex]
    if (!selectedOption || selectedOption.value === this.data.selectedMonth) {
      return
    }
    this.setData({
      selectedMonth: selectedOption.value,
      selectedMonthIndex: selectedIndex,
      recentRecordGroups: [],
    })
    await this.loadPageData()
  },
  goToAdd(e: WechatMiniprogram.BaseEvent) {
    const { type } = e.currentTarget.dataset as { type?: EntryType }
    const entryType = type === 'income' ? 'income' : 'expense'
    wx.navigateTo({
      url: `/pages/add/add?type=${entryType}`,
    })
  },
  handlePageScroll(e: WechatMiniprogram.CustomEvent<{ scrollTop: number }>) {
    const detail = e.detail || { scrollTop: 0 }
    const scrollTop = typeof detail.scrollTop === 'number' ? detail.scrollTop : 0
    const headerSolid = scrollTop > 24
    if (headerSolid !== this.data.headerSolid) {
      this.setData({ headerSolid })
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
  homeInitialized: false,
  loadPageDataTask: null,
})
