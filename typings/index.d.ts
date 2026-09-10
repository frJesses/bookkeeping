/// <reference path="./types/index.d.ts" />
interface IAppOption {
  globalData: {
    openId: string
    unionId: string
  }
  checkUpdate: () => void
}
