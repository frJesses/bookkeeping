import { get, post } from './request'
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
  effectSeen: boolean
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
  effectSeen: boolean
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

export async function markAchievementEffectsSeen(codes: string[]) {
  const openId = await ensureOpenId()
  await post<null>('/frontend/bookkeeping/achievement/effect-seen', { openId, codes }, { skipToken: true })
}

function resolveAchievementImage(iconKey: string) {
  const value = String(iconKey || '').trim()
  return /^https?:\/\//i.test(value) ? value : ''
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
  const image = resolveAchievementImage(item.iconKey)
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
    effectSeen: Boolean(item.effectSeen),
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
