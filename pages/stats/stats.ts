import { createTabBarBehavior, type TabBarBehaviorPageInstance } from '../../behaviors/tabbar'
import { type BarPoint, type FlowType, type ReportType } from '../../constants/stats'
import {
  createInitialStatsPageData,
  getStatsPageState,
  selectStatsPeriod,
  setActiveBarPoint,
  type StatsPeriodOption,
} from '../../services/stats'
type PageWithCustomTabBar = WechatMiniprogram.Page.Instance<WechatMiniprogram.IAnyObject, WechatMiniprogram.IAnyObject> & {
  getTabBar?: () => WechatMiniprogram.Component.TrivialInstance
}
type CustomTabBarInstance = WechatMiniprogram.Component.TrivialInstance & {
  setData(data: WechatMiniprogram.IAnyObject, callback?: () => void): void
}
type StatsPageInstance = TabBarBehaviorPageInstance & {
  data: ReturnType<typeof createInitialStatsPageData> & {
    statusBarHeight: number
    navBarHeight: number
    capsuleTop: number
    capsuleHeight: number
    capsuleWidth: number
    capsuleRight: number
  }
  loadPageData(): Promise<void>
  handleRetry(): void
  initCustomHeader(): void
}
Page({
  behaviors: [createTabBarBehavior('/pages/stats/stats')],
  data: {
    ...createInitialStatsPageData(),
    statusBarHeight: 20,
    navBarHeight: 88,
    capsuleTop: 0,
    capsuleHeight: 32,
    capsuleWidth: 96,
    capsuleRight: 16,
  },
  onLoad(this: StatsPageInstance) {
    this.initTabBarLayout()
    this.initCustomHeader()
    void this.loadPageData()
  },
  onShow(this: TabBarBehaviorPageInstance) {
    this.syncTabBarState()
    this.setCustomTabBarHidden(false)
  },
  onHide() {
    this.setCustomTabBarHidden(false)
  },
  onUnload() {
    this.setCustomTabBarHidden(false)
  },
  async loadPageData() {
    this.setData({ statsLoading: true, statsError: '' })
    try {
      const reportState = await getStatsPageState(this.data.activeReport, this.data.activeFlow, this.data.selectedPeriodValue)
      this.setData(reportState)
    } catch (error) {
      console.error('load stats page failed', error)
      this.setData({
        statsLoading: false,
        statsError: error instanceof Error ? error.message : '报表数据加载失败，请稍后重试',
      })
    }
  },
  handleRetry() {
    void this.loadPageData()
  },
  async selectReport(e: WechatMiniprogram.BaseEvent) {
    const { report } = e.currentTarget.dataset as { report?: ReportType }
    if (!report || report === this.data.activeReport) {
      return
    }
    this.setData({ activeReport: report, statsLoading: true, statsError: '' })
    try {
      const reportState = await getStatsPageState(report, this.data.activeFlow)
      this.setData(reportState)
    } catch (error) {
      console.error('select stats report failed', error)
      this.setData({
        statsLoading: false,
        statsError: error instanceof Error ? error.message : '报表数据加载失败，请稍后重试',
      })
    }
  },
  async selectFlow(e: WechatMiniprogram.BaseEvent) {
    const { flow } = e.currentTarget.dataset as { flow?: FlowType }
    if (!flow || flow === this.data.activeFlow) {
      return
    }
    this.setData({ activeFlow: flow, statsLoading: true, statsError: '' })
    try {
      const reportState = await getStatsPageState(this.data.activeReport, flow, this.data.selectedPeriodValue)
      this.setData(reportState)
    } catch (error) {
      console.error('select stats flow failed', error)
      this.setData({
        statsLoading: false,
        statsError: error instanceof Error ? error.message : '报表数据加载失败，请稍后重试',
      })
    }
  },
  openPeriodPicker() {
    this.setCustomTabBarHidden(true, () => {
      wx.nextTick(() => {
        this.setData({
          showPeriodPicker: true,
        })
      })
    })
  },
  closePeriodPicker() {
    this.setData({
      showPeriodPicker: false,
    })
  },
  async confirmPeriodPicker(e: WechatMiniprogram.CustomEvent<{ value?: StatsPeriodOption; index?: number }>) {
    const selectedIndex = typeof e.detail.index === 'number' ? e.detail.index : 0
    this.setData({ showPeriodPicker: false, statsLoading: true, statsError: '' })
    try {
      const reportState = await selectStatsPeriod(this.data.activeReport, this.data.activeFlow, this.data.periodOptions, selectedIndex)
      this.setData(reportState)
    } catch (error) {
      console.error('select stats period failed', error)
      this.setData({
        statsLoading: false,
        statsError: error instanceof Error ? error.message : '报表数据加载失败，请稍后重试',
      })
    }
  },
  handlePeriodPickerAfterLeave() {
    this.setCustomTabBarHidden(false)
  },
  setCustomTabBarHidden(hidden: boolean, callback?: () => void) {
    const page = this as unknown as PageWithCustomTabBar
    const tabBar = typeof page.getTabBar === 'function' ? page.getTabBar() as CustomTabBarInstance : undefined
    if (tabBar) {
      tabBar.setData({ hidden }, callback)
      return
    }
    if (callback) {
      callback()
    }
  },
  selectBarPoint(e: WechatMiniprogram.CustomEvent<{ index?: number | string }>) {
    const { index } = e.detail || {}
    const pointIndex = Number(index)
    if (Number.isNaN(pointIndex)) {
      return
    }
    this.setData({
      ...setActiveBarPoint(this.data.barPoints as BarPoint[], pointIndex),
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
})
