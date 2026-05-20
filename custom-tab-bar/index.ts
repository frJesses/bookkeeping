Component({
  data: {
    selectedPath: '/pages/index/index',
    tabs: [
      {
        text: '首页',
        pagePath: '/pages/index/index',
        icon: '⌂',
      },
      {
        text: '账单',
        pagePath: '/pages/bill/bill',
        icon: '≡',
      },
      {
        text: '添加',
        pagePath: '/pages/add/add',
        icon: '+',
        isSpecial: true,
      },
      {
        text: '统计',
        pagePath: '/pages/stats/stats',
        icon: '◔',
      },
      {
        text: '我的',
        pagePath: '/pages/profile/profile',
        icon: '◡',
      },
    ],
  },
  methods: {
    switchTab(e: WechatMiniprogram.BaseEvent) {
      const { path } = e.currentTarget.dataset as { path: string }

      if (!path || path === this.data.selectedPath) {
        return
      }

      wx.switchTab({
        url: path,
      })
    },
  },
})
