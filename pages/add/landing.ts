import { createCalendarPageState, getCalendarPageData } from '../../services/calendar'
import {
  createAvailableMonthOptions,
  createCurrentMonthValue,
  createDefaultDateForMonth,
  createMonthPickerState,
  shiftMonthValue,
} from '../../utils/month-picker'

type LandingPageInstance = WechatMiniprogram.Page.Instance<
  WechatMiniprogram.IAnyObject,
  WechatMiniprogram.IAnyObject
> & {
  requestVersion: number
  data: ReturnType<typeof createCalendarPageState> & {
    weekLabels: string[]
    isLoading: boolean
    errorMessage: string
    canGoPreviousMonth: boolean
    canGoNextMonth: boolean
    showDatePicker: boolean
    pickerYears: string[]
    pickerMonths: string[]
    pickerValue: number[]
  }
  pickerSelection: number[]
  isPickerScrolling: boolean
  pendingPickerConfirmation: boolean
}

const initialState = createCalendarPageState()
const initialPickerState = createMonthPickerState(initialState.selectedMonth)

function canUseMonth(month: string) {
  const currentMonth = createCurrentMonthValue()
  const currentYear = new Date().getFullYear()
  return month >= `${currentYear - 3}-01` && month <= currentMonth
}

Page({
  data: {
    ...initialState,
    ...initialPickerState,
    weekLabels: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'],
    isLoading: false,
    errorMessage: '',
    canGoPreviousMonth: true,
    canGoNextMonth: false,
    showDatePicker: false,
  },
  onLoad(this: LandingPageInstance) {
    void this.loadMonth(this.data.selectedMonth, this.data.selectedDate)
  },
  async loadMonth(this: LandingPageInstance, month: string, date?: string) {
    this.requestVersion += 1
    const requestVersion = this.requestVersion
    this.setData({ isLoading: true, errorMessage: '' })
    try {
      const data = await getCalendarPageData(month, date)
      if (requestVersion !== this.requestVersion) return
      const previousMonth = shiftMonthValue(month, -1)
      const adjacent = await getCalendarPageData(previousMonth)
      const adjacentRecords = new Map(adjacent.days.map((item) => [item.date, item.hasRecord]))
      const today = new Date()
      const todayValue = `${today.getFullYear()}-${`${today.getMonth() + 1}`.padStart(2, '0')}-${`${today.getDate()}`.padStart(2, '0')}`
      const days = data.days.map((item) => {
        if (!item.isMuted) return item
        return {
          ...item,
          hasRecord: Boolean(adjacentRecords.get(item.date)),
          isDisabled: item.date > todayValue,
        }
      })
      this.setData({
        ...data,
        days,
        isLoading: false,
        canGoPreviousMonth: canUseMonth(shiftMonthValue(data.selectedMonth, -1)),
        canGoNextMonth: canUseMonth(shiftMonthValue(data.selectedMonth, 1)),
      })
    } catch (error) {
      if (requestVersion !== this.requestVersion) return
      console.error('load landing month failed', error)
      this.setData({ isLoading: false, errorMessage: '账单加载失败，请稍后重试' })
    }
  },
  goBack() {
    wx.navigateBack()
  },
  openDatePicker(this: LandingPageInstance) {
    const pickerState = createMonthPickerState(this.data.selectedMonth)
    this.pickerSelection = [...pickerState.pickerValue]
    this.isPickerScrolling = false
    this.pendingPickerConfirmation = false
    this.setData({
      showDatePicker: true,
      ...pickerState,
    })
  },
  closeDatePicker(this: LandingPageInstance) {
    this.isPickerScrolling = false
    this.pendingPickerConfirmation = false
    this.setData({ showDatePicker: false })
  },
  handleDatePickerStart(this: LandingPageInstance) {
    this.isPickerScrolling = true
  },
  handleDatePickerEnd(this: LandingPageInstance) {
    this.isPickerScrolling = false
    if (!this.pendingPickerConfirmation) {
      return
    }
    this.pendingPickerConfirmation = false
    setTimeout(() => this.confirmDatePicker(), 0)
  },
  handleDatePickerChange(this: LandingPageInstance, event: WechatMiniprogram.CustomEvent<{ value?: number[] }>) {
    if (!Array.isArray(event.detail.value)) {
      return
    }
    const [yearIndex = 0, monthIndex = 0] = event.detail.value
    const previousYear = this.data.pickerYears[this.pickerSelection[0]]
    const selectedYear = this.data.pickerYears[yearIndex]
    if (!selectedYear) {
      return
    }
    if (selectedYear !== previousYear) {
      this.pickerSelection = [yearIndex, 0]
      this.setData({
        pickerMonths: createAvailableMonthOptions(selectedYear),
        pickerValue: [yearIndex, 0],
      })
      return
    }
    this.pickerSelection = [yearIndex, monthIndex]
    this.setData({ pickerValue: this.pickerSelection })
  },
  confirmDatePicker(this: LandingPageInstance) {
    if (this.isPickerScrolling) {
      this.pendingPickerConfirmation = true
      return
    }
    const [yearIndex, monthIndex] = this.pickerSelection
    const year = this.data.pickerYears[yearIndex]
    const month = this.data.pickerMonths[monthIndex]
    if (!year || !month) {
      return
    }
    const selectedMonth = `${year}-${String(month).padStart(2, '0')}`
    const selectedDate = createDefaultDateForMonth(selectedMonth)
    this.setData({ showDatePicker: false })
    void this.loadMonth(selectedMonth, selectedDate)
  },
  selectDay(this: LandingPageInstance, event: WechatMiniprogram.BaseEvent) {
    const { date, disabled } = event.currentTarget.dataset as { date?: string; disabled?: boolean }
    if (!date || disabled) return
    const targetMonth = date.slice(0, 7)
    void this.loadMonth(targetMonth, date)
  },
  handlePreviousMonth(this: LandingPageInstance) {
    const month = shiftMonthValue(this.data.selectedMonth, -1)
    if (canUseMonth(month)) void this.loadMonth(month)
  },
  handleNextMonth(this: LandingPageInstance) {
    const month = shiftMonthValue(this.data.selectedMonth, 1)
    if (canUseMonth(month)) void this.loadMonth(month)
  },
  startEntry(this: LandingPageInstance) {
    wx.redirectTo({
      url: `/pages/add/add?type=expense&date=${encodeURIComponent(this.data.selectedDate)}`,
    })
  },
  handleRetry(this: LandingPageInstance) {
    void this.loadMonth(this.data.selectedMonth, this.data.selectedDate)
  },
  noop() {},
  pickerSelection: [initialPickerState.pickerValue[0], initialPickerState.pickerValue[1]],
  isPickerScrolling: false,
  pendingPickerConfirmation: false,
  requestVersion: 0,
})
