import { post } from './request'
const OPEN_ID_STORAGE_KEY = 'bookkeeping_open_id'
const UNION_ID_STORAGE_KEY = 'bookkeeping_union_id'
let pendingOpenIdPromise: Promise<string> | null = null
type OpenIdResponse = {
  openId: string
  unionId?: string
}
function setAuthStorage(data: OpenIdResponse) {
  if (data.openId) {
    wx.setStorageSync(OPEN_ID_STORAGE_KEY, data.openId)
  }
  if (data.unionId) {
    wx.setStorageSync(UNION_ID_STORAGE_KEY, data.unionId)
  }
  const app = getApp<IAppOption>()
  if (app && app.globalData) {
    app.globalData.openId = data.openId || ''
    app.globalData.unionId = data.unionId || ''
  }
}
export function getStoredOpenId() {
  const app = getApp<IAppOption>()
  if (app && app.globalData && app.globalData.openId) {
    return app.globalData.openId
  }
  const openId = wx.getStorageSync(OPEN_ID_STORAGE_KEY)
  return typeof openId === 'string' ? openId : ''
}
export async function fetchOpenIdByCode(code: string) {
  const data = await post<OpenIdResponse, { code: string }>(
    '/frontend/bookkeeping/auth/openid',
    { code },
    { skipToken: true },
  )
  setAuthStorage(data)
  return data
}
export async function loginForOpenId() {
  const loginRes = await new Promise<WechatMiniprogram.LoginSuccessCallbackResult>((resolve, reject) => {
    wx.login({
      success: resolve,
      fail: reject,
    })
  })
  const code = loginRes.code || ''
  if (!code) {
    throw new Error('获取微信登录凭证失败')
  }
  return fetchOpenIdByCode(code)
}
export async function ensureOpenId() {
  const storedOpenId = getStoredOpenId()
  if (storedOpenId) {
    return storedOpenId
  }
  if (!pendingOpenIdPromise) {
    pendingOpenIdPromise = loginForOpenId()
      .then((data) => {
        if (!data.openId) {
          throw new Error('获取 openId 失败')
        }
        return data.openId
      })
      .finally(() => {
        pendingOpenIdPromise = null
      })
  }
  return pendingOpenIdPromise
}
