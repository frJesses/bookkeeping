import { createCalendarPageState, getCalendarPageData, type CalendarPageState } from '../../services/calendar'
import {
  createAvailableMonthOptions,
  createDefaultDateForMonth,
  createMonthPickerState,
} from '../../utils/month-picker'
import { getWindowInfo } from '../../utils/system-info'

type CalendarPageInstance = WechatMiniprogram.Page.Instance<
  WechatMiniprogram.IAnyObject,
  WechatMiniprogram.IAnyObject
> & {
  requestVersion: number
  data: CalendarPageState & {
    statusBarHeight: number
    showDatePicker: boolean
    pickerYears: string[]
    pickerMonths: string[]
    pickerValue: number[]
    isLoading: boolean
    errorMessage: string
  }
  pickerSelection: number[]
  isPickerScrolling: boolean
  pendingPickerConfirmation: boolean
}

const initialState = createCalendarPageState()
const initialPickerState = createMonthPickerState(initialState.selectedMonth)

Page({
  data: {
    ...initialState,
    ...initialPickerState,
    statusBarHeight: 20,
    showDatePicker: false,
    isLoading: false,
    errorMessage: '',
    weekLabels: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'],
  },
  onLoad(this: CalendarPageInstance) {
    this.setData({ statusBarHeight: getWindowInfo().statusBarHeight || 20 })
    void this.loadCalendarData(this.data.selectedMonth, this.data.selectedDate)
  },
  async loadCalendarData(this: CalendarPageInstance, month: string, date?: string) {
    this.requestVersion += 1
    const requestVersion = this.requestVersion
    this.setData({ isLoading: true, errorMessage: '' })
    wx.showLoading({ title: '加载中', mask: true })
    try {
      const data = await getCalendarPageData(month, date)
      if (requestVersion !== this.requestVersion) {
        return
      }
      this.setData({
        ...data,
        isLoading: false,
      })
      wx.hideLoading()
    } catch (error) {
      if (requestVersion !== this.requestVersion) {
        return
      }
      console.error('load calendar data failed', error)
      this.setData({
        isLoading: false,
        errorMessage: '日历加载失败，请稍后重试',
        selectedRecords: [],
      })
      wx.hideLoading()
    }
  },
  onUnload() {
    wx.hideLoading()
  },
  goBack() {
    if (getCurrentPages().length > 1) {
      wx.navigateBack()
      return
    }
    wx.switchTab({ url: '/pages/index/index' })
  },
  openDatePicker(this: CalendarPageInstance) {
    const pickerState = createMonthPickerState(this.data.selectedMonth)
    this.pickerSelection = [...pickerState.pickerValue]
    this.isPickerScrolling = false
    this.pendingPickerConfirmation = false
    this.setData({
      showDatePicker: true,
      ...pickerState,
    })
  },
  closeDatePicker(this: CalendarPageInstance) {
    this.isPickerScrolling = false
    this.pendingPickerConfirmation = false
    this.setData({ showDatePicker: false })
  },
  handleDatePickerStart(this: CalendarPageInstance) {
    this.isPickerScrolling = true
  },
  handleDatePickerEnd(this: CalendarPageInstance) {
    this.isPickerScrolling = false
    if (!this.pendingPickerConfirmation) {
      return
    }
    this.pendingPickerConfirmation = false
    setTimeout(() => this.confirmDatePicker(), 0)
  },
  handleDatePickerChange(this: CalendarPageInstance, event: WechatMiniprogram.CustomEvent<{ value?: number[] }>) {
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
  confirmDatePicker(this: CalendarPageInstance) {
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
    void this.loadCalendarData(selectedMonth, selectedDate)
  },
  selectDay(this: CalendarPageInstance, event: WechatMiniprogram.BaseEvent) {
    const { date, disabled } = event.currentTarget.dataset as {
      date?: string
      disabled?: boolean
    }
    if (!date || disabled) {
      return
    }
    void this.loadCalendarData(this.data.selectedMonth, date)
  },
  handleRetry(this: CalendarPageInstance) {
    void this.loadCalendarData(this.data.selectedMonth, this.data.selectedDate)
  },
  noop() {},
  pickerSelection: [initialPickerState.pickerValue[0], initialPickerState.pickerValue[1]],
  isPickerScrolling: false,
  pendingPickerConfirmation: false,
  requestVersion: 0,
})
