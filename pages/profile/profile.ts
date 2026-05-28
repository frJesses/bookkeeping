import { createTabBarBehavior, type TabBarBehaviorPageInstance } from '../../behaviors/tabbar'
import { fetchProfilePageData, getProfilePageData } from '../../services/profile'

Page({
  behaviors: [createTabBarBehavior('/pages/profile/profile')],
  data: getProfilePageData(),
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
      const data = await fetchProfilePageData()
      this.setData(data)
    } catch (error) {
      console.error('load profile page failed', error)
    }
  },
})
