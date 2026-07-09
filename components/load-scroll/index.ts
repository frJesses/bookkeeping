type FetchMethod = (params?: Record<string, unknown>) => Promise<unknown>
type PageResult<T = unknown> = {
  list: T[]
  total: number
  raw: unknown
}
type LoadScrollData = {
  refreshing: boolean
  loading: boolean
  finished: boolean
  empty: boolean
  error: boolean
  errorAppend: boolean
  resolvedErrorText: string
  resolvedEmptyText: string
  queryInfo: {
    pageNo: number
    pageSize: number
  }
  pageSize: number
  delay: number
  emptyButtonText: string
  emptyText: string
  errorButtonText: string
  errorText: string
}
type LoadScrollInstance = WechatMiniprogram.Component.TrivialInstance & {
  data: LoadScrollData
  fetchMethods?: FetchMethod | null
  parameters?: Record<string, unknown>
  resultList?: unknown[]
}
const EMPTY_TEXT_OPTIONS = [
  '这里先空着，等你写下第一笔。',
  '还没有内容，去留下今天的记录吧。',
  '暂时空空如也，点一下开始补充。',
  '还没攒下数据，先去新增一条试试。',
]
Component({
  options: {
    multipleSlots: true,
  },
  properties: {
    height: {
      type: String,
      value: '100%',
    },
    pageSize: {
      type: Number,
      value: 10,
    },
    finishedText: {
      type: String,
      value: '我也是有底线的～',
    },
    emptyText: {
      type: String,
      value: '暂无数据',
    },
    emptyButtonText: {
      type: String,
      value: '',
    },
    errorText: {
      type: String,
      value: '加载失败，请稍后重试',
    },
    errorButtonText: {
      type: String,
      value: '重新加载',
    },
    delay: {
      type: Number,
      value: 0,
    }
  },
  data: {
    refreshing: false,
    loading: false,
    finished: false,
    empty: false,
    error: false,
    errorAppend: false,
    resolvedErrorText: '',
    resolvedEmptyText: '',
    queryInfo: {
      pageNo: 1,
      pageSize: 10,
    },
  },
  lifetimes: {
    attached() {
      const randomIndex = Math.floor(Math.random() * EMPTY_TEXT_OPTIONS.length)
      this.setData({
        resolvedEmptyText: this.data.emptyText || EMPTY_TEXT_OPTIONS[randomIndex] || '暂无数据',
        resolvedErrorText: this.data.errorText || '加载失败，请稍后重试',
        queryInfo: {
          pageNo: 1,
          pageSize: this.data.pageSize,
        },
      })
    },
  },
  methods: {
    /** 初始化加载 */
    async initLoad(fetchMethods: FetchMethod, params: Record<string, unknown> = {}) {
      await this.initData(fetchMethods, params)
    },
    /** 初始化数据 @param {Function} fetchMethods - 请求方法 @param {Object} params - 请求参数 */
    async initData(fetchMethods: FetchMethod, params: Record<string, unknown> = {}) {
      await this._runLoad(fetchMethods, params, false)
    },
    async _runLoad(fetchMethods: FetchMethod, params: Record<string, unknown> = {}, refreshing = false) {
      const instance = this as LoadScrollInstance
      if (typeof fetchMethods !== 'function') {
        throw new Error('fetchMethods must be a function')
      }
      const pageNo = 1
      const pageSize = instance.data.pageSize
      const parameters = {
        pageNo,
        pageSize,
        ...params,
      }
      instance.fetchMethods = fetchMethods
      instance.parameters = params
      instance.resultList = []
      instance.setData({
        queryInfo: {
          pageNo,
          pageSize,
        },
        finished: false,
        empty: false,
        error: false,
        errorAppend: false,
        resolvedEmptyText: instance.data.emptyText || instance.data.resolvedEmptyText,
        resolvedErrorText: instance.data.errorText || instance.data.resolvedErrorText,
      })
      await instance._setLoadingState(true, refreshing)
      try {
        const res = await fetchMethods(parameters)
        await instance._waitDelay()
        instance._applyResult(res, false)
      } catch (error) {
        instance._handleError(error, false)
      }
    },
    async handleRefresherRefresh() {
      const instance = this as LoadScrollInstance
      if (!instance.fetchMethods) {
        return
      }
      await instance._runLoad(instance.fetchMethods, instance.parameters, true)
    },
    async handleScrollToLower() {
      const instance = this as LoadScrollInstance
      if (!instance.fetchMethods || instance.data.loading || instance.data.finished || instance.data.empty || instance.data.error) {
        return
      }
      const nextPageNo = instance.data.queryInfo.pageNo + 1
      const parameters = {
        pageNo: nextPageNo,
        pageSize: instance.data.queryInfo.pageSize,
        ...instance.parameters,
      }
      await instance._setLoadingState(true, false)
      try {
        const res = await instance.fetchMethods(parameters)
        await instance._waitDelay()
        instance.setData({
          queryInfo: {
            pageNo: nextPageNo,
            pageSize: instance.data.queryInfo.pageSize,
          },
        })
        instance._applyResult(res, true)
      } catch (error) {
        instance._handleError(error, true)
      }
    },
    handleScroll(e: WechatMiniprogram.ScrollViewScroll) {
      this.triggerEvent('scroll', e.detail)
    },
    handleEmptyAction() {
      this.triggerEvent('emptyaction', {
        text: this.data.emptyButtonText,
      })
    },
    handleErrorRetry() {
      const instance = this as LoadScrollInstance
      if (!instance.fetchMethods) {
        return
      }
      const retryAppend = Boolean(instance.data.errorAppend)
      instance.setData({
        error: false,
        errorAppend: false,
      }, () => {
        if (retryAppend) {
          void instance.handleScrollToLower()
          return
        }
        void instance.initData(instance.fetchMethods as FetchMethod, instance.parameters || {})
      })
    },
    getList<T = unknown>() {
      const instance = this as LoadScrollInstance
      return ((instance.resultList || []) as unknown) as T[]
    },
    _normalizeResult<T = unknown>(res: unknown): PageResult<T> {
      if (Array.isArray(res)) {
        return {
          list: res as T[],
          total: res.length,
          raw: res,
        }
      }
      if (res && typeof res === 'object') {
        const target = res as {
          data?: unknown[] | { data?: unknown[]; total?: number }
          total?: number
        }
        if (Array.isArray(target.data)) {
          return {
            list: target.data as T[],
            total: typeof target.total === 'number' ? target.total : target.data.length,
            raw: res,
          }
        }
        if (target.data && typeof target.data === 'object') {
          const nested = target.data as { data?: unknown[]; total?: number }
          if (Array.isArray(nested.data)) {
            return {
              list: nested.data as T[],
              total: typeof nested.total === 'number' ? nested.total : nested.data.length,
              raw: res,
            }
          }
        }
      }
      return {
        list: [],
        total: 0,
        raw: res,
      }
    },
    _applyResult(res: unknown, append: boolean) {
      const instance = this as LoadScrollInstance
      const normalized = this._normalizeResult(res)
      const nextList = append ? (instance.resultList || []).concat(normalized.list) : normalized.list
      const total = normalized.total
      const finished = total > 0 ? nextList.length >= total : normalized.list.length < instance.data.queryInfo.pageSize
      const empty = nextList.length === 0
      instance.resultList = nextList
      instance.setData({
        loading: false,
        refreshing: false,
        finished,
        empty,
        error: false,
        errorAppend: false,
      })
      this.triggerEvent('loaded', {
        list: nextList,
        total,
        finished,
        empty,
        raw: normalized.raw,
        append,
      })
    },
    async _setLoadingState(loading: boolean, refreshing: boolean) {
      this.setData({
        loading,
        refreshing,
      })
    },
    async _waitDelay() {
      const delay = typeof this.data.delay === 'number' ? this.data.delay : 0
      if (delay <= 0) {
        return
      }
      await new Promise<void>((resolve) => {
        setTimeout(() => {
          resolve()
        }, delay)
      })
    },
    _handleError(error?: unknown, append = false) {
      const instance = this as LoadScrollInstance
      const hasLoadedList = Array.isArray(instance.resultList) && instance.resultList.length > 0
      this.setData({
        loading: false,
        refreshing: false,
        empty: false,
        error: true,
        errorAppend: append && hasLoadedList,
        resolvedErrorText: this.data.errorText || this.data.resolvedErrorText,
      })
      this.triggerEvent('error', {
        error,
        append,
      })
    },
  },
})
