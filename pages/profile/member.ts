import { getWindowInfo } from '../../utils/system-info'

type MemberPlan = {
  key: string
  name: string
  price: string
  original: string
  tag?: string
}

const MEMBER_PLANS: MemberPlan[] = [
  { key: 'month', name: '连续包月', price: '9', original: '¥12/月' },
  { key: 'year', name: '连续包年', price: '88', original: '¥144/月', tag: '超值推荐' },
  { key: 'lifetime', name: '永久会员', price: '298', original: '¥988/月' },
]

function getPayLabel(selectedPlan: string) {
  const plan = MEMBER_PLANS.find((item) => item.key === selectedPlan) || MEMBER_PLANS[0]
  return `立即开通 ¥${plan.price}`
}

Page({
  data: {
    statusBarHeight: 20,
    selectedPlan: 'year',
    payLabel: getPayLabel('year'),
    plans: MEMBER_PLANS,
  },
  onLoad() {
    this.setData({ statusBarHeight: getWindowInfo().statusBarHeight || 20 })
  },
  goBack() {
    wx.navigateBack()
  },
  selectPlan(e: WechatMiniprogram.BaseEvent) {
    const { plan } = e.currentTarget.dataset as { plan?: string }
    if (plan) {
      this.setData({ selectedPlan: plan, payLabel: getPayLabel(plan) })
    }
  },
  pay() {
    const plan = MEMBER_PLANS.find((item) => item.key === this.data.selectedPlan) || MEMBER_PLANS[0]
    wx.showModal({
      title: '会员支付即将上线',
      content: `你选择了「${plan.name}」。微信支付开通后将在此完成购买，当前可先免费使用全部记账功能。`,
      showCancel: false,
      confirmText: '知道了',
    })
  },
})
