import { createTabBarBehavior, type TabBarBehaviorPageInstance } from '../../behaviors/tabbar'
import { fetchProfilePageData, getProfilePageData } from '../../services/profile'
type ProfilePageInstance = TabBarBehaviorPageInstance & {
  profileInitialized: boolean
  loadPageDataTask: Promise<void> | null
}
Page({
  behaviors: [createTabBarBehavior('/pages/profile/profile')],
  data: getProfilePageData(),
  onLoad(this: ProfilePageInstance) {
    this.initTabBarLayout()
  },
  onReady(this: ProfilePageInstance) {
    void this.loadPageData()
  },
  onShow(this: ProfilePageInstance) {
    this.syncTabBarState()
    if (this.profileInitialized) {
      void this.loadPageData()
    }
  },
  async loadPageData(this: ProfilePageInstance) {
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
  async performLoadPageData(this: ProfilePageInstance) {
    try {
      this.profileInitialized = true
      const data = await fetchProfilePageData()
      this.setData(data)
    } catch (error) {
      console.error('load profile page failed', error)
    }
  },
  handleMenuClick(e: WechatMiniprogram.BaseEvent) {
    const { action } = e.currentTarget.dataset as { action?: string }
    const routeMap: Record<string, string> = {
      bills: '/pages/bill/bill',
      budget: '/pages/budget/budget',
      achievement: '/pages/profile/achievement',
      personal: '/pages/profile/personal',
      settings: '/pages/profile/settings',
      feedback: '/pages/profile/feedback',
    }
    const url = action ? routeMap[action] : ''
    if (url) wx.navigateTo({ url })
  },
  onShareAppMessage() {
    return {
      title: '滴水记账',
      path: '/pages/index/index',
      imageUrl: 'https://www.wwlblog.top/system/shoppking.png',
    }
  },
  profileInitialized: false,
  loadPageDataTask: null,
})
