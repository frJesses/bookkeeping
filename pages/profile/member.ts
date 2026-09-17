import { getWindowInfo } from '../../utils/system-info'

Page({
  data: {
    statusBarHeight: 20,
    selectedPlan: 'year',
    plans: [
      { key: 'month', name: '连续包月', price: '9', original: '¥12/月' },
      { key: 'year', name: '连续包年', price: '88', original: '¥144/月', tag: '超值推荐' },
      { key: 'lifetime', name: '永久会员', price: '298', original: '¥988/月' },
    ],
  },
  onLoad() {
    this.setData({ statusBarHeight: getWindowInfo().statusBarHeight || 20 })
  },
  goBack() {
    wx.navigateBack()
  },
  selectPlan(e: WechatMiniprogram.BaseEvent) {
    const { plan } = e.currentTarget.dataset as { plan?: string }
    if (plan) this.setData({ selectedPlan: plan })
  },
  pay() {
    const plan = this.data.plans.find((item: { key: string }) => item.key === this.data.selectedPlan)
    wx.showToast({ title: `已选${plan ? plan.name : '会员'}`, icon: 'none' })
  },
})
