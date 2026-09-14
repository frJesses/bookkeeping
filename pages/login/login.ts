import { ensureOpenId } from '../../services/auth'

Page({
  data: {
    statusBarHeight: 20,
    agreed: true,
    loading: false,
  },
  onLoad() {
    this.setData({ statusBarHeight: wx.getSystemInfoSync().statusBarHeight || 20 })
  },
  toggleAgreement() {
    this.setData({ agreed: !this.data.agreed })
  },
  changePhone() {
    wx.showToast({ title: '请使用微信授权的其他手机号', icon: 'none' })
  },
  async quickLogin() {
    if (!this.data.agreed) {
      wx.showToast({ title: '请先同意用户协议', icon: 'none' })
      return
    }
    this.setData({ loading: true })
    try {
      await ensureOpenId()
      wx.switchTab({ url: '/pages/index/index' })
    } catch (error) {
      wx.showToast({ title: '登录失败，请重试', icon: 'none' })
    } finally {
      this.setData({ loading: false })
    }
  },
})
