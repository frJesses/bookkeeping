type AdaptiveViewportInstance = WechatMiniprogram.Component.TrivialInstance & {
  updateMetrics: () => void
  handleWindowResize: (result: WechatMiniprogram.OnWindowResizeCallbackResult) => void
}

type ViewportInfo = {
  screenHeight: number
  windowHeight: number
  statusBarHeight: number
  safeArea?: {
    top?: number
    bottom: number
  }
}

type AdaptiveViewportData = {
  statusBarHeight: number
  bottomSafeAreaHeight: number
  navigationBarHeight: number
  viewportHeight: number
  topInset: number
  bottomInset: number
  resolvedHeaderHeight: number
  contentHeight: number
}

function getWindowInfo(): ViewportInfo {
  return getSystemWindowInfo()
}

function getBottomSafeAreaHeight(windowInfo: ViewportInfo) {
  if (windowInfo.safeArea) {
    return Math.max(0, windowInfo.screenHeight - windowInfo.safeArea.bottom)
  }
  const occupiedHeight = windowInfo.statusBarHeight + windowInfo.windowHeight
  return Math.max(0, windowInfo.screenHeight - occupiedHeight)
}

function getNavigationBarHeight(windowInfo: ViewportInfo) {
  try {
    const menuButton = wx.getMenuButtonBoundingClientRect()
    const statusBarHeight = windowInfo.statusBarHeight || 0
    return Math.max(0, (menuButton.top - statusBarHeight) * 2 + menuButton.height)
  } catch (error) {
    console.warn('get custom header height failed', error)
    return 44
  }
}

Component({
  options: {
    multipleSlots: true,
  },
  properties: {
    customHeader: {
      type: Boolean,
      value: false,
    },
    includeStatusBar: {
      type: Boolean,
      value: true,
    },
    includeBottomSafeArea: {
      type: Boolean,
      value: true,
    },
    headerHeight: {
      type: Number,
      value: 0,
    },
    background: {
      type: String,
      value: 'transparent',
    },
  },
  data: {
    statusBarHeight: 0,
    bottomSafeAreaHeight: 0,
    navigationBarHeight: 44,
    viewportHeight: 0,
    topInset: 0,
    bottomInset: 0,
    resolvedHeaderHeight: 0,
    contentHeight: 0,
  },
  observers: {
    'customHeader, includeStatusBar, includeBottomSafeArea, headerHeight'(this: AdaptiveViewportInstance) {
      this.updateMetrics()
    },
  },
  methods: {
    updateMetrics(this: AdaptiveViewportInstance) {
      const windowInfo = getWindowInfo()
      const statusBarHeight = windowInfo.statusBarHeight || 0
      const bottomSafeAreaHeight = getBottomSafeAreaHeight(windowInfo)
      const navigationBarHeight = getNavigationBarHeight(windowInfo)
      const topInset = this.data.includeStatusBar ? statusBarHeight : 0
      const bottomInset = this.data.includeBottomSafeArea ? bottomSafeAreaHeight : 0
      const resolvedHeaderHeight = this.data.customHeader ? this.data.headerHeight || navigationBarHeight : 0
      const viewportHeight = windowInfo.windowHeight || windowInfo.screenHeight
      const contentHeight = Math.max(0, viewportHeight - topInset - bottomInset - resolvedHeaderHeight)

      this.setData({
        statusBarHeight,
        bottomSafeAreaHeight,
        navigationBarHeight,
        viewportHeight,
        topInset,
        bottomInset,
        resolvedHeaderHeight,
        contentHeight,
      })
      this.triggerEvent('metrics', {
        statusBarHeight,
        bottomSafeAreaHeight,
        navigationBarHeight,
        viewportHeight,
        topInset,
        bottomInset,
        headerHeight: resolvedHeaderHeight,
        contentHeight,
      })
    },
    handleWindowResize(this: AdaptiveViewportInstance) {
      this.updateMetrics()
    },
  },
  lifetimes: {
    attached(this: AdaptiveViewportInstance) {
      this.updateMetrics()
      wx.onWindowResize(this.handleWindowResize)
    },
    detached(this: AdaptiveViewportInstance) {
      wx.offWindowResize(this.handleWindowResize)
    },
  },
})
import { getWindowInfo as getSystemWindowInfo } from '../../utils/system-info'
