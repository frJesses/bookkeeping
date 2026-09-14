import {
  createCalendarPageState,
  getCalendarPageData,
  type CalendarPageState,
} from '../../services/calendar'
import {
  createAvailableMonthOptions,
  createDefaultDateForMonth,
  createMonthPickerState,
} from '../../utils/month-picker'

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
    this.setData({ statusBarHeight: wx.getSystemInfoSync().statusBarHeight || 20 })
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
    this.setData({
      showDatePicker: true,
      ...createMonthPickerState(this.data.selectedMonth),
    })
  },
  closeDatePicker() {
    this.setData({ showDatePicker: false })
  },
  handleDatePickerChange(
    this: CalendarPageInstance,
    event: WechatMiniprogram.CustomEvent<{ value?: number[] }>,
  ) {
    if (!Array.isArray(event.detail.value)) {
      return
    }
    const [yearIndex = 0, monthIndex = 0] = event.detail.value
    const previousYear = this.data.pickerYears[this.data.pickerValue[0]]
    const selectedYear = this.data.pickerYears[yearIndex]
    if (!selectedYear) {
      return
    }
    if (selectedYear !== previousYear) {
      this.setData({
        pickerMonths: createAvailableMonthOptions(selectedYear),
        pickerValue: [yearIndex, 0],
      })
      return
    }
    this.setData({ pickerValue: [yearIndex, monthIndex] })
  },
  confirmDatePicker(this: CalendarPageInstance) {
    const year = this.data.pickerYears[this.data.pickerValue[0]]
    const month = this.data.pickerMonths[this.data.pickerValue[1]]
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
  requestVersion: 0,
})
