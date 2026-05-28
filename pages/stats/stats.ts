import { createTabBarBehavior, type TabBarBehaviorPageInstance } from '../../behaviors/tabbar'
import { type BarPoint, type FlowType, type ReportType } from '../../constants/stats'
import { createInitialStatsPageData, getStatsPageState, setActiveBarPoint } from '../../services/stats'

Page({
  behaviors: [createTabBarBehavior('/pages/stats/stats')],
  data: createInitialStatsPageData(),
  onLoad(this: TabBarBehaviorPageInstance) {
    this.initTabBarLayout()
    void this.loadPageData()
  },
  onShow(this: TabBarBehaviorPageInstance) {
    this.syncTabBarState()
  },
  async loadPageData() {
    try {
      const reportState = await getStatsPageState(this.data.activeReport, this.data.activeFlow)
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
    const reportState = await getStatsPageState(this.data.activeReport, flow)
    this.setData({
      activeFlow: flow,
      ...reportState,
    })
  },
  selectBarPoint(e: WechatMiniprogram.BaseEvent) {
    const { index } = e.currentTarget.dataset as { index?: number | string }
    const pointIndex = Number(index)
    if (Number.isNaN(pointIndex)) {
      return
    }
    this.setData({
      ...setActiveBarPoint(this.data.barPoints as BarPoint[], pointIndex),
    })
  },
})
