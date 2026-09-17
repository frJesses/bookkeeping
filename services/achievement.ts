import { get } from './request'
import { ensureOpenId } from './auth'

export type AchievementItem = {
  code: string
  name: string
  description: string
  iconKey: string
  ruleType: string
  currentValue: number
  targetValue: number
  progressPercent: number
  isUnlocked: boolean
  unlockedAt: string | null
}

export type AchievementCard = {
  code: string
  name: string
  description: string
  progressText: string
  lockedNote: string
  dateText: string
  image: string
  imageClass: string
  isUnlocked: boolean
}

export type AchievementPageData = {
  joinedAtText: string
  totalCount: number
  earnedCount: number
  earned: AchievementCard[]
  locked: AchievementCard[]
}

type AchievementResponse = {
  joinedAt: string | null
  totalCount: number
  earnedCount: number
  achievements: AchievementItem[]
}

const ICON_ASSETS: Record<string, string> = {
  'record-300': '/assets/figma/achievements/record-300.png',
  lifetime: '/assets/figma/achievements/lifetime.png',
  'streak-100': '/assets/figma/achievements/streak-100.png',
  persist: '/assets/figma/achievements/persist.png',
  steady: '/assets/figma/achievements/steady.png',
  monthly: '/assets/figma/achievements/monthly-active.png',
  invite: '/assets/figma/achievements/invite.png',

  // Legacy keys remain mapped so an older seed does not render a blank card
  // while the achievement definition migration is being applied.
  'first-record': '/assets/figma/achievements/steady.png',
  'records-10': '/assets/figma/achievements/persist.png',
  'streak-7': '/assets/figma/achievements/monthly.png',
  'days-30': '/assets/figma/achievements/steady.png',
  'records-100': '/assets/figma/achievements/streak-100.png',
  'streak-30': '/assets/figma/achievements/persist.png',
  'days-180': '/assets/figma/achievements/steady.png',
  'categories-10': '/assets/figma/achievements/invite.png',
  'income-3': '/assets/figma/achievements/lifetime.png',
}

const LOCKED_ICON_ASSETS: Record<string, string> = {
  monthly: '/assets/figma/achievements/monthly.png',
  invite: '/assets/figma/achievements/invite.png',
}

function formatJoinedAt(value: string | null) {
  if (!value) return ''
  const matched = value.match(/^(\d{4})-(\d{2})-(\d{2})/)
  return matched ? `${matched[1]}年${Number(matched[2])}月${Number(matched[3])}日` : value
}

function formatUnlockedAt(value: string | null) {
  if (!value) return ''
  const matched = value.match(/^(\d{4})-(\d{2})-(\d{2})/)
  return matched ? `${matched[1]}.${matched[2]}.${matched[3]}获得` : `${value}获得`
}

function mapAchievement(item: AchievementItem): AchievementCard {
  const image =
    (!item.isUnlocked && LOCKED_ICON_ASSETS[item.iconKey]) || ICON_ASSETS[item.iconKey] || ICON_ASSETS['first-record']
  const progressText =
    item.ruleType === 'manual' ? '' : `${Math.min(item.currentValue, item.targetValue)}/${item.targetValue}`
  return {
    code: item.code,
    name: item.name,
    description: item.description,
    progressText,
    lockedNote: item.ruleType === 'manual' ? item.description : `${progressText} · ${item.description}`,
    dateText: item.isUnlocked ? formatUnlockedAt(item.unlockedAt) : `${item.progressPercent}% 完成`,
    image,
    imageClass: '',
    isUnlocked: item.isUnlocked,
  }
}

export function createAchievementPageData(): AchievementPageData {
  return {
    joinedAtText: '',
    totalCount: 0,
    earnedCount: 0,
    earned: [],
    locked: [],
  }
}

export async function getAchievementPageData(): Promise<AchievementPageData> {
  const openId = await ensureOpenId()
  const data = await get<AchievementResponse>(
    '/frontend/bookkeeping/achievement/list',
    {
      openId,
    },
    { skipToken: true },
  )
  const achievements = Array.isArray(data.achievements) ? data.achievements : []
  const cards = achievements.map(mapAchievement)
  return {
    joinedAtText: formatJoinedAt(data.joinedAt),
    totalCount: Number(data.totalCount || cards.length),
    earnedCount: Number(data.earnedCount || cards.filter((item) => item.isUnlocked).length),
    earned: cards.filter((item) => item.isUnlocked),
    locked: cards.filter((item) => !item.isUnlocked),
  }
}
