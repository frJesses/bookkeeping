export type WindowInfo = {
  windowWidth: number
  windowHeight: number
  statusBarHeight: number
  screenHeight: number
  safeArea?: {
    top?: number
    bottom: number
  }
}

type WxSystemApi = typeof wx & {
  getWindowInfo?: () => WindowInfo
}

export function getWindowInfo(): WindowInfo {
  const api = wx as WxSystemApi
  if (typeof api.getWindowInfo === 'function') {
    return api.getWindowInfo()
  }
  return {
    windowWidth: 375,
    windowHeight: 667,
    statusBarHeight: 20,
    screenHeight: 667,
  }
}
