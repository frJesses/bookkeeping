import { getCategoryOptions, type AddCategoryItem } from './add'
import type { RecordType } from '../constants/add'
import { ensureOpenId } from './auth'
import { del, get, post, put } from './request'

export type RecurringRule = {
  id: string
  categoryId: string
  categoryName: string
  categoryIcon?: string | null
  type: RecordType
  title: string
  amount: string
  remark: string
  dayOfMonth: number
  startDate: string
  endDate: string | null
  isEnabled: boolean
}

export type RecurringRulePayload = {
  categoryId: string | number
  type: RecordType
  title: string
  amount: string
  remark: string
  dayOfMonth: number
  startDate: string
  endDate?: string
  isEnabled?: boolean
}

export async function getRecurringRules() {
  const openId = await ensureOpenId()
  return get<RecurringRule[]>('/frontend/bookkeeping/recurring/list', { openId }, { skipToken: true })
}

export async function createRecurringRule(payload: RecurringRulePayload) {
  const openId = await ensureOpenId()
  return post<RecurringRule>('/frontend/bookkeeping/recurring/create', { openId, ...payload }, { skipToken: true })
}

export async function updateRecurringRule(id: string, payload: Partial<RecurringRulePayload>) {
  const openId = await ensureOpenId()
  return put<RecurringRule>('/frontend/bookkeeping/recurring/update', { openId, id, ...payload }, { skipToken: true })
}

export async function deleteRecurringRule(id: string) {
  const openId = await ensureOpenId()
  return del<null>('/frontend/bookkeeping/recurring/delete', { openId, id }, { skipToken: true })
}

export async function getRecurringCategoryOptions(type: RecordType): Promise<AddCategoryItem[]> {
  return (await getCategoryOptions(type)).filter((item) => item.name !== '设置')
}

export function createRecurringDayOptions(monthValue = getTodayValue()) {
  const matched = /^(\d{4})-(\d{2})-\d{2}$/.exec(monthValue)
  const year = matched ? Number(matched[1]) : new Date().getFullYear()
  const month = matched ? Number(matched[2]) : new Date().getMonth() + 1
  const daysInMonth = new Date(year, month, 0).getDate()
  return Array.from({ length: daysInMonth }, (_, index) => `${index + 1}日`)
}

export function getTodayValue(referenceDate = new Date()) {
  const pad = (value: number) => `${value}`.padStart(2, '0')
  return `${referenceDate.getFullYear()}-${pad(referenceDate.getMonth() + 1)}-${pad(referenceDate.getDate())}`
}
