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
        text: '首页',
        pagePath: '/pages/index/index',
        icon: '/assets/tabbar/home.svg',
        activeIcon: '/assets/tabbar/home-active.svg',
      },
      {
        text: '账单',
        pagePath: '/pages/bill/bill',
        icon: '/assets/tabbar/bill.svg',
        activeIcon: '/assets/tabbar/bill-active.svg',
      },
      {
        text: '添加',
        pagePath: '/pages/add/add',
        icon: '/assets/tabbar/add.svg',
        activeIcon: '/assets/tabbar/add.svg',
        isSpecial: true,
      },
      {
        text: '统计',
        pagePath: '/pages/stats/stats',
        icon: '/assets/tabbar/stats.svg',
        activeIcon: '/assets/tabbar/stats-active.svg',
      },
      {
        text: '我的',
        pagePath: '/pages/profile/profile',
        icon: '/assets/tabbar/profile.svg',
        activeIcon: '/assets/tabbar/profile-active.svg',
      },
    ],
  },
  methods: {
    switchTab(this: CustomTabBarInstance, e: WechatMiniprogram.BaseEvent) {
      const { path } = e.currentTarget.dataset as { path?: string }
      if (!path) {
        return
      }
      if (path === '/pages/add/add') {
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
