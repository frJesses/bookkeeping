/// <reference path="./types/index.d.ts" />
interface IAppOption {
  globalData: {
    customTabBarHeight: number
    openId: string
    unionId: string
  }
  checkUpdate: () => void
}
