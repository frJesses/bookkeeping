import { createTabBarBehavior, TabBarBehaviorPageInstance } from '../../behaviors/tabbar'
import { createHomePageState, getHomePageData } from '../../services/home'

type EntryType = 'expense' | 'income'
type ShortcutAction = 'stats' | 'budget'

Page({
  behaviors: [createTabBarBehavior('/pages/index/index')],
  data: createHomePageState(),
  onLoad(this: TabBarBehaviorPageInstance) {
    this.initTabBarLayout()
    void this.loadPageData()
  },
  onShow(this: TabBarBehaviorPageInstance) {
    this.syncTabBarState()
    void this.loadPageData()
  },
  async loadPageData() {
    try {
      const data = await getHomePageData()
      this.setData(data)
    } catch (error) {
      console.error('load home overview failed', error)
    }
  },
  goToAdd(e: WechatMiniprogram.BaseEvent) {
    const { type } = e.currentTarget.dataset as { type?: EntryType }
    const entryType = type === 'income' ? 'income' : 'expense'
    wx.navigateTo({
      url: `/pages/add/add?type=${entryType}`,
    })
  },
  goToShortcut(e: WechatMiniprogram.BaseEvent) {
    const { action } = e.currentTarget.dataset as { action?: ShortcutAction }
    if (action === 'stats') {
      wx.switchTab({
        url: '/pages/stats/stats',
      })
      return
    }
    if (action === 'budget') {
      wx.navigateTo({
        url: '/pages/budget/budget',
      })
    }
  },
  goToBill() {
    wx.switchTab({
      url: '/pages/bill/bill',
    })
  },
})
