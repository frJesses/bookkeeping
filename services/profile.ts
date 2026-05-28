import {
  PROFILE_QUICK_ACTIONS,
  PROFILE_SERVICE_ITEMS,
  PROFILE_SUMMARY_ITEMS,
  PROFILE_SUPPORT_ITEMS,
} from '../constants/profile'

export function getProfilePageData() {
  return {
    nickname: '',
    desc: '',
    syncText: '',
    streakText: '',
    summaryItems: PROFILE_SUMMARY_ITEMS,
    quickActions: PROFILE_QUICK_ACTIONS,
    serviceItems: PROFILE_SERVICE_ITEMS,
    supportItems: PROFILE_SUPPORT_ITEMS,
  }
}

export async function fetchProfilePageData() {
  return getProfilePageData()
}
