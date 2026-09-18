import { ensureOpenId } from './auth'
import { getApiBaseURL } from '../config/index'
import { post, type ApiSuccessResponse } from './request'

export type ImportRow = {
  rowNumber: number
  date: string
  type: 'expense' | 'income'
  categoryName: string
  amount: string
  remark: string
  errors: string[]
  categoryId?: string | number
  id?: string
  title?: string
}

export type ImportPreview = {
  total: number
  validCount: number
  invalidCount: number
  rows: ImportRow[]
}

export async function previewImport(filePath: string): Promise<ImportPreview> {
  const openId = await ensureOpenId()
  return new Promise<ImportPreview>((resolve, reject) => {
    wx.uploadFile({
      url: `${getApiBaseURL()}/frontend/bookkeeping/import/preview`,
      filePath,
      name: 'file',
      formData: { openId },
      success(response) {
        try {
          if (response.statusCode < 200 || response.statusCode >= 300) throw new Error(`HTTP ${response.statusCode}`)
          const result = JSON.parse(response.data) as ApiSuccessResponse<ImportPreview>
          if (typeof result.code === 'number' && result.code !== 0 && result.code !== 200) {
            throw new Error(result.message || result.msg || '账单预览失败')
          }
          if (!result.data) throw new Error('账单预览结果为空')
          resolve(result.data)
        } catch (error) {
          reject(error)
        }
      },
      fail: reject,
    })
  })
}

export async function confirmImport(rows: ImportRow[]) {
  const openId = await ensureOpenId()
  return post<{ importedCount: number; duplicateCount: number }>(
    '/frontend/bookkeeping/import/confirm',
    { openId, rows },
    { skipToken: true },
  )
}
