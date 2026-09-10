export type RequestMethod = 'GET' | 'POST'

type RequestPayload = WechatMiniprogram.IAnyObject | string | ArrayBuffer

export type RequestOptions<TData extends RequestPayload = WechatMiniprogram.IAnyObject> = {
  url: string
  method?: RequestMethod
  data?: TData
  header?: WechatMiniprogram.IAnyObject
  timeout?: number
}

type ApiResponse<T> = {
  code?: number
  message?: string
  msg?: string
  data?: T
}

export class ApiError extends Error {
  statusCode: number
  code: number
  data: unknown

  constructor(message: string, statusCode = 0, code = statusCode, data: unknown = null) {
    super(message)
    this.name = 'ApiError'
    this.statusCode = statusCode
    this.code = code
    this.data = data
  }
}

const requestConfig = {
  baseURL: '',
  timeout: 15000,
}

function joinUrl(baseURL: string, url: string) {
  const normalizedBaseURL = baseURL.trim()
  const normalizedUrl = url.trim()
  if (!normalizedBaseURL || /^https?:\/\//.test(normalizedUrl)) {
    return normalizedUrl
  }
  return `${normalizedBaseURL.replace(/\/$/, '')}/${normalizedUrl.replace(/^\//, '')}`
}

function getErrorMessage(error: unknown) {
  if (typeof error === 'string') {
    return error
  }
  if (error && typeof error === 'object' && 'errMsg' in error) {
    return (error as { errMsg?: string }).errMsg || '请求失败，请稍后重试'
  }
  return '请求失败，请稍后重试'
}

function unwrapResponse<T>(response: WechatMiniprogram.RequestSuccessCallbackResult) {
  const { statusCode, data } = response
  if (statusCode < 200 || statusCode >= 300) {
    const result = data && typeof data === 'object' ? data as ApiResponse<T> : undefined
    throw new ApiError(
      result?.message || result?.msg || `HTTP ${statusCode}`,
      statusCode,
      typeof result?.code === 'number' ? result.code : statusCode,
      result?.data,
    )
  }

  if (data && typeof data === 'object' && 'code' in data) {
    const result = data as ApiResponse<T>
    if (typeof result.code === 'number' && result.code !== 0 && result.code !== 200) {
      throw new ApiError(
        result.message || result.msg || '业务处理失败',
        statusCode,
        result.code,
        result.data,
      )
    }
    if ('data' in result) {
      return (typeof result.data === 'undefined' || result.data === null ? {} : result.data) as T
    }
  }

  return data as T
}

export function configureRequest(baseURL: string) {
  requestConfig.baseURL = baseURL.trim()
}

export function request<T = unknown, TData extends RequestPayload = WechatMiniprogram.IAnyObject>(
  options: RequestOptions<TData>,
) {
  const {
    url,
    method = 'GET',
    data,
    header,
    timeout = requestConfig.timeout,
  } = options

  return new Promise<T>((resolve, reject) => {
    wx.request({
      url: joinUrl(requestConfig.baseURL, url),
      method,
      data,
      timeout,
      header: {
        'content-type': 'application/json',
        ...header,
      },
      success(response) {
        try {
          resolve(unwrapResponse<T>(response))
        } catch (error) {
          reject(error)
        }
      },
      fail(error) {
        reject(new ApiError(getErrorMessage(error)))
      },
    })
  })
}

export function post<T = unknown, TData extends RequestPayload = WechatMiniprogram.IAnyObject>(
  url: string,
  data?: TData,
) {
  return request<T, TData>({ url, method: 'POST', data })
}
