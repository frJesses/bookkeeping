import { ensureOpenId } from './auth'
import { getApiBaseURL } from '../config/index'
import { post, type ApiSuccessResponse } from './request'

export type FeedbackType = 'feature' | 'experience' | 'crash' | 'other'

export type FeedbackPayload = {
  feedbackType: FeedbackType
  description: string
  contact?: string
  images?: string[]
}

export async function uploadFeedbackImage(filePath: string) {
  const openId = await ensureOpenId()
  return new Promise<string>((resolve, reject) => {
    wx.uploadFile({
      url: `${getApiBaseURL()}/frontend/bookkeeping/feedback/upload`,
      filePath,
      name: 'file',
      formData: { openId },
      success(response) {
        try {
          if (response.statusCode < 200 || response.statusCode >= 300) {
            throw new Error(`HTTP ${response.statusCode}`)
          }
          const result = JSON.parse(response.data) as ApiSuccessResponse<{ url?: string }>
          if (typeof result.code === 'number' && result.code !== 0 && result.code !== 200) {
            throw new Error(result.message || result.msg || '图片上传失败')
          }
          const url = result.data ? result.data.url : undefined
          if (!url) throw new Error('图片上传地址为空')
          resolve(url)
        } catch (error) {
          reject(error)
        }
      },
      fail: reject,
    })
  })
}

export async function submitFeedback(payload: FeedbackPayload) {
  const openId = await ensureOpenId()
  return post<{ id: string; status: string }>(
    '/frontend/bookkeeping/feedback/create',
    { openId, ...payload },
    { skipToken: true },
  )
}
