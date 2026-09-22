import type { HomeRecordItem } from '../../services/home'
import { getWindowInfo } from '../../utils/system-info'

type SwipeRowInternalInstance = WechatMiniprogram.Component.TrivialInstance & {
  data: {
    record: HomeRecordItem
    iconSource: string
    offsetRpx: number
    isDragging: boolean
  }
  startClientX: number
  startClientY: number
  startOffsetRpx: number
  isHorizontalGesture: boolean
  viewportWidth: number
  close: () => void
}

const ACTION_WIDTH_RPX = 108
const ACTION_GAP_RPX = 20
const REVEAL_WIDTH_RPX = ACTION_WIDTH_RPX + ACTION_GAP_RPX

Component({
  properties: {
    record: {
      type: Object,
      value: {} as HomeRecordItem,
      observer(this: SwipeRowInternalInstance, value: WechatMiniprogram.IAnyObject) {
        const record = value as HomeRecordItem
        this.setData({
          iconSource: record.iconUrl || record.fallbackIconUrl || '',
          offsetRpx: 0,
        })
      },
    },
  },
  data: {
    iconSource: '',
    offsetRpx: 0,
    isDragging: false,
  },
  methods: {
    handleTouchStart(this: SwipeRowInternalInstance, event: WechatMiniprogram.TouchEvent) {
      const touch = event.touches[0]
      if (!touch) {
        return
      }
      this.startClientX = touch.clientX
      this.startClientY = touch.clientY
      this.startOffsetRpx = this.data.offsetRpx
      this.isHorizontalGesture = false
    },
    handleTouchMove(this: SwipeRowInternalInstance, event: WechatMiniprogram.TouchEvent) {
      const touch = event.touches[0]
      if (!touch) {
        return
      }
      const deltaX = touch.clientX - this.startClientX
      const deltaY = touch.clientY - this.startClientY
      if (!this.isHorizontalGesture && Math.abs(deltaY) >= Math.abs(deltaX)) {
        return
      }
      if (Math.abs(deltaX) > 6) {
        this.isHorizontalGesture = true
      }
      if (!this.isHorizontalGesture) {
        return
      }
      const deltaRpx = (deltaX * 750) / this.viewportWidth
      const offsetRpx = Math.max(-REVEAL_WIDTH_RPX, Math.min(0, this.startOffsetRpx + deltaRpx))
      this.setData({ offsetRpx, isDragging: true })
    },
    handleTouchEnd(this: SwipeRowInternalInstance) {
      if (!this.isHorizontalGesture) {
        return
      }
      const isOpen = this.data.offsetRpx <= -REVEAL_WIDTH_RPX / 2
      this.setData({
        offsetRpx: isOpen ? -REVEAL_WIDTH_RPX : 0,
        isDragging: false,
      })
      if (isOpen) {
        this.triggerEvent('open', { id: this.data.record.id })
      }
    },
    close(this: SwipeRowInternalInstance) {
      if (this.data.offsetRpx !== 0 || this.data.isDragging) {
        this.setData({ offsetRpx: 0, isDragging: false })
      }
    },
    handleTap(this: SwipeRowInternalInstance) {
      this.close()
      this.triggerEvent('edit', { record: this.data.record })
    },
    handleDelete(this: SwipeRowInternalInstance) {
      this.close()
      this.triggerEvent('delete', { record: this.data.record })
    },
    handleIconError(this: SwipeRowInternalInstance) {
      if (this.data.record.fallbackIconUrl && this.data.iconSource !== this.data.record.fallbackIconUrl) {
        this.setData({ iconSource: this.data.record.fallbackIconUrl })
      }
    },
  },
  lifetimes: {
    created(this: SwipeRowInternalInstance) {
      this.startClientX = 0
      this.startClientY = 0
      this.startOffsetRpx = 0
      this.isHorizontalGesture = false
      this.viewportWidth = getWindowInfo().windowWidth || 375
    },
  },
})
