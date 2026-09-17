export type RequestMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
type RequestPayload = WechatMiniprogram.IAnyObject | string | ArrayBuffer
export type RequestConfig = {
  baseURL?: string
  timeout?: number
  tokenStorageKey?: string
  header?: WechatMiniprogram.IAnyObject
}
export type RequestOptions<TData extends RequestPayload = WechatMiniprogram.IAnyObject> = {
  url: string
  method?: RequestMethod
  data?: TData
  header?: WechatMiniprogram.IAnyObject
  timeout?: number
  skipToken?: boolean
}
export type ApiSuccessResponse<T = unknown> = {
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
const defaultConfig: Required<RequestConfig> = {
  baseURL: '',
  timeout: 15000,
  tokenStorageKey: 'bookkeeping_token',
  header: {
    'content-type': 'application/json',
  },
}
function joinUrl(baseURL: string, url: string) {
  const normalizedBaseURL = baseURL.trim()
  const normalizedRequestUrl = url.trim()
  if (!normalizedBaseURL) {
    return normalizedRequestUrl
  }
  if (/^https?:\/\//.test(normalizedRequestUrl)) {
    return normalizedRequestUrl
  }
  const sanitizedBaseURL = normalizedBaseURL.endsWith('/') ? normalizedBaseURL.slice(0, -1) : normalizedBaseURL
  const normalizedUrl = normalizedRequestUrl.startsWith('/') ? normalizedRequestUrl : `/${normalizedRequestUrl}`
  return `${sanitizedBaseURL}${normalizedUrl}`
}
function getToken(skipToken: boolean) {
  if (skipToken) {
    return ''
  }
  const token = wx.getStorageSync(defaultConfig.tokenStorageKey)
  return typeof token === 'string' ? token : ''
}
function createHeader(customHeader?: WechatMiniprogram.IAnyObject, skipToken = false) {
  const token = getToken(skipToken)
  const header: WechatMiniprogram.IAnyObject = {
    ...defaultConfig.header,
    ...customHeader,
  }
  if (token && !header.Authorization) {
    header.Authorization = `Bearer ${token}`
  }
  return header
}
function normalizeErrorMessage(error: unknown) {
  if (typeof error === 'string') {
    return error
  }
  if (error && typeof error === 'object' && 'errMsg' in error) {
    const errMsg = (error as { errMsg?: string }).errMsg
    if (errMsg) {
      return errMsg
    }
  }
  return '请求失败，请稍后重试'
}
function unwrapResponse<T>(response: WechatMiniprogram.RequestSuccessCallbackResult) {
  const { statusCode, data } = response
  if (statusCode < 200 || statusCode >= 300) {
    const result = data && typeof data === 'object' ? (data as ApiSuccessResponse<T>) : null
    throw new ApiError(
      (result && (result.message || result.msg)) || `HTTP ${statusCode}`,
      statusCode,
      result && typeof result.code === 'number' ? result.code : statusCode,
      result ? result.data : undefined,
    )
  }
  if (data && typeof data === 'object') {
    const result = data as ApiSuccessResponse<T>
    if (typeof result.code === 'number' && result.code !== 0 && result.code !== 200) {
      throw new ApiError(result.message || result.msg || '业务处理失败', statusCode, result.code, result.data)
    }
    if ('data' in result) {
      if (typeof result.data === 'undefined' || result.data === null) {
        return {} as T
      }
      return result.data as T
    }
  }
  return data as T
}
export function configureRequest(config: RequestConfig) {
  if (typeof config.baseURL === 'string') {
    defaultConfig.baseURL = config.baseURL.trim()
  }
  if (typeof config.timeout === 'number') {
    defaultConfig.timeout = config.timeout
  }
  if (typeof config.tokenStorageKey === 'string' && config.tokenStorageKey) {
    defaultConfig.tokenStorageKey = config.tokenStorageKey
  }
  if (config.header) {
    defaultConfig.header = {
      ...defaultConfig.header,
      ...config.header,
    }
  }
}
export function request<T = unknown, TData extends RequestPayload = WechatMiniprogram.IAnyObject>(
  options: RequestOptions<TData>,
) {
  const { url, method = 'GET', data, header, timeout = defaultConfig.timeout, skipToken = false } = options
  const requestMethod: WechatMiniprogram.RequestOption['method'] = method === 'PATCH' ? 'POST' : method
  const requestHeader = createHeader(header, skipToken)
  if (method === 'PATCH') {
    requestHeader['X-HTTP-Method-Override'] = 'PATCH'
  }
  return new Promise<T>((resolve, reject) => {
    wx.request({
      url: joinUrl(defaultConfig.baseURL, url),
      method: requestMethod,
      data,
      timeout,
      header: requestHeader,
      success(response) {
        try {
          resolve(unwrapResponse<T>(response))
        } catch (error) {
          reject(error)
        }
      },
      fail(error) {
        reject(new ApiError(normalizeErrorMessage(error)))
      },
    })
  })
}
export function get<T = unknown, TData extends RequestPayload = WechatMiniprogram.IAnyObject>(
  url: string,
  data?: TData,
  options?: Omit<RequestOptions<TData>, 'url' | 'method' | 'data'>,
) {
  return request<T, TData>({
    ...options,
    url,
    method: 'GET',
    data,
  })
}
export function post<T = unknown, TData extends RequestPayload = WechatMiniprogram.IAnyObject>(
  url: string,
  data?: TData,
  options?: Omit<RequestOptions<TData>, 'url' | 'method' | 'data'>,
) {
  return request<T, TData>({
    ...options,
    url,
    method: 'POST',
    data,
  })
}
export function put<T = unknown, TData extends RequestPayload = WechatMiniprogram.IAnyObject>(
  url: string,
  data?: TData,
  options?: Omit<RequestOptions<TData>, 'url' | 'method' | 'data'>,
) {
  return request<T, TData>({
    ...options,
    url,
    method: 'PUT',
    data,
  })
}
export function del<T = unknown, TData extends RequestPayload = WechatMiniprogram.IAnyObject>(
  url: string,
  data?: TData,
  options?: Omit<RequestOptions<TData>, 'url' | 'method' | 'data'>,
) {
  return request<T, TData>({
    ...options,
    url,
    method: 'DELETE',
    data,
  })
}
export function patch<T = unknown, TData extends RequestPayload = WechatMiniprogram.IAnyObject>(
  url: string,
  data?: TData,
  options?: Omit<RequestOptions<TData>, 'url' | 'method' | 'data'>,
) {
  return request<T, TData>({
    ...options,
    url,
    method: 'PATCH',
    data,
  })
}
