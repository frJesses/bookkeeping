export type ProfileSummaryItem = {
  label: string
  value: string
}
export type ProfileMenuItem = {
  icon: string
  label: string
  action: 'recommend' | 'about'
}
export const PROFILE_SUMMARY_ITEMS: ProfileSummaryItem[] = [
  { label: '已连续打卡', value: '0' },
  { label: '总记账天数', value: '0' },
  { label: '总记账笔数', value: '0' },
]
export const PROFILE_SERVICE_ITEMS: ProfileMenuItem[] = [
  { icon: 'friends-o', label: '推荐钱小迹给好友', action: 'recommend' },
  { icon: 'info-o', label: '关于钱小迹', action: 'about' },
]
