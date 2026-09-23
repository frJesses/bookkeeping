import { createTabBarBehavior, TabBarBehaviorPageInstance } from '../../behaviors/tabbar'
import type {
  PagedScrollFetchMethod,
  PagedScrollInstance,
  PagedScrollRequest,
} from '../../components/paged-scroll/index'
import {
  buildHomeRecentRecordGroups,
  createHomePageState,
  getHomeMonthOverview,
  getHomeRecentRecordPage,
  type HomeRecentRecordDTO,
  type HomeRecordItem,
} from '../../services/home'
import { getAchievementPageData, markAchievementEffectsSeen, type AchievementCard } from '../../services/achievement'
import { cacheEditingHomeTransaction, deleteTransactionById } from '../../services/transaction-detail'
import { createAvailableMonthOptions, createMonthPickerState, createRecentYearOptions } from '../../utils/month-picker'
import { getWindowInfo } from '../../utils/system-info'

type EntryType = 'expense' | 'income'
type CustomTabBarPage = WechatMiniprogram.Page.Instance<WechatMiniprogram.IAnyObject, WechatMiniprogram.IAnyObject> & {
  getTabBar?: () => WechatMiniprogram.Component.TrivialInstance
}
type TransactionSwipeRowInstance = WechatMiniprogram.Component.TrivialInstance & {
  data: {
    record?: HomeRecordItem
  }
  close: () => void
}
type HomePageInstance = TabBarBehaviorPageInstance & {
  homeInitialized: boolean
  loadPageDataVersion: number
  data: ReturnType<typeof createHomePageState> & {
    statusBarHeight: number
    navBarHeight: number
    capsuleTop: number
    capsuleHeight: number
    capsuleWidth: number
    capsuleRight: number
    showDatePicker: boolean
    pickerYears: string[]
    pickerMonths: string[]
    pickerValue: number[]
    unlockEffects: AchievementCard[]
    showAchievementEffect: boolean
    unlockEffectIndex: number
  }
  pickerSelection: number[]
  isPickerScrolling: boolean
  pendingPickerConfirmation: boolean
  shownAchievementCodes: Set<string>
}

function setCustomTabBarHidden(page: HomePageInstance, hidden: boolean) {
  const tabBarPage = page as unknown as CustomTabBarPage
  const tabBar = typeof tabBarPage.getTabBar === 'function' ? tabBarPage.getTabBar() : undefined
  if (tabBar) {
    tabBar.setData({ hidden })
  }
}

const initialPickerYears = createRecentYearOptions()

