export type ProfileSummaryItem = {
  label: string
  value: string
}

export type ProfileMenuItem = {
  icon: string
  label: string
  desc?: string
  tone: 'blue' | 'pink' | 'gold' | 'green'
}

export const PROFILE_SUMMARY_ITEMS: ProfileSummaryItem[] = [
  { label: '本月记录', value: '' },
  { label: '预算进度', value: '' },
  { label: '常用分类', value: '' },
]

export const PROFILE_QUICK_ACTIONS: ProfileMenuItem[] = [
  { icon: '¥', label: '预算', tone: 'blue' },
  { icon: '#', label: '分类', tone: 'pink' },
  { icon: '⇪', label: '导出', tone: 'gold' },
  { icon: '◎', label: '提醒', tone: 'green' },
]

export const PROFILE_SERVICE_ITEMS: ProfileMenuItem[] = [
  { icon: '⌘', label: '账本与分类', desc: '管理账本、分类和预算设置', tone: 'blue' },
  { icon: '↗', label: '导出与备份', desc: '导出账单并保存数据副本', tone: 'pink' },
  { icon: '◍', label: '数据同步', desc: '查看同步状态与最近更新时间', tone: 'green' },
]

export const PROFILE_SUPPORT_ITEMS: ProfileMenuItem[] = [
  { icon: '◇', label: '个性化设置', desc: '主题、展示方式与提醒偏好', tone: 'gold' },
  { icon: '◌', label: '关于与帮助', desc: '使用说明、问题反馈与版本信息', tone: 'blue' },
]
