import { calculateCustomTabBarHeight } from './utils/tabbar'

App<IAppOption>({
  globalData: {
    customTabBarHeight: 0,
  },
  onLaunch() {
    const systemInfo = wx.getSystemInfoSync()
    this.globalData.customTabBarHeight = calculateCustomTabBarHeight(systemInfo)
  },
})
