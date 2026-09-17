import { submitFeedback, uploadFeedbackImage, type FeedbackType } from '../../services/feedback'
import { getWindowInfo } from '../../utils/system-info'

const FEEDBACK_TYPES: Array<{ label: string; value: FeedbackType }> = [
  { label: '功能建议', value: 'feature' },
  { label: '操作体验', value: 'experience' },
  { label: '卡顿/闪退', value: 'crash' },
  { label: '其它反馈', value: 'other' },
]

Page({
  data: {
    statusBarHeight: 20,
    types: FEEDBACK_TYPES,
    activeType: 'other' as FeedbackType,
    description: '',
    contact: '',
    images: [] as string[],
    maxImages: 3,
    isSubmitting: false,
  },
  onLoad() {
    this.setData({ statusBarHeight: getWindowInfo().statusBarHeight || 20 })
  },
  goBack() {
    wx.navigateBack()
  },
  selectType(e: WechatMiniprogram.BaseEvent) {
    const type = e.currentTarget.dataset.type as FeedbackType | undefined
    if (type) this.setData({ activeType: type })
  },
  handleDescription(e: WechatMiniprogram.CustomEvent<{ value?: string }>) {
    this.setData({ description: e.detail.value || '' })
  },
  handleContact(e: WechatMiniprogram.CustomEvent<{ value?: string }>) {
    this.setData({ contact: e.detail.value || '' })
  },
  chooseImages() {
    const count = Math.max(1, this.data.maxImages - this.data.images.length)
    wx.chooseImage({
      count,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (result) => {
        const selected = [...this.data.images, ...result.tempFilePaths].slice(0, this.data.maxImages)
        this.setData({ images: selected })
      },
    })
  },
  removeImage(e: WechatMiniprogram.BaseEvent) {
    const index = Number(e.currentTarget.dataset.index)
    if (!Number.isInteger(index) || index < 0) return
    this.setData({ images: this.data.images.filter((_, itemIndex) => itemIndex !== index) })
  },
  previewImage(e: WechatMiniprogram.BaseEvent) {
    const current = String(e.currentTarget.dataset.url || '')
    if (!current) return
    wx.previewImage({ current, urls: this.data.images })
  },
  async submit() {
    const description = this.data.description.trim()
    if (description.length < 10) {
      wx.showToast({ title: '请至少输入10个字', icon: 'none' })
      return
    }
    if (this.data.isSubmitting) return

    this.setData({ isSubmitting: true })
    try {
      const imageUrls: string[] = []
      for (const image of this.data.images) {
        imageUrls.push(await uploadFeedbackImage(image))
      }
      await submitFeedback({
        feedbackType: this.data.activeType,
        description,
        contact: this.data.contact.trim(),
        images: imageUrls,
      })
      wx.showToast({ title: '提交成功', icon: 'success' })
      setTimeout(() => wx.navigateBack(), 700)
    } catch (error) {
      console.error('submit feedback failed', error)
      wx.showToast({ title: '提交失败，请稍后重试', icon: 'none' })
    } finally {
      this.setData({ isSubmitting: false })
    }
  },
})
