import { calculateCustomTabBarHeight } from './utils/tabbar'
import { ensureOpenId } from './services/auth'
import { configureRequest } from './services/request'
App<IAppOption>({
  globalData: {
    customTabBarHeight: 0,
    openId: '',
  },
  onLaunch() {
    configureRequest({
      // baseURL: 'https://wwlblog.top/api',
      baseURL: 'http://172.25.11.236:3005/v1',
    })
    const systemInfo = wx.getSystemInfoSync()
    this.globalData.customTabBarHeight = calculateCustomTabBarHeight(systemInfo)
    ensureOpenId().catch((error) => {
      console.error('init openId failed', error)
    })
  },
})
