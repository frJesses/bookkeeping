type TabBarPageInstance = WechatMiniprogram.Page.Instance<
  WechatMiniprogram.IAnyObject,
  WechatMiniprogram.IAnyObject
> & {
  getTabBar?: () => WechatMiniprogram.Component.TrivialInstance
}
export const BASE_TAB_BAR_HEIGHT_RPX = 98
export const TAB_BAR_BOTTOM_GAP_RPX = 0
export const TAB_BAR_CONTENT_GAP = 0
export function calculateCustomTabBarHeight(systemInfo: WechatMiniprogram.SystemInfo) {
  const rpxUnit = systemInfo.windowWidth / 750
  const safeBottom = systemInfo.safeArea
    ? systemInfo.screenHeight - systemInfo.safeArea.bottom
    : 0
  return (BASE_TAB_BAR_HEIGHT_RPX + TAB_BAR_BOTTOM_GAP_RPX) * rpxUnit + safeBottom
}
export function getCustomTabBarHeight() {
  const app = getApp<IAppOption>()
  if (app.globalData.customTabBarHeight) {
    return app.globalData.customTabBarHeight
  }
  const systemInfo = wx.getSystemInfoSync()
  return calculateCustomTabBarHeight(systemInfo)
}
export function syncCustomTabBar(page: TabBarPageInstance, selectedPath: string) {
  const tabBar = typeof page.getTabBar === 'function' ? page.getTabBar() : undefined
  if (tabBar) {
    tabBar.setData({
      selectedPath,
    })
  }
}
