export const APP_NAME = '钱小迹'
export const APP_VERSION = '1.0.2'
export const APP_TAGLINE = '把每一笔日常，都记成清楚的小轨迹'

export type AboutHighlightItem = {
  iconText: string
  title: string
  description: string
  tone: 'blue' | 'gold' | 'green'
}

export const ABOUT_HIGHLIGHTS: AboutHighlightItem[] = [
  {
    iconText: '记',
    title: '轻量记账',
    description: '快速记下一笔收支，把复杂输入压缩成顺手的一次点击。',
    tone: 'blue',
  },
  {
    iconText: '统',
    title: '收支洞察',
    description: '用月度、年度视角看清消费去向，也看见生活的变化轨迹。',
    tone: 'gold',
  },
  {
    iconText: '算',
    title: '预算陪伴',
    description: '在记录之外，帮你同步关注预算进度和日常节奏。',
    tone: 'green',
  },
]
