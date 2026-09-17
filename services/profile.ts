import { ensureOpenId } from './auth'
import { getApiBaseURL } from '../config/index'
import { get, put } from './request'
type ProfileUserInfoDTO = {
  id: string
  account: string
  email: string
  openId: string
  userName: string
  avatar: string | null
  birthday: string | null
  gender: string | null
  status: string
  createdAt: string
  updatedAt: string
  consecutiveCheckInDays?: number | string | null
  totalBookkeepingDays?: number | string | null
  totalBookkeepingCount?: number | string | null
}

export type UserProfileUpdate = {
  userName?: string
  avatar?: string
  gender?: string
}

function normalizeCount(value: number | string | null | undefined) {
  const count = Number(value || 0)
  return Number.isFinite(count) && count > 0 ? Math.floor(count) : 0
}

export function getProfilePageData() {
  return {
    nickname: '我的',
    avatarUrl: '',
    avatarText: '我',
    summaryItems: [
      { label: '已连续打卡', value: '0' },
      { label: '总记账天数', value: '0' },
      { label: '总记账笔数', value: '0' },
    ],
  }
}
function getAvatarText(name: string) {
  const trimmedName = name.trim()
  if (!trimmedName) {
    return ''
  }
  return trimmedName.slice(0, 2).toUpperCase()
}

function mapProfileSummaryItems(data: ProfileUserInfoDTO | null) {
  const consecutiveCheckInDays = normalizeCount(data ? data.consecutiveCheckInDays : null)
  const totalBookkeepingDays = normalizeCount(data ? data.totalBookkeepingDays : null)
  const totalBookkeepingCount = normalizeCount(data ? data.totalBookkeepingCount : null)
  return [
    { label: '已连续打卡', value: String(consecutiveCheckInDays) },
    { label: '总记账天数', value: String(totalBookkeepingDays) },
    { label: '总记账笔数', value: String(totalBookkeepingCount) },
  ]
}

function mapProfileUserInfo(data: ProfileUserInfoDTO | null) {
  if (!data) {
    return {
      nickname: '我的',
      avatarUrl: '',
      avatarText: '我',
      summaryItems: mapProfileSummaryItems(null),
    }
  }
  const nickname = data.userName || data.account || '未命名用户'
  const avatarUrl = data.avatar || ''
  return {
    nickname,
    avatarUrl,
    avatarText: getAvatarText(nickname),
    summaryItems: mapProfileSummaryItems(data),
  }
}

export async function fetchCurrentUserInfo() {
  const openId = await ensureOpenId()
  return get<ProfileUserInfoDTO | null>('/frontend/bookkeeping/auth/user-info', { openId }, { skipToken: true })
}

export async function updateCurrentUserInfo(update: UserProfileUpdate) {
  const openId = await ensureOpenId()
  return put<ProfileUserInfoDTO | null>(
    '/frontend/bookkeeping/auth/user-info',
    { openId, ...update },
    { skipToken: true },
  )
}

export async function uploadCurrentUserAvatar(filePath: string) {
  const openId = await ensureOpenId()
  return new Promise<string>((resolve, reject) => {
    wx.uploadFile({
      url: `${getApiBaseURL()}/frontend/bookkeeping/auth/avatar-upload`,
      filePath,
      name: 'file',
      formData: { openId },
      success(response) {
        try {
          if (response.statusCode < 200 || response.statusCode >= 300) {
            throw new Error(`HTTP ${response.statusCode}`)
          }
          const result = JSON.parse(response.data) as {
            code?: number
            message?: string
            msg?: string
            data?: { url?: string }
          }
          if (typeof result.code === 'number' && result.code !== 0 && result.code !== 200) {
            throw new Error(result.message || result.msg || '头像上传失败')
          }
          const url = result.data && result.data.url
          if (!url) throw new Error('头像上传地址为空')
          resolve(url)
        } catch (error) {
          reject(error)
        }
      },
      fail: reject,
    })
  })
}

export async function fetchProfilePageData() {
  const pageData = getProfilePageData()
  try {
    const userInfo = await fetchCurrentUserInfo()
    return {
      ...pageData,
      ...mapProfileUserInfo(userInfo),
    }
  } catch (error) {
    console.error('get profile user info failed', error)
    return pageData
  }
}
