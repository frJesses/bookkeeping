import { getApiBaseURL } from './config/index'
import { configureRequest } from './services/request'
import { ensureOpenId } from './services/auth'
import { calculateCustomTabBarHeight } from './utils/tabbar'
import { getWindowInfo } from './utils/system-info'

App<IAppOption>({
  globalData: {
    customTabBarHeight: 0,
    openId: '',
    unionId: '',
  },
  onLaunch() {
    configureRequest({
      baseURL: getApiBaseURL(),
      tokenStorageKey: 'bookkeeping_token',
    })
    this.globalData.customTabBarHeight = calculateCustomTabBarHeight(getWindowInfo())
    ensureOpenId().catch((error) => {
      console.error('初始化微信登录失败', error)
    })
    this.checkUpdate()
  },
  checkUpdate() {
    // 基础库支持版本更新管理器
    if (wx.canIUse('getUpdateManager')) {
      const updateManager = wx.getUpdateManager()

      updateManager.onCheckForUpdate((res) => {
        console.log('是否有新版本：', res.hasUpdate)
      })
      updateManager.onUpdateReady(() => {
        wx.showModal({
          title: '更新提示',
          content: '发现新版本，是否立即更新？',
          confirmText: '立即更新',
          cancelText: '稍后',
          success: (res) => {
            if (res.confirm) {
              updateManager.applyUpdate()
            }
          },
        })
      })
      updateManager.onUpdateFailed(() => {
        wx.showModal({
          title: '更新失败',
          content: '新版本下载失败，请删除小程序后重新进入。',
        })
      })
    }
  },
})
