import { calculateCustomTabBarHeight } from './utils/tabbar'
import { ensureOpenId } from './services/auth'
import { configureRequest } from './services/request'
import { getApiBaseURL } from './config/index'
App<IAppOption>({
  globalData: {
    customTabBarHeight: 0,
    openId: '',
  },
  onLaunch() {
    configureRequest({
      baseURL: getApiBaseURL(),
    })
    const systemInfo = wx.getSystemInfoSync()
    this.globalData.customTabBarHeight = calculateCustomTabBarHeight(systemInfo)
    ensureOpenId().catch((error) => {
      console.error('init openId failed', error)
    })
  },
})
