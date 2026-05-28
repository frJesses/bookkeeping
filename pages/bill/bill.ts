import { createTabBarBehavior, type TabBarBehaviorPageInstance } from '../../behaviors/tabbar'
import { createBillPageState, getBillPageData } from '../../services/bill'

Page({
  behaviors: [createTabBarBehavior('/pages/bill/bill')],
  data: createBillPageState(),
  onLoad(this: TabBarBehaviorPageInstance) {
    this.initTabBarLayout()
    void this.loadPageData()
  },
  onShow(this: TabBarBehaviorPageInstance) {
    this.syncTabBarState()
    void this.loadPageData()
  },
  async loadPageData() {
    try {
      const data = await getBillPageData()
      this.setData(data)
    } catch (error) {
      console.error('load bill page failed', error)
    }
  },
  toggleAmountVisible() {
    this.setData({
      amountVisible: !this.data.amountVisible,
    })
  },
})
