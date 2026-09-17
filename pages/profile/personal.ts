import {
  fetchCurrentUserInfo,
  uploadCurrentUserAvatar,
  updateCurrentUserInfo,
  type UserProfileUpdate,
} from '../../services/profile'
import { getWindowInfo } from '../../utils/system-info'

const GENDER_LABELS: Record<string, string> = {
  '0': '未知',
  '1': '男',
  '2': '女',
  '3': '保密',
}

const GENDER_CODES: Record<string, string> = {
  未知: '0',
  男: '1',
  女: '2',
  保密: '3',
}

type PersonalPageInstance = WechatMiniprogram.Page.Instance<
  WechatMiniprogram.IAnyObject,
  WechatMiniprogram.IAnyObject
> & {
  data: {
    statusBarHeight: number
    avatarUrl: string
    avatarText: string
    nickname: string
    gender: string
    genderCode: string
    phone: string
    email: string
    showGender: boolean
    isLoading: boolean
    isSaving: boolean
  }
}

function getAvatarText(name: string) {
  const value = name.trim()
  return value ? value.slice(0, 2).toUpperCase() : '我'
}

Page({
  data: {
    statusBarHeight: 20,
    avatarUrl: '',
    avatarText: '我',
    nickname: '',
    gender: '保密',
    genderCode: '3',
    phone: '',
    email: '',
    showGender: false,
    isLoading: true,
    isSaving: false,
  },
  onLoad(this: PersonalPageInstance) {
    this.setData({
      statusBarHeight: getWindowInfo().statusBarHeight || 20,
    })
    void this.loadUserInfo()
  },
  async loadUserInfo(this: PersonalPageInstance) {
    this.setData({ isLoading: true })
    try {
      const data = await fetchCurrentUserInfo()
      if (!data) {
        throw new Error('用户信息不存在')
      }
      const nickname = data.userName || data.account || '未命名用户'
      const genderCode = String(data.gender || '3')
      this.setData({
        avatarUrl: data.avatar || '',
        avatarText: getAvatarText(nickname),
        nickname,
        genderCode,
        gender: GENDER_LABELS[genderCode] || '保密',
        email: data.email || '',
        isLoading: false,
      })
    } catch (error) {
      console.error('load personal user info failed', error)
      this.setData({ isLoading: false })
      wx.showToast({ title: '用户信息加载失败', icon: 'none' })
    }
  },
  async saveProfile(this: PersonalPageInstance, update: UserProfileUpdate) {
    if (this.data.isSaving || !Object.keys(update).length) {
      return
    }
    this.setData({ isSaving: true })
    try {
      await updateCurrentUserInfo(update)
      wx.showToast({ title: '已保存', icon: 'success' })
    } catch (error) {
      console.error('update personal user info failed', error)
      wx.showToast({ title: '保存失败，请重试', icon: 'none' })
    } finally {
      this.setData({ isSaving: false })
    }
  },
  goBack() {
    wx.navigateBack()
  },
  async handleChooseAvatar(this: PersonalPageInstance, e: WechatMiniprogram.CustomEvent<{ avatarUrl?: string }>) {
    const avatarUrl = e.detail.avatarUrl ? e.detail.avatarUrl.trim() : ''
    if (!avatarUrl || this.data.isSaving) {
      return
    }
    this.setData({ isSaving: true })
    try {
      const permanentAvatarUrl = await uploadCurrentUserAvatar(avatarUrl)
      await updateCurrentUserInfo({ avatar: permanentAvatarUrl })
      this.setData({ avatarUrl: permanentAvatarUrl, avatarText: '' })
      wx.showToast({ title: '头像已保存', icon: 'success' })
    } catch (error) {
      console.error('upload personal avatar failed', error)
      wx.showToast({ title: '头像上传失败，请重试', icon: 'none' })
    } finally {
      this.setData({ isSaving: false })
    }
  },
  editNickname(this: PersonalPageInstance) {
    wx.showModal({
      title: '修改昵称',
      editable: true,
      content: this.data.nickname,
      placeholderText: '请输入昵称',
      confirmText: '保存',
      success: (result) => {
        if (!result.confirm) {
          return
        }
        const nickname = (result.content || '').trim()
        if (!nickname) {
          wx.showToast({ title: '昵称不能为空', icon: 'none' })
          return
        }
        this.setData({ nickname, avatarText: getAvatarText(nickname) })
        void this.saveProfile({ userName: nickname })
      },
    })
  },
  openGender(this: PersonalPageInstance) {
    this.setData({ showGender: true })
  },
  closeGender(this: PersonalPageInstance) {
    this.setData({ showGender: false })
  },
  chooseGender(this: PersonalPageInstance, e: WechatMiniprogram.BaseEvent) {
    const label = String(e.currentTarget.dataset.gender || '')
    const genderCode = GENDER_CODES[label]
    if (!genderCode) {
      return
    }
    this.setData({ gender: label, genderCode, showGender: false })
    void this.saveProfile({ gender: genderCode })
  },
  noop() {},
})
