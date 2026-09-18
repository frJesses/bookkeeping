import { ensureOpenId } from './auth'
import { get, post } from './request'

export type ExportType = 'all' | 'expense' | 'income'

export type ExportRecord = {
  id: string
  email: string
  startDate: string
  endDate: string
  type: ExportType
  fileName: string
  status: 'pending' | 'sent' | 'failed'
  createdAt: string
  sentAt: string | null
  expiresAt: string
}

type ExportPageResponse = {
  data: ExportRecord[]
  total: number
  current: number
  totalPage: number
}

export type CreateExportPayload = {
  email: string
  startDate: string
  endDate: string
  type: ExportType
}

export function createDefaultExportDates(referenceDate = new Date()) {
  const end = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate())
  const start = new Date(end)
  start.setDate(start.getDate() - 30)
  return {
    startDate: formatDate(start),
    endDate: formatDate(end),
  }
}

function pad(value: number) {
  return `${value}`.padStart(2, '0')
}

function formatDate(value: Date) {
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`
}

export function formatExportDate(value: string) {
  const matched = /^\d{4}-(\d{2})-(\d{2})$/.exec(value)
  return matched ? `${Number(matched[1])}月${Number(matched[2])}日` : value
}

export function formatExportDateTime(value: string) {
  if (!value) return ''
  return value.replace('T', ' ').slice(0, 16)
}

export async function createExport(payload: CreateExportPayload) {
  const openId = await ensureOpenId()
  return post<ExportRecord>('/frontend/bookkeeping/export/create', { openId, ...payload }, { skipToken: true })
}

export async function getExportRecords(page = 1, size = 20): Promise<ExportPageResponse> {
  const openId = await ensureOpenId()
  return get<ExportPageResponse>('/frontend/bookkeeping/export/records', { openId, page, size }, { skipToken: true })
}

export async function getExportPassword(id: string) {
  const openId = await ensureOpenId()
  return get<{ id: string; password: string; expiresAt: string }>(
    `/frontend/bookkeeping/export/records/${encodeURIComponent(id)}/password`,
    { openId },
    { skipToken: true },
  )
}
