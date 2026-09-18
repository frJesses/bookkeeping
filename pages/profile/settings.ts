import { getWindowInfo } from '../../utils/system-info'

type SettingsPageInstance = WechatMiniprogram.Page.Instance<WechatMiniprogram.IAnyObject, WechatMiniprogram.IAnyObject>

Page({
  data: {
    statusBarHeight: 20,
    items: [
      {
        key: 'import',
        title: '账单导入',
        subtitle: '导入微信、支付宝或其他账单文件',
        icon: '/assets/figma/profile/bills.png',
      },
      {
        key: 'export',
        title: '账单导出',
        subtitle: '按时间范围导出账单数据',
        icon: '/assets/figma/stats-preview/records.png',
      },
      {
        key: 'recurring',
        title: '固定收支',
        subtitle: '管理房租、工资等周期性收支',
        icon: '/assets/figma/profile/budget.png',
      },
      {
        key: 'loan',
        title: '借出管理',
        subtitle: '记录借给他人的金额和收回情况',
        icon: '/assets/figma/profile/invite.png',
      },
    ],
  },
  onLoad(this: SettingsPageInstance) {
    this.setData({
      statusBarHeight: getWindowInfo().statusBarHeight || 20,
    })
  },
  handleItemClick(e: WechatMiniprogram.BaseEvent) {
    const key = String(e.currentTarget.dataset.key || '')
    if (!key) {
      return
    }
    if (key === 'export') {
      wx.navigateTo({ url: '/pages/profile/export' })
      return
    }
    if (key === 'import') {
      wx.navigateTo({ url: '/pages/profile/import' })
      return
    }
    if (key === 'recurring') {
      wx.navigateTo({ url: '/pages/profile/recurring' })
      return
    }
    if (key === 'loan') {
      wx.navigateTo({ url: '/pages/profile/loan' })
      return
    }
    wx.showToast({ title: '功能开发中', icon: 'none' })
  },
  goBack() {
    if (getCurrentPages().length > 1) {
      wx.navigateBack()
      return
    }
    wx.switchTab({ url: '/pages/profile/profile' })
  },
})
