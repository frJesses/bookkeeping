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
    if (this.isPickingImages) {
      return
    }
    this.isPickingImages = true
    const remaining = Math.max(1, this.data.maxImages - this.data.images.length)
    const appendImages = (paths: string[]) => {
      const nextImages = [...this.data.images, ...paths.filter(Boolean)].slice(0, this.data.maxImages)
      this.setData({ images: nextImages })
    }
    const finishPicking = () => {
      this.isPickingImages = false
    }
    const chooseFromChat = () => {
      if (typeof wx.chooseMessageFile !== 'function') {
        finishPicking()
        wx.showToast({ title: '当前微信版本不支持选择图片', icon: 'none' })
        return
      }
      wx.chooseMessageFile({
        count: remaining,
        type: 'image',
        success: (result) => {
          appendImages(result.tempFiles.map((file) => file.path))
        },
        fail: (error) => {
          const message = error && error.errMsg ? error.errMsg : ''
          if (!message.includes('cancel')) {
            console.error('choose feedback image from chat failed', error)
            wx.showToast({ title: '选择图片失败，请重试', icon: 'none' })
          }
        },
        complete: finishPicking,
      })
    }
    const handleFail = (error: WechatMiniprogram.GeneralCallbackResult) => {
      const message = error && error.errMsg ? error.errMsg : ''
      if (message.includes('cancel')) {
        finishPicking()
        return
      }
      console.error('choose feedback image failed', error)
      const needAuth = message.includes('auth') || message.includes('deny') || message.includes('permission')
      wx.showModal({
        title: needAuth ? '需要相册权限' : '无法打开相册',
        content: needAuth
          ? '可以开启相册权限后重试，也可以改为从聊天记录中选择图片。'
          : '可以改为从聊天记录中选择图片作为反馈附件。',
        confirmText: '聊天记录选择',
        cancelText: '取消',
        success: (result) => {
          if (result.confirm) {
            chooseFromChat()
            return
          }
          finishPicking()
        },
        fail: finishPicking,
      })
    }
    if (typeof wx.chooseMedia === 'function') {
      wx.chooseMedia({
        count: remaining,
        mediaType: ['image'],
        sizeType: ['compressed'],
        sourceType: ['album', 'camera'],
        success: (result) => {
          appendImages(result.tempFiles.map((file) => file.tempFilePath))
          finishPicking()
        },
        fail: handleFail,
      })
      return
    }
    if (typeof wx.chooseImage === 'function') {
      wx.chooseImage({
        count: remaining,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera'],
        success: (result) => {
          appendImages(result.tempFilePaths)
          finishPicking()
        },
        fail: handleFail,
      })
      return
    }
    finishPicking()
    wx.showToast({ title: '当前微信版本不支持选择图片', icon: 'none' })
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
  isPickingImages: false,
})
