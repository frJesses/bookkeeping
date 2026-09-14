import { getCategoryIconAsset } from '../constants/design'
import {
  createCurrentMonthValue,
  createDefaultDateForMonth,
} from '../utils/month-picker'
import { ensureOpenId } from './auth'
import { get } from './request'
import type { HomeRecentRecordDTO, HomeRecordItem } from './home'

export type CalendarCell = {
  key: string
  date: string
  label: string
  expenseText: string
  incomeText: string
  isMuted: boolean
  isDisabled: boolean
  isActive: boolean
  isToday: boolean
  hasRecord: boolean
}

type CalendarDayDTO = {
  date: string
  expense: string
  income: string
}

type CalendarResponseDTO = {
  month: string
  selectedDate: string
  recordedDays: number
  days: CalendarDayDTO[]
  selectedSummary: {
    expense: string
    income: string
  }
  records: HomeRecentRecordDTO[]
}

export type CalendarPageState = {
  selectedMonth: string
  monthLabel: string
  selectedDate: string
  recordedDays: number
  days: CalendarCell[]
  selectedDateLabel: string
  selectedExpenseText: string
  selectedIncomeText: string
  hasSelectedIncome: boolean
  selectedRecords: HomeRecordItem[]
}

function padNumber(value: number) {
  return `${value}`.padStart(2, '0')
}

function formatMonthLabel(month: string) {
  const [year, monthNumber] = month.split('-')
  return `${year}年${Number(monthNumber)}月`
}

function formatCellAmount(value: string, prefix: '-' | '+') {
  const amount = Number(value || 0)
  return amount > 0 ? `${prefix}${amount.toFixed(2)}` : ''
}

function formatSelectedDateLabel(date: string) {
  const [, month, day] = date.split('-')
  return `${Number(month)}月${Number(day)}日账单`
}

function parseLocalDate(value: string) {
  const matched = value.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!matched) {
    return new Date(Number.NaN)
  }
  return new Date(Number(matched[1]), Number(matched[2]) - 1, Number(matched[3]))
}

function formatDateValue(date: Date) {
  return `${date.getFullYear()}-${padNumber(date.getMonth() + 1)}-${padNumber(date.getDate())}`
}

export function buildCalendarCells(
  month: string,
  dayItems: CalendarDayDTO[],
  selectedDate: string,
  referenceDate = new Date(),
) {
  const [yearText, monthText] = month.split('-')
  const year = Number(yearText)
  const monthIndex = Number(monthText) - 1
  const monthStart = new Date(year, monthIndex, 1)
  const leadingDayCount = monthStart.getDay()
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate()
  const cellCount = Math.max(35, Math.ceil((leadingDayCount + daysInMonth) / 7) * 7)
  const firstCellDate = new Date(year, monthIndex, 1 - leadingDayCount)
  const todayValue = formatDateValue(referenceDate)
  const today = parseLocalDate(todayValue)
  const dayMap = new Map(dayItems.map((item) => [item.date, item]))

  return Array.from({ length: cellCount }, (_, index) => {
    const date = new Date(
      firstCellDate.getFullYear(),
      firstCellDate.getMonth(),
      firstCellDate.getDate() + index,
    )
    const dateValue = formatDateValue(date)
    const isCurrentMonth = date.getFullYear() === year && date.getMonth() === monthIndex
    const isFuture = date.getTime() > today.getTime()
    const isDisabled = !isCurrentMonth || isFuture
    const summary = dayMap.get(dateValue)
    return {
      key: dateValue,
      date: dateValue,
      label: `${date.getDate()}`,
      expenseText: !isDisabled && summary ? formatCellAmount(summary.expense, '-') : '',
      incomeText: !isDisabled && summary ? formatCellAmount(summary.income, '+') : '',
      isMuted: !isCurrentMonth,
      isDisabled,
      isActive: !isDisabled && dateValue === selectedDate,
      isToday: !isDisabled && dateValue === todayValue,
      hasRecord: Boolean(summary && (Number(summary.expense) > 0 || Number(summary.income) > 0)),
    }
  })
}

function mapSelectedRecords(records: HomeRecentRecordDTO[]): HomeRecordItem[] {
  return records.map((item, index) => {
    const amount = Number(item.amount || 0)
    const occurredAt = item.occurredAt || ''
    const timeMatched = occurredAt.match(/[ T](\d{2}):(\d{2})/)
    return {
      id: `${item.id || index + 1}`,
      recordKey: `calendar-${item.id || index + 1}-${index}`,
      categoryId: item.categoryId || '',
      occurredTimeText: timeMatched ? `${timeMatched[1]}:${timeMatched[2]}` : '',
      occurredAt,
      title: item.categoryName || '未分类',
      iconUrl: (item.categoryIcon || '').trim() || getCategoryIconAsset(item.categoryName),
      fallbackIconUrl: getCategoryIconAsset(item.categoryName, item.categoryIcon || ''),
      iconColor: item.categoryIconColor || '',
      iconBackgroundColor: '#ffffff',
      iconBorderColor: 'transparent',
      amountSign: item.type === 'income' ? '' : '-',
      amountValue: amount.toFixed(2),
      amountClass: item.type,
      remark: item.remark || '',
      tagText: item.remark || item.title || item.categoryName || '',
    }
  })
}

export function createCalendarPageState(referenceDate = new Date()): CalendarPageState {
  const selectedMonth = createCurrentMonthValue(referenceDate)
  const selectedDate = createDefaultDateForMonth(selectedMonth, referenceDate)
  return {
    selectedMonth,
    monthLabel: formatMonthLabel(selectedMonth),
    selectedDate,
    recordedDays: 0,
    days: buildCalendarCells(selectedMonth, [], selectedDate, referenceDate),
    selectedDateLabel: formatSelectedDateLabel(selectedDate),
    selectedExpenseText: '0.00',
    selectedIncomeText: '0.00',
    hasSelectedIncome: false,
    selectedRecords: [],
  }
}

export async function getCalendarPageData(month: string, date?: string) {
  const openId = await ensureOpenId()
  const data = await get<CalendarResponseDTO>('/frontend/bookkeeping/transaction/calendar', {
    openId,
    month,
    date: date || '',
  }, {
    skipToken: true,
  })
  return {
    selectedMonth: data.month,
    monthLabel: formatMonthLabel(data.month),
    selectedDate: data.selectedDate,
    recordedDays: data.recordedDays,
    days: buildCalendarCells(data.month, data.days, data.selectedDate),
    selectedDateLabel: formatSelectedDateLabel(data.selectedDate),
    selectedExpenseText: Number(data.selectedSummary.expense || 0).toFixed(2),
    selectedIncomeText: Number(data.selectedSummary.income || 0).toFixed(2),
    hasSelectedIncome: Number(data.selectedSummary.income || 0) > 0,
    selectedRecords: mapSelectedRecords(Array.isArray(data.records) ? data.records : []),
  }
}
