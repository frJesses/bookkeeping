type CustomTabBarInstance = WechatMiniprogram.Component.TrivialInstance & {
  data: {
    selectedPath: string
  }
}
Component({
  data: {
    hidden: false,
    selectedPath: '/pages/index/index',
    tabs: [
      {
        text: '账单',
        pagePath: '/pages/index/index',
        icon: '/assets/figma/tabbar/bill.png',
        activeIcon: '/assets/figma/tabbar/bill-active.png',
      },
      {
        text: '添加',
        pagePath: '/pages/add/landing',
        icon: '/assets/figma/tabbar/add.png',
        activeIcon: '/assets/figma/tabbar/add.png',
        isSpecial: true,
      },
      {
        text: '我的',
        pagePath: '/pages/profile/profile',
        icon: '/assets/figma/tabbar/profile.png',
        activeIcon: '/assets/figma/tabbar/profile-active.png',
      },
    ],
  },
  methods: {
    switchTab(this: CustomTabBarInstance, e: WechatMiniprogram.BaseEvent) {
      const { path } = e.currentTarget.dataset as { path?: string }
      if (!path) {
        return
      }
      if (path === '/pages/add/landing') {
        wx.navigateTo({
          url: path,
        })
        return
      }
      if (path === this.data.selectedPath) {
        return
      }
      wx.switchTab({
        url: path,
      })
    },
  },
})
