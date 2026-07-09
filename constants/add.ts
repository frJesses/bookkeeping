export type RecordType = 'expense' | 'income'
export type CategoryItem = {
  id: string | number
  name: string
  icon: string
  accent: string
  surface: string
  shadow: string
  activeSurface: string
  activeShadow: string
}
export type KeypadAction = 'digit' | 'operator' | 'backspace' | 'date' | 'done'
export type KeypadKey = {
  id: string
  label: string
  action: KeypadAction
  value?: string
  primary?: boolean
}
export const DEFAULT_RECORD_TYPE: RecordType = 'expense'
export const DEFAULT_CATEGORY_NAME = ''
export const ADD_RECORD_TABS: Array<{ type: RecordType; label: string }> = [
  {
    type: 'expense',
    label: '支出',
  },
  {
    type: 'income',
    label: '收入',
  },
]
const PALETTES = [
  {
    accent: '#ff7b95',
    surface: 'linear-gradient(180deg, #fff6f8 0%, #ffe8ef 100%)',
    shadow: '0 12rpx 24rpx rgba(255, 123, 149, 0.12)',
    activeSurface: 'linear-gradient(180deg, #ff9ab1 0%, #ff6d8d 100%)',
    activeShadow: '0 18rpx 32rpx rgba(255, 109, 141, 0.24)',
  },
  {
    accent: '#5c8fff',
    surface: 'linear-gradient(180deg, #f5f8ff 0%, #e8efff 100%)',
    shadow: '0 12rpx 24rpx rgba(92, 143, 255, 0.12)',
    activeSurface: 'linear-gradient(180deg, #78a6ff 0%, #4f7cff 100%)',
    activeShadow: '0 18rpx 32rpx rgba(79, 124, 255, 0.24)',
  },
  {
    accent: '#50b985',
    surface: 'linear-gradient(180deg, #f2fff8 0%, #e1f8ea 100%)',
    shadow: '0 12rpx 24rpx rgba(80, 185, 133, 0.12)',
    activeSurface: 'linear-gradient(180deg, #70d39f 0%, #3eb27a 100%)',
    activeShadow: '0 18rpx 32rpx rgba(62, 178, 122, 0.24)',
  },
  {
    accent: '#ffb54f',
    surface: 'linear-gradient(180deg, #fffaf0 0%, #ffefcf 100%)',
    shadow: '0 12rpx 24rpx rgba(255, 181, 79, 0.12)',
    activeSurface: 'linear-gradient(180deg, #ffd26f 0%, #ffb32f 100%)',
    activeShadow: '0 18rpx 32rpx rgba(255, 179, 47, 0.24)',
  },
  {
    accent: '#9d78ff',
    surface: 'linear-gradient(180deg, #faf7ff 0%, #efe6ff 100%)',
    shadow: '0 12rpx 24rpx rgba(157, 120, 255, 0.12)',
    activeSurface: 'linear-gradient(180deg, #b292ff 0%, #8b61ff 100%)',
    activeShadow: '0 18rpx 32rpx rgba(139, 97, 255, 0.24)',
  },
]
function createCategoryItems(names: Array<{ id: number; name: string; icon: string }>): CategoryItem[] {
  return names.map((item, index) => {
    const palette = PALETTES[index % PALETTES.length]
    return {
      ...item,
      ...palette,
    }
  })
}
export const ADD_CATEGORY_MAP: Record<RecordType, CategoryItem[]> = {
  expense: createCategoryItems([
    { id: 1, name: '餐饮', icon: '餐' },
    { id: 2, name: '交通', icon: '行' },
    { id: 3, name: '购物', icon: '购' },
    { id: 4, name: '娱乐', icon: '乐' },
    { id: 5, name: '日用', icon: '用' },
    { id: 6, name: '住房', icon: '住' },
    { id: 7, name: '医疗', icon: '医' },
    { id: 8, name: '学习', icon: '学' },
    { id: 9, name: '旅行', icon: '游' },
    { id: 10, name: '其他', icon: '其' },
  ]),
  income: createCategoryItems([
    { id: 101, name: '工资', icon: '薪' },
    { id: 102, name: '奖金', icon: '奖' },
    { id: 103, name: '兼职', icon: '兼' },
    { id: 104, name: '理财', icon: '利' },
    { id: 105, name: '报销', icon: '报' },
    { id: 106, name: '收款', icon: '收' },
    { id: 107, name: '红包', icon: '礼' },
    { id: 108, name: '退款', icon: '退' },
    { id: 109, name: '转入', icon: '入' },
    { id: 110, name: '其他', icon: '其' },
  ]),
}
export const ADD_KEYPAD_ROWS: KeypadKey[][] = [
  [
    { id: '7', label: '7', action: 'digit', value: '7' },
    { id: '8', label: '8', action: 'digit', value: '8' },
    { id: '9', label: '9', action: 'digit', value: '9' },
    { id: 'today', label: '今天', action: 'date' },
  ],
  [
    { id: '4', label: '4', action: 'digit', value: '4' },
    { id: '5', label: '5', action: 'digit', value: '5' },
    { id: '6', label: '6', action: 'digit', value: '6' },
    { id: 'plus', label: '+', action: 'operator', value: '+' },
  ],
  [
    { id: '1', label: '1', action: 'digit', value: '1' },
    { id: '2', label: '2', action: 'digit', value: '2' },
    { id: '3', label: '3', action: 'digit', value: '3' },
    { id: 'minus', label: '-', action: 'operator', value: '-' },
  ],
  [
    { id: 'dot', label: '.', action: 'digit', value: '.' },
    { id: '0', label: '0', action: 'digit', value: '0' },
    { id: 'backspace', label: '⌫', action: 'backspace' },
    { id: 'done', label: '完成', action: 'done', primary: true },
  ],
]
