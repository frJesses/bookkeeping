import { HomeRecordItem } from './home'
import { del } from './request'
export type TransactionDetailRecord = {
  id: string
  recordKey: string
  categoryId: string
  title: string
  iconUrl: string
  occurredAt: string
  occurredTimeText: string
  amountSign: string
  amountValue: string
  amountClass: 'expense' | 'income'
  remark: string
  tagText: string
}
export type TransactionDetailState = {
  record: TransactionDetailRecord | null
  pageTitle: string
  amountText: string
  amountClass: 'expense' | 'income'
  typeLabel: string
  occurredAtText: string
  remarkText: string
  hasRecord: boolean
}
const STORAGE_KEY = 'bookkeeping_current_transaction_detail'
const EDIT_STORAGE_KEY = 'bookkeeping_edit_transaction_detail'

function createTransactionDetailRecord(record: HomeRecordItem): TransactionDetailRecord {
  return {
    id: record.id,
    recordKey: record.recordKey,
    categoryId: record.categoryId,
    title: record.title,
    iconUrl: record.iconUrl,
    occurredAt: record.occurredAt,
    occurredTimeText: record.occurredTimeText,
    amountSign: record.amountSign,
    amountValue: record.amountValue,
    amountClass: record.amountClass,
    remark: record.remark,
    tagText: record.tagText,
  }
}
function parseDateFromValue(value: string) {
  const matched = value.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (matched) {
    const year = Number(matched[1])
    const month = Number(matched[2])
    const day = Number(matched[3])
    return new Date(year, month - 1, day)
  }
  let date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    date = new Date(value.replace(/-/g, '/'))
  }
  return date
}
function formatOccurredAtText(value: string) {
  if (!value) {
    return '--'
  }
  const date = parseDateFromValue(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }
  const weekMap = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  const weekLabel = weekMap[date.getDay()] || ''
  return `${year}年${month}月${day}日 ${weekLabel}`
}
export function createTransactionDetailState(record?: TransactionDetailRecord | null): TransactionDetailState {
  if (!record) {
    return {
      record: null,
      pageTitle: '记录详情',
      amountText: '',
      amountClass: 'expense',
      typeLabel: '',
      occurredAtText: '--',
      remarkText: '',
      hasRecord: false,
    }
  }
  return {
    record,
    pageTitle: record.title || '记录详情',
    amountText: `${record.amountSign}${record.amountValue}`,
    amountClass: record.amountClass,
    typeLabel: record.amountClass === 'income' ? '收入' : '支出',
    occurredAtText: formatOccurredAtText(record.occurredAt),
    remarkText: record.remark || '暂无备注',
    hasRecord: true,
  }
}
export function cacheTransactionDetail(record: HomeRecordItem) {
  wx.setStorageSync(STORAGE_KEY, createTransactionDetailRecord(record))
}
export function cacheEditingHomeTransaction(record: HomeRecordItem) {
  wx.setStorageSync(EDIT_STORAGE_KEY, createTransactionDetailRecord(record))
}
export function getCachedTransactionDetail() {
  const record = wx.getStorageSync(STORAGE_KEY) as TransactionDetailRecord | null
  return record || null
}
export function clearCachedTransactionDetail() {
  wx.removeStorageSync(STORAGE_KEY)
}
export function cacheEditingTransaction(record: TransactionDetailRecord) {
  wx.setStorageSync(EDIT_STORAGE_KEY, record)
}
export function getEditingTransaction() {
  const record = wx.getStorageSync(EDIT_STORAGE_KEY) as TransactionDetailRecord | null
  return record || null
}
export function clearEditingTransaction() {
  wx.removeStorageSync(EDIT_STORAGE_KEY)
}
export async function deleteTransactionById(id: string) {
  return del(
    '/frontend/bookkeeping/transaction/delete',
    {
      id,
    },
    {
      skipToken: true,
    },
  )
}
