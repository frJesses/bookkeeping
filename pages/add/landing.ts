import {
  createCalendarPageState,
  getCalendarPageData,
} from '../../services/calendar'
import { createCurrentMonthValue, shiftMonthValue } from '../../utils/month-picker'

type LandingPageInstance = WechatMiniprogram.Page.Instance<WechatMiniprogram.IAnyObject, WechatMiniprogram.IAnyObject> & {
  requestVersion: number
  data: ReturnType<typeof createCalendarPageState> & {
    weekLabels: string[]
    isLoading: boolean
    errorMessage: string
    canGoPreviousMonth: boolean
    canGoNextMonth: boolean
  }
}

const initialState = createCalendarPageState()

function canUseMonth(month: string) {
  const currentMonth = createCurrentMonthValue()
  const currentYear = new Date().getFullYear()
  return month >= `${currentYear - 3}-01` && month <= currentMonth
}

Page({
  data: {
    ...initialState,
    weekLabels: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'],
    isLoading: false,
    errorMessage: '',
    canGoPreviousMonth: true,
    canGoNextMonth: false,
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
  goBack() { wx.navigateBack() },
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
  startEntry() { wx.redirectTo({ url: '/pages/add/add?type=expense' }) },
  handleRetry(this: LandingPageInstance) { void this.loadMonth(this.data.selectedMonth, this.data.selectedDate) },
  requestVersion: 0,
})
