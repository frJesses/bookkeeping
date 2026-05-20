Page({
  onShow() {
    const pageInstance = this as WechatMiniprogram.Page.Instance<WechatMiniprogram.IAnyObject, WechatMiniprogram.IAnyObject> & {
      getTabBar?: () => WechatMiniprogram.Component.TrivialInstance
    }
    const tabBar = typeof pageInstance.getTabBar === 'function' ? pageInstance.getTabBar() : undefined

    if (tabBar) {
      tabBar.setData({
        selectedPath: '/pages/add/add',
      })
    }
  },
})
