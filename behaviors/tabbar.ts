import { getCustomTabBarHeight, syncCustomTabBar, TAB_BAR_CONTENT_GAP } from '../utils/tabbar'
type TabBarPagePath = '/pages/index/index' | '/pages/profile/profile'
type TabBarPageInstance = Parameters<typeof syncCustomTabBar>[0] & {
  setData: WechatMiniprogram.Page.Instance<WechatMiniprogram.IAnyObject, WechatMiniprogram.IAnyObject>['setData']
}
export type TabBarBehaviorMethods = {
  initTabBarLayout(): void
  syncTabBarState(): void
}
export type TabBarBehaviorPageInstance = WechatMiniprogram.Page.Instance<
  WechatMiniprogram.IAnyObject,
  WechatMiniprogram.IAnyObject
> &
  TabBarBehaviorMethods
export function createTabBarBehavior(selectedPath: TabBarPagePath) {
  return Behavior({
    data: {
      tabBarSpacer: 0,
      tabBarGap: TAB_BAR_CONTENT_GAP,
    },
    methods: {
      initTabBarLayout() {
        const page = this as unknown as TabBarPageInstance
        page.setData({
          tabBarSpacer: getCustomTabBarHeight(),
        })
      },
      syncTabBarState() {
        syncCustomTabBar(this as unknown as TabBarPageInstance, selectedPath)
      },
    },
  })
}
