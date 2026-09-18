import { ensureOpenId } from './auth'
import { del, get, post, put } from './request'

export type LoanStatus = 'open' | 'partial' | 'settled'

export type LoanRecord = {
  id: string
  borrower: string
  amount: string
  repaidAmount: string
  remainingAmount: string
  loanDate: string
  dueDate: string | null
  remark: string
  status: LoanStatus
  statusLabel: string
}

export type LoanSummary = {
  records: LoanRecord[]
  totalAmount: string
  totalRepaid: string
  totalOutstanding: string
  openCount: number
}

export type LoanPayload = {
  borrower: string
  amount: string
  loanDate: string
  dueDate?: string
  remark: string
}

export async function getLoans() {
  const openId = await ensureOpenId()
  return get<LoanSummary>('/frontend/bookkeeping/loan/list', { openId }, { skipToken: true })
}

export async function createLoan(payload: LoanPayload) {
  const openId = await ensureOpenId()
  return post<LoanRecord>('/frontend/bookkeeping/loan/create', { openId, ...payload }, { skipToken: true })
}

export async function updateLoan(id: string, payload: LoanPayload) {
  const openId = await ensureOpenId()
  return put<LoanRecord>('/frontend/bookkeeping/loan/update', { openId, id, ...payload }, { skipToken: true })
}

export async function repayLoan(id: string, amount: string) {
  const openId = await ensureOpenId()
  return post<LoanRecord>('/frontend/bookkeeping/loan/repay', { openId, id, amount }, { skipToken: true })
}

export async function deleteLoan(id: string) {
  const openId = await ensureOpenId()
  return del<null>('/frontend/bookkeeping/loan/delete', { openId, id }, { skipToken: true })
}

export function getTodayDate() {
  const now = new Date()
  const pad = (value: number) => `${value}`.padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}
