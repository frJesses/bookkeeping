import {
  PROFILE_SERVICE_ITEMS,
} from '../constants/profile'
import { ensureOpenId } from './auth'
import { get } from './request'
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
  consecutiveCheckInDays: number
  totalBookkeepingDays: number
  totalBookkeepingCount: number
}
export function getProfilePageData() {
  return {
    nickname: '我的',
    avatarUrl: '',
    avatarText: '我',
    summaryItems: mapProfileSummaryItems(null),
    serviceItems: PROFILE_SERVICE_ITEMS,
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
  return [
    { label: '已连续打卡', value: String(data?.consecutiveCheckInDays ?? 0) },
    { label: '总记账天数', value: String(data?.totalBookkeepingDays ?? 0) },
    { label: '总记账笔数', value: String(data?.totalBookkeepingCount ?? 0) },
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
  return {
    nickname,
    avatarUrl: data.avatar || '',
    avatarText: getAvatarText(nickname),
    summaryItems: mapProfileSummaryItems(data),
  }
}
export async function fetchProfilePageData() {
  const pageData = getProfilePageData()
  try {
    const openId = await ensureOpenId()
    const userInfo = await get<ProfileUserInfoDTO | null>('/frontend/bookkeeping/auth/user-info', {
      openId,
    }, {
      skipToken: true,
    })
    return {
      ...pageData,
      ...mapProfileUserInfo(userInfo),
    }
  } catch (error) {
    console.error('get profile user info failed', error)
    return pageData
  }
}
