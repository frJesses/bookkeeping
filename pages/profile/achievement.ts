import {
  createAchievementPageData,
  getAchievementPageData,
} from "../../services/achievement";

type AchievementPageInstance = WechatMiniprogram.Page.Instance<
  WechatMiniprogram.IAnyObject,
  WechatMiniprogram.IAnyObject
> & {
  data: ReturnType<typeof createAchievementPageData> & {
    statusBarHeight: number;
    isLoading: boolean;
    errorMessage: string;
  };
};

Page({
  data: {
    ...createAchievementPageData(),
    statusBarHeight: 20,
    isLoading: false,
    errorMessage: "",
  },
  onLoad(this: AchievementPageInstance) {
    this.setData({
      statusBarHeight: wx.getSystemInfoSync().statusBarHeight || 20,
    });
    void this.loadPageData();
  },
  onShow(this: AchievementPageInstance) {
    if (
      this.data.earned.length ||
      this.data.locked.length ||
      this.data.errorMessage
    ) {
      void this.loadPageData();
    }
  },
  async loadPageData(this: AchievementPageInstance) {
    this.setData({ isLoading: true, errorMessage: "" });
    try {
      const data = await getAchievementPageData();
      this.setData({ ...data, isLoading: false });
    } catch (error) {
      console.error("load achievement page failed", error);
      this.setData({
        isLoading: false,
        errorMessage: "成就加载失败，请稍后重试",
      });
    }
  },
  handleRetry(this: AchievementPageInstance) {
    void this.loadPageData();
  },
  goBack() {
    if (getCurrentPages().length > 1) {
      wx.navigateBack();
      return;
    }
    wx.switchTab({ url: "/pages/profile/profile" });
  },
});