Page({
  behaviors: [createTabBarBehavior('/pages/index/index')],
  data: {
    ...createHomePageState(),
    statusBarHeight: 20,
    navBarHeight: 88,
    capsuleTop: 0,
    capsuleHeight: 32,
    capsuleWidth: 96,
    capsuleRight: 16,
    showDatePicker: false,
    pickerYears: initialPickerYears,
    pickerMonths: createAvailableMonthOptions(initialPickerYears[0]),
    pickerValue: [0, 0],
    unlockEffects: [],
    showAchievementEffect: false,
    unlockEffectIndex: 0,
  },
  onLoad(this: HomePageInstance) {
    this.initTabBarLayout()
    this.initCustomHeader()
  },
  onReady(this: HomePageInstance) {
    void this.loadPageData()
  },
  onShow(this: HomePageInstance) {
    this.syncTabBarState()
    setCustomTabBarHidden(this, this.data.showDatePicker || this.data.showAchievementEffect)
    if (this.homeInitialized) {
      void this.loadPageData()
    }
  },
  onUnload(this: HomePageInstance) {
    setCustomTabBarHidden(this, false)
  },
  async loadPageData(this: HomePageInstance, month?: string) {
    this.homeInitialized = true
    this.loadPageDataVersion += 1
    const requestVersion = this.loadPageDataVersion
    const selectedMonth = month || this.data.selectedMonth
    const pagedScroll = this.selectComponent('#homePagedScroll') as PagedScrollInstance | null
    const listTask = pagedScroll
      ? pagedScroll.initLoad(this.fetchRecentRecords.bind(this) as PagedScrollFetchMethod, {
          pageSize: 10,
          month: selectedMonth,
          status: 'normal',
        })
      : Promise.resolve()
    const achievementTask = getAchievementPageData().catch((error) => {
      console.error('get achievement effect data failed', error)
      return null
    })
    const [overview, , achievementData] = await Promise.all([
      getHomeMonthOverview(selectedMonth),
      listTask,
      achievementTask,
    ])
    if (requestVersion === this.loadPageDataVersion && selectedMonth === this.data.selectedMonth) {
      const pendingEffects = achievementData
        ? achievementData.earned.filter((item) => !item.effectSeen && !this.shownAchievementCodes.has(item.code))
        : []
      const unlockEffects = pendingEffects.slice(0, 5)
      this.setData(
        {
          ...overview,
          unlockEffects,
          showAchievementEffect: unlockEffects.length > 0,
          unlockEffectIndex: 0,
        },
        () => {
          setCustomTabBarHidden(this, this.data.showDatePicker || this.data.showAchievementEffect)
          if (!pendingEffects.length) return
          pendingEffects.forEach((item) => this.shownAchievementCodes.add(item.code))
          void markAchievementEffectsSeen(pendingEffects.map((item) => item.code)).catch((error) => {
            console.error('mark achievement effects seen failed', error)
          })
        },
      )
    }
  },
  fetchRecentRecords(this: HomePageInstance, params: PagedScrollRequest) {
    return getHomeRecentRecordPage({
      pageNo: params.pageNo,
      pageSize: params.pageSize,
      month: typeof params.month === 'string' ? params.month : this.data.selectedMonth,
      status: typeof params.status === 'string' ? params.status : 'normal',
    })
  },
  handleRecordsChange(e: WechatMiniprogram.CustomEvent<{ list?: HomeRecentRecordDTO[] }>) {
    const list = e.detail && Array.isArray(e.detail.list) ? e.detail.list : []
    this.setData({ recentRecordGroups: buildHomeRecentRecordGroups(list) })
  },
  async handleRecordsRefresh(this: HomePageInstance) {
    const selectedMonth = this.data.selectedMonth
    const overview = await getHomeMonthOverview(selectedMonth)
    if (selectedMonth === this.data.selectedMonth) {
      this.setData(overview)
    }
  },
  goToBudget() {
    wx.navigateTo({ url: '/pages/budget/budget' })
  },
  goToCalendar() {
    wx.navigateTo({ url: '/pages/calendar/calendar' })
  },
  goToStats() {
    wx.navigateTo({ url: '/pages/stats/stats' })
  },
  closeAchievementEffect(this: HomePageInstance) {
    this.setData({ showAchievementEffect: false, unlockEffects: [], unlockEffectIndex: 0 }, () => {
      setCustomTabBarHidden(this, this.data.showDatePicker)
    })
  },
  viewAchievements(this: HomePageInstance) {
    this.closeAchievementEffect()
    wx.navigateTo({ url: '/pages/profile/achievement' })
  },
  handleUnlockTouchStart(this: HomePageInstance, event: WechatMiniprogram.TouchEvent) {
    const touch = event.touches[0]
    if (touch) {
      this.unlockEffectTouchStartX = touch.clientX
    }
  },
  handleUnlockTouchEnd(this: HomePageInstance, event: WechatMiniprogram.TouchEvent) {
    const touch = event.changedTouches[0]
    const startX = this.unlockEffectTouchStartX
    if (!touch || !startX || this.data.unlockEffects.length < 2) {
      return
    }
    const deltaX = touch.clientX - startX
    if (Math.abs(deltaX) < 40) {
      return
    }
    const nextIndex = deltaX < 0 ? this.data.unlockEffectIndex + 1 : this.data.unlockEffectIndex - 1
    const unlockEffectIndex = Math.max(0, Math.min(this.data.unlockEffects.length - 1, nextIndex))
    this.setData({ unlockEffectIndex })
  },
  handleSwipeOpen(e: WechatMiniprogram.CustomEvent<{ id?: string }>) {
    const openedId = `${e.detail.id || ''}`
    const rows = this.selectAllComponents('.record-swipe-row') as unknown as TransactionSwipeRowInstance[]
    rows.forEach((row) => {
      const recordId = row.data.record ? row.data.record.id : ''
      if (`${recordId}` !== openedId) {
        row.close()
      }
    })
  },
  handleRecordEdit(e: WechatMiniprogram.CustomEvent<{ record?: HomeRecordItem }>) {
    const record = e.detail.record
    if (!record) {
      return
    }
    cacheEditingHomeTransaction(record)
    wx.navigateTo({
      url: `/pages/add/add?mode=edit&type=${record.amountClass}`,
    })
  },
  handleRecordDelete(this: HomePageInstance, e: WechatMiniprogram.CustomEvent<{ record?: HomeRecordItem }>) {
    const record = e.detail.record
    if (!record) {
      return
    }
    wx.showModal({
      title: '删除记录',
      content: '删除后无法恢复，确定删除这条记录吗？',
      confirmText: '删除',
      confirmColor: '#ff6b6b',
      success: async (result) => {
        if (!result.confirm) {
          return
        }
        try {
          await deleteTransactionById(record.id)
          wx.showToast({ title: '删除成功', icon: 'success' })
          await this.loadPageData()
        } catch (error) {
          console.error('delete transaction failed', error)
          wx.showToast({ title: '删除失败，请重试', icon: 'none' })
        }
      },
    })
  },
  openDatePicker(this: HomePageInstance) {
    const pickerState = createMonthPickerState(this.data.selectedMonth)
    this.pickerSelection = [...pickerState.pickerValue]
    this.isPickerScrolling = false
    this.pendingPickerConfirmation = false
    this.setData({
      showDatePicker: true,
      ...pickerState,
    })
    setCustomTabBarHidden(this, true)
  },
  closeDatePicker(this: HomePageInstance) {
    this.isPickerScrolling = false
    this.pendingPickerConfirmation = false
    this.setData({ showDatePicker: false })
    setCustomTabBarHidden(this, false)
  },
  handleDatePickerStart(this: HomePageInstance) {
    this.isPickerScrolling = true
  },
  handleDatePickerEnd(this: HomePageInstance) {
    this.isPickerScrolling = false
    if (!this.pendingPickerConfirmation) {
      return
    }
    this.pendingPickerConfirmation = false
    setTimeout(() => this.confirmDatePicker(), 0)
  },
  handleDatePickerChange(this: HomePageInstance, e: WechatMiniprogram.CustomEvent<{ value?: number[] }>) {
    if (!Array.isArray(e.detail.value)) {
      return
    }
    const [yearIndex = 0, monthIndex = 0] = e.detail.value
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
  async confirmDatePicker(this: HomePageInstance) {
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
    await new Promise<void>((resolve) => {
      this.setData(
        {
          showDatePicker: false,
          selectedMonth,
          selectedMonthLabel: `${year}年${month}月`,
          recentRecordGroups: [],
        },
        resolve,
      )
    })
    setCustomTabBarHidden(this, false)
    await this.loadPageData(selectedMonth)
  },
  noop() {},
  pickerSelection: [0, 0],
  isPickerScrolling: false,
  pendingPickerConfirmation: false,
  shownAchievementCodes: new Set<string>(),
  unlockEffectTouchStartX: 0,
  goToAdd(e: WechatMiniprogram.BaseEvent) {
    const { type } = e.currentTarget.dataset as { type?: EntryType }
    const entryType = type === 'income' ? 'income' : 'expense'
    wx.navigateTo({
      url: `/pages/add/add?type=${entryType}`,
    })
  },
  initCustomHeader() {
    const systemInfo = getWindowInfo()
    const menuButton = wx.getMenuButtonBoundingClientRect()
    const statusBarHeight = systemInfo.statusBarHeight || 20
    const navBarHeight = (menuButton.top - statusBarHeight) * 2 + menuButton.height
    this.setData({
      statusBarHeight,
      navBarHeight,
      capsuleTop: menuButton.top,
      capsuleHeight: menuButton.height,
      capsuleWidth: menuButton.width,
      capsuleRight: systemInfo.windowWidth - menuButton.right,
    })
  },
  homeInitialized: false,
  loadPageDataVersion: 0,
})
