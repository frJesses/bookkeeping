/// <reference path="./types/index.d.ts" />
interface IAppOption {
  globalData: {
    userInfo?: WechatMiniprogram.UserInfo,
    customTabBarHeight?: number,
    openId?: string,
    unionId?: string,
  }
  userInfoReadyCallback?: WechatMiniprogram.GetUserInfoSuccessCallback,
}
