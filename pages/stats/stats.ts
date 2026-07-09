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
Page({
  behaviors: [createTabBarBehavior('/pages/stats/stats')],
  data: createInitialStatsPageData(),
  onLoad(this: TabBarBehaviorPageInstance) {
    this.initTabBarLayout()
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
    try {
      const reportState = await getStatsPageState(this.data.activeReport, this.data.activeFlow, this.data.selectedPeriodValue)
      this.setData(reportState)
    } catch (error) {
      console.error('load stats page failed', error)
    }
  },
  async selectReport(e: WechatMiniprogram.BaseEvent) {
    const { report } = e.currentTarget.dataset as { report?: ReportType }
    if (!report || report === this.data.activeReport) {
      return
    }
    const reportState = await getStatsPageState(report, this.data.activeFlow)
    this.setData({
      activeReport: report,
      ...reportState,
    })
  },
  async selectFlow(e: WechatMiniprogram.BaseEvent) {
    const { flow } = e.currentTarget.dataset as { flow?: FlowType }
    if (!flow || flow === this.data.activeFlow) {
      return
    }
    const reportState = await getStatsPageState(this.data.activeReport, flow, this.data.selectedPeriodValue)
    this.setData({
      activeFlow: flow,
      ...reportState,
    })
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
    const reportState = await selectStatsPeriod(this.data.activeReport, this.data.activeFlow, this.data.periodOptions, selectedIndex)
    this.setData(reportState)
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
})
