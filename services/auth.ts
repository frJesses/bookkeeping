import { post } from './request'

const OPEN_ID_STORAGE_KEY = 'bookkeeping_open_id'
const UNION_ID_STORAGE_KEY = 'bookkeeping_union_id'

type OpenIdResponse = {
  openId: string
  unionId?: string | null
}

let pendingOpenIdPromise: Promise<string> | null = null

function updateAuthState(data: OpenIdResponse) {
  if (data.openId) {
    wx.setStorageSync(OPEN_ID_STORAGE_KEY, data.openId)
  }
  if (data.unionId) {
    wx.setStorageSync(UNION_ID_STORAGE_KEY, data.unionId)
  }

  const app = getApp<IAppOption>()
  app.globalData.openId = data.openId || ''
  app.globalData.unionId = data.unionId || ''
}

export function getStoredOpenId() {
  const app = getApp<IAppOption>()
  if (app.globalData.openId) {
    return app.globalData.openId
  }
  const openId = wx.getStorageSync(OPEN_ID_STORAGE_KEY)
  return typeof openId === 'string' ? openId : ''
}

async function loginForOpenId() {
  const loginResult = await new Promise<WechatMiniprogram.LoginSuccessCallbackResult>((resolve, reject) => {
    wx.login({ success: resolve, fail: reject })
  })
  if (!loginResult.code) {
    throw new Error('获取微信登录凭证失败')
  }

  const data = await post<OpenIdResponse>('/frontend/bookkeeping/auth/openid', {
    code: loginResult.code,
  })
  if (!data.openId) {
    throw new Error('获取 openId 失败')
  }
  updateAuthState(data)
  return data.openId
}

export function ensureOpenId() {
  const storedOpenId = getStoredOpenId()
  if (storedOpenId) {
    return Promise.resolve(storedOpenId)
  }
  if (!pendingOpenIdPromise) {
    pendingOpenIdPromise = loginForOpenId().finally(() => {
      pendingOpenIdPromise = null
    })
  }
  return pendingOpenIdPromise
}
