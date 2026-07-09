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
    if (action !== 'about') {
      return
    }
    wx.navigateTo({
      url: '/pages/profile/about/index',
    })
  },
  onShareAppMessage() {
    return {
      title: '钱小迹',
      path: '/pages/index/index',
      imageUrl: "https://www.wwlblog.top/system/shoppking.png"
    }
  },
  profileInitialized: false,
  loadPageDataTask: null,
})
