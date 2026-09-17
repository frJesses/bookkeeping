import {
  ADD_KEYPAD_ROWS,
  DEFAULT_CATEGORY_NAME,
  DEFAULT_RECORD_TYPE,
  SETTINGS_CATEGORY_NAME,
  type CategoryItem,
  type KeypadAction,
  type KeypadKey,
  type RecordType,
} from '../constants/add'
import { get, post, put } from './request'
import { ensureOpenId } from './auth'
import { TransactionDetailRecord } from './transaction-detail'
import { CATEGORY_ICON_ASSETS, getCategoryIconAsset } from '../constants/design'
export type AddCategoryItem = CategoryItem
type FrontendCategoryDTO = {
  id: string | number
  type: string
  name: string
  icon: string | null
  iconText: string | null
  iconColor: string | null
  sortOrder: number
  isDefault: boolean
  isEnabled: boolean
  createdAt: string
  updatedAt: string
}
export type AddPageState = {
  pageMode: 'create' | 'edit'
  editingRecordId: string
  originalOccurredAt: string
  activeType: RecordType
  activeCategory: string
  activeCategoryIcon: string
  amount: string
  amountDisplay: string
  submitLabel: string
  remark: string
  selectedDate: string
  dateLabel: string
  isRelativeDateLabel: boolean
  maxDate: string
  categories: AddCategoryItem[]
  keyboardRows: KeypadKey[][]
}
function normalizeRecordType(type?: string): RecordType {
  return type === 'income' ? 'income' : DEFAULT_RECORD_TYPE
}
function createTodayValue() {
  const now = new Date()
  const year = now.getFullYear()
  const month = `${now.getMonth() + 1}`.padStart(2, '0')
  const day = `${now.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}
function createCurrentDateTimeValue() {
  const now = new Date()
  const year = now.getFullYear()
  const month = `${now.getMonth() + 1}`.padStart(2, '0')
  const day = `${now.getDate()}`.padStart(2, '0')
  const hour = `${now.getHours()}`.padStart(2, '0')
  const minute = `${now.getMinutes()}`.padStart(2, '0')
  const second = `${now.getSeconds()}`.padStart(2, '0')
  return `${year}-${month}-${day} ${hour}:${minute}:${second}`
}
function createCurrentTimeValue() {
  const now = new Date()
  const hour = `${now.getHours()}`.padStart(2, '0')
  const minute = `${now.getMinutes()}`.padStart(2, '0')
  const second = `${now.getSeconds()}`.padStart(2, '0')
  return `${hour}:${minute}:${second}`
}
function createRelativeDateValue(offsetDays: number) {
  const date = new Date()
  date.setDate(date.getDate() + offsetDays)
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}
export function getTodayDateValue() {
  return createTodayValue()
}
export function formatDateLabel(date: string) {
  if (!date) {
    return '今天'
  }
  const todayValue = createTodayValue()
  if (date === todayValue) {
    return '今天'
  }
  const yesterdayValue = createRelativeDateValue(-1)
  if (date === yesterdayValue) {
    return '昨天'
  }
  const [year = '', month = '', day = ''] = date.split('-')
  return `${year}/${month}/${day}`
}

const REMARK_MAX_LENGTH = 15

export function normalizeRemark(value: string) {
  return Array.from(value || '')
    .slice(0, REMARK_MAX_LENGTH)
    .join('')
}
export function isRelativeDateLabel(date: string) {
  if (!date) {
    return true
  }
  const todayValue = createTodayValue()
  if (date === todayValue) {
    return true
  }
  const yesterdayValue = createRelativeDateValue(-1)
  return date === yesterdayValue
}
function normalizeSelectedDate(value?: string) {
  const today = createTodayValue()
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value) || value > today) {
    return today
  }
  const [yearText, monthText, dayText] = value.split('-')
  const date = new Date(Number(yearText), Number(monthText) - 1, Number(dayText))
  if (
    date.getFullYear() !== Number(yearText) ||
    date.getMonth() !== Number(monthText) - 1 ||
    date.getDate() !== Number(dayText)
  ) {
    return today
  }
  return value
}
export function createAddPageState(type?: string, selectedDateValue?: string): AddPageState {
  const activeType = normalizeRecordType(type)
  const selectedDate = normalizeSelectedDate(selectedDateValue)
  return {
    pageMode: 'create',
    editingRecordId: '',
    originalOccurredAt: '',
    activeType,
    activeCategory: DEFAULT_CATEGORY_NAME,
    activeCategoryIcon: '',
    amount: '',
    amountDisplay: '0',
    submitLabel: '完成',
    remark: '',
    selectedDate,
    dateLabel: formatDateLabel(selectedDate),
    isRelativeDateLabel: true,
    maxDate: selectedDate,
    categories: [],
    keyboardRows: ADD_KEYPAD_ROWS,
  }
}
function parseOccurredDate(value: string) {
  if (!value) {
    return createTodayValue()
  }
  const matched = value.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (matched) {
    return `${matched[1]}-${matched[2]}-${matched[3]}`
  }
  let date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    date = new Date(value.replace(/-/g, '/'))
  }
  if (Number.isNaN(date.getTime())) {
    return createTodayValue()
  }
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}
export function applyEditingRecord(record: TransactionDetailRecord, categories: AddCategoryItem[]) {
  const selectedDate = parseOccurredDate(record.occurredAt)
  const matchedCategory =
    categories.find((item) => `${item.id}` === `${record.categoryId}`) ||
    categories.find((item) => item.name === record.title)
  return {
    pageMode: 'edit' as const,
    editingRecordId: `${record.id}`,
    originalOccurredAt: record.occurredAt || '',
    activeType: record.amountClass,
    activeCategory: matchedCategory ? matchedCategory.name : record.title,
    activeCategoryIcon: matchedCategory ? matchedCategory.icon : record.iconUrl,
    amount: record.amountValue,
    amountDisplay: record.amountValue,
    submitLabel: '完成',
    remark: record.remark || '',
    selectedDate,
    dateLabel: formatDateLabel(selectedDate),
    isRelativeDateLabel: isRelativeDateLabel(selectedDate),
  }
}
const CATEGORY_PALETTES = [
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
function mapCategoryOptions(items: FrontendCategoryDTO[]): AddCategoryItem[] {
  return items
    .filter((item) => item && typeof item.name === 'string' && item.name.trim())
    .map((item, index) => {
      const palette = CATEGORY_PALETTES[index % CATEGORY_PALETTES.length]
      const remoteIcon = typeof item.icon === 'string' ? item.icon.trim() : ''
      return {
        id: item.id,
        name: item.name.trim(),
        icon: /^(https?:\/\/|\/)/.test(remoteIcon)
          ? remoteIcon
          : getCategoryIconAsset(item.name, CATEGORY_ICON_ASSETS['日用']),
        ...palette,
      }
    })
}
export async function getCategoryOptions(type: RecordType): Promise<AddCategoryItem[]> {
  try {
    const categories = await get<FrontendCategoryDTO[]>(
      '/frontend/bookkeeping/category/list',
      {
        type,
        isEnabled: true,
      },
      {
        skipToken: true,
      },
    )
    if (Array.isArray(categories)) {
      const remoteCategories = mapCategoryOptions(categories)
      if (remoteCategories.length) {
        return remoteCategories
      }
    }
  } catch (error) {
    console.warn('load category options failed, use local design set', error)
  }

  const names =
    type === 'income'
      ? ['工资', '奖金', '兼职', '理财', '红包', SETTINGS_CATEGORY_NAME, '其他']
      : [
          '餐饮',
          '购物',
          '交通',
          '水电',
          '服装',
          '医疗',
          '美妆',
          '娱乐',
          '通讯',
          '汽车',
          '烟酒',
          '书籍',
          '宠物',
          '孩子',
          '居家',
          '旅行',
          '送礼',
          '家电',
          '零食',
          '数码',
          '住房',
          '日用',
          '维修',
          '运动',
          SETTINGS_CATEGORY_NAME,
        ]
  return names.map((name, index) => {
    return {
      id: `local-${type}-${index}`,
      name,
      icon: getCategoryIconAsset(name, CATEGORY_ICON_ASSETS['日用']),
      ...CATEGORY_PALETTES[index % CATEGORY_PALETTES.length],
    }
  })
}
export function getCategorySelection(name: string, categories: AddCategoryItem[]) {
  const activeCategory = categories.find((item) => item.name === name)
  if (!activeCategory) {
    return {
      activeCategory: DEFAULT_CATEGORY_NAME,
      activeCategoryIcon: '',
    }
  }
  return {
    activeCategory: activeCategory.name,
    activeCategoryIcon: activeCategory.icon,
  }
}
function getCurrentExpressionSegment(expression: string) {
  const segments = expression.split(/[+-]/)
  return segments[segments.length - 1] || ''
}
function appendDigitValue(expression: string, value: string) {
  const currentSegment = getCurrentExpressionSegment(expression)
  const digits = expression.replace(/[^\d]/g, '')
  if (digits.length >= 7) {
    return expression
  }
  if (value === '.') {
    if (currentSegment.includes('.')) {
      return expression
    }
    if (!expression || expression.endsWith('+') || expression.endsWith('-')) {
      return `${expression}0.`
    }
    return `${expression}.`
  }
  if (currentSegment === '0' && value === '0') {
    return expression
  }
  if (currentSegment === '0' && !currentSegment.includes('.')) {
    return `${expression.slice(0, -1)}${value}`
  }
  if (currentSegment.includes('.')) {
    const decimal = currentSegment.split('.')[1] || ''
    if (decimal.length >= 2) {
      return expression
    }
  }
  return `${expression}${value}`
}
function appendOperatorValue(expression: string, value: string) {
  if (!expression) {
    return expression
  }
  if (expression.endsWith('+') || expression.endsWith('-')) {
    return `${expression.slice(0, -1)}${value}`
  }
  return `${expression}${value}`
}
export function applyAmountAction(amount: string, action: KeypadAction, value = '') {
  let nextAmount = amount
  if (action === 'digit' && value) {
    nextAmount = appendDigitValue(amount, value)
  }
  if (action === 'operator' && value) {
    nextAmount = appendOperatorValue(amount, value)
  }
  if (action === 'backspace') {
    nextAmount = amount.slice(0, -1)
  }
  const canCalculate = /[+-]/.test(nextAmount) && evaluateAmount(nextAmount) > 0
  return {
    amount: nextAmount,
    amountDisplay: nextAmount || '0',
    submitLabel: canCalculate ? '计算' : '完成',
  }
}
export function formatAmountDisplay(value: number | string) {
  const normalized = typeof value === 'number' ? value : Number(value)
  if (Number.isNaN(normalized)) {
    return '0'
  }
  return normalized
    .toFixed(2)
    .replace(/\.00$/, '')
    .replace(/(\.\d)0$/, '$1')
}
export function resolveSubmitAction(amount: string) {
  const hasOperator = /[+-]/.test(amount)
  const amountValue = evaluateAmount(amount)
  if (!hasOperator || amountValue <= 0) {
    return {
      mode: 'submit' as const,
    }
  }
  return {
    mode: 'calculate' as const,
    amount: formatAmountDisplay(amountValue),
    rawAmount: amountValue.toFixed(2),
  }
}
export function evaluateAmount(amount: string) {
  if (!amount) {
    return 0
  }
  const normalized = amount.replace(/[^0-9.+-]/g, '').replace(/[+-]+$/, '')
  if (!normalized) {
    return 0
  }
  const tokens = normalized.split(/([+-])/).filter(Boolean)
  let total = 0
  let operator = '+'
  tokens.forEach((token) => {
    if (token === '+' || token === '-') {
      operator = token
      return
    }
    const value = Number(token)
    if (Number.isNaN(value)) {
      return
    }
    total += operator === '-' ? -value : value
  })
  return Number(total.toFixed(2))
}
function buildOccurredAtValue(input: {
  pageMode: AddPageState['pageMode']
  selectedDate: string
  originalOccurredAt: string
}) {
  const selectedDate =
    input.selectedDate || (input.pageMode === 'edit' ? parseOccurredDate(input.originalOccurredAt) : '')
  if (!selectedDate) {
    return createCurrentDateTimeValue()
  }
  if (input.pageMode === 'edit') {
    const originalTimeMatch = input.originalOccurredAt.match(/\b(\d{2}:\d{2}:\d{2})\b/)
    const originalTime = originalTimeMatch ? originalTimeMatch[1] : ''
    if (originalTime) {
      return `${selectedDate} ${originalTime}`
    }
  }
  return `${selectedDate} ${createCurrentTimeValue()}`
}
export function buildSubmitPayload(input: {
  pageMode: AddPageState['pageMode']
  originalOccurredAt: string
  activeCategory: string
  activeType: RecordType
  amount: string
  remark: string
  selectedDate: string
  categories: AddCategoryItem[]
}) {
  const activeCategory = input.categories.find((item) => item.name === input.activeCategory)
  if (!activeCategory) {
    return {
      ok: false as const,
      message: '请选择分类',
    }
  }
  const amountValue = evaluateAmount(input.amount)
  if (amountValue <= 0) {
    return {
      ok: false as const,
      message: '请输入正确金额',
    }
  }
  return {
    ok: true as const,
    payload: {
      categoryName: activeCategory.name,
      categoryId: activeCategory.id,
      type: input.activeType,
      amount: amountValue.toFixed(2),
      remark: normalizeRemark(input.remark.trim()),
      occurredAt: buildOccurredAtValue({
        pageMode: input.pageMode,
        selectedDate: input.selectedDate,
        originalOccurredAt: input.originalOccurredAt,
      }),
    },
  }
}
export async function submitTransaction(payload: {
  categoryName: string
  categoryId: string | number
  type: RecordType
  amount: string
  remark: string
  occurredAt: string
}) {
  const openId = await ensureOpenId()
  return post(
    '/frontend/bookkeeping/transaction/create',
    {
      openId,
      categoryId: payload.categoryId,
      type: payload.type,
      amount: payload.amount,
      title: payload.remark || payload.categoryName,
      remark: payload.remark,
      occurredAt: payload.occurredAt,
      status: 'normal',
    },
    {
      skipToken: true,
    },
  )
}
export async function updateTransaction(payload: {
  id: string
  categoryName: string
  categoryId: string | number
  type: RecordType
  amount: string
  remark: string
  occurredAt: string
}) {
  const openId = await ensureOpenId()
  return put(
    '/frontend/bookkeeping/transaction/update',
    {
      id: payload.id,
      openId,
      categoryId: payload.categoryId,
      type: payload.type,
      amount: payload.amount,
      title: payload.remark || payload.categoryName,
      remark: payload.remark,
      occurredAt: payload.occurredAt,
      status: 'normal',
    },
    {
      skipToken: true,
    },
  )
}
