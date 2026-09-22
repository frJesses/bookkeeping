export type PagedScrollRequest = Record<string, unknown> & {
  pageNo: number
  pageSize: number
}

export type PagedScrollResult<T = unknown> = {
  data: T[]
  total?: number
  current?: number
  totalPage?: number
  hasMore?: boolean
}

export type PagedScrollFetchMethod<T = unknown> = (params: PagedScrollRequest) => Promise<PagedScrollResult<T>>

export type PagedScrollInstance = WechatMiniprogram.Component.TrivialInstance & {
  initLoad: <T = unknown>(fetchMethod: PagedScrollFetchMethod<T>, params?: Record<string, unknown>) => Promise<void>
  refresh: () => Promise<void>
  getList: <T = unknown>() => T[]
}

type LoadMode = 'initial' | 'refresh' | 'more'
type PagedScrollInternalInstance = PagedScrollInstance & {
  fetchMethod?: PagedScrollFetchMethod
  requestParams: Record<string, unknown>
  requestVersion: number
  loadPage: (pageNo: number, mode: LoadMode, requestVersion: number) => Promise<void>
}

function resolveHasMore(result: PagedScrollResult, pageNo: number, pageSize: number) {
  if (typeof result.hasMore === 'boolean') {
    return result.hasMore
  }
  if (typeof result.totalPage === 'number') {
    return pageNo < result.totalPage
  }
  if (typeof result.total === 'number') {
    return pageNo * pageSize < result.total
  }
  return result.data.length >= pageSize
}

Component({
  properties: {
    bottomSpace: {
      type: Number,
      value: 0,
    },
  },
  data: {
    list: [] as unknown[],
    status: 'idle' as 'idle' | 'loading' | 'ready' | 'empty' | 'error',
    pageNo: 1,
    pageSize: 10,
    hasMore: false,
    isRefreshing: false,
    isLoadingMore: false,
  },
  methods: {
    async initLoad<T = unknown>(
      this: PagedScrollInternalInstance,
      fetchMethod: PagedScrollFetchMethod<T>,
      params: Record<string, unknown> = {},
    ) {
      if (typeof fetchMethod !== 'function') {
        throw new Error('fetchMethod must be a function')
      }
      const pageSize = typeof params.pageSize === 'number' ? params.pageSize : 10
      this.fetchMethod = fetchMethod as PagedScrollFetchMethod
      this.requestParams = { ...params, pageSize }
      this.requestVersion = (this.requestVersion || 0) + 1
      this.setData({ pageSize })
      await this.loadPage(1, 'initial', this.requestVersion)
    },
    async refresh(this: PagedScrollInternalInstance) {
      if (!this.fetchMethod) {
        return
      }
      this.requestVersion = (this.requestVersion || 0) + 1
      await this.loadPage(1, 'refresh', this.requestVersion)
    },
    async loadPage(this: PagedScrollInternalInstance, pageNo: number, mode: LoadMode, requestVersion: number) {
      if (!this.fetchMethod) {
        return
      }
      if (mode === 'initial') {
        this.setData({ list: [], status: 'loading', hasMore: false })
        this.triggerEvent('change', { list: [] })
      } else if (mode === 'refresh') {
        this.setData({ isRefreshing: true, status: 'loading' })
      } else {
        this.setData({ isLoadingMore: true })
      }

      try {
        const result = await this.fetchMethod({
          ...this.requestParams,
          pageNo,
          pageSize: this.data.pageSize,
        })
        if (requestVersion !== this.requestVersion) {
          return
        }
        if (!result || !Array.isArray(result.data)) {
          throw new Error('invalid paged response')
        }
        const nextList = pageNo === 1 ? result.data : this.data.list.concat(result.data)
        const hasMore = resolveHasMore(result, pageNo, this.data.pageSize)
        this.setData({
          list: nextList,
          status: nextList.length ? 'ready' : 'empty',
          pageNo,
          hasMore,
          isRefreshing: false,
          isLoadingMore: false,
        })
        this.triggerEvent('change', { list: nextList })
        if (mode === 'refresh') {
          this.triggerEvent('refresh')
        }
      } catch (error) {
        if (requestVersion !== this.requestVersion) {
          return
        }
        console.error('load paged data failed', error)
        if (mode === 'more') {
          this.setData({ isLoadingMore: false })
          wx.showToast({ title: '加载失败，请稍后重试', icon: 'none' })
          return
        }
        this.setData({
          list: [],
          status: 'error',
          hasMore: false,
          isRefreshing: false,
          isLoadingMore: false,
        })
        this.triggerEvent('change', { list: [] })
      }
    },
    handleRefresh(this: PagedScrollInternalInstance) {
      void this.refresh()
    },
    handleLoadMore(this: PagedScrollInternalInstance) {
      if (!this.fetchMethod || !this.data.hasMore || this.data.isLoadingMore) {
        return
      }
      void this.loadPage(this.data.pageNo + 1, 'more', this.requestVersion)
    },
    handleRetry(this: PagedScrollInternalInstance) {
      void this.refresh()
    },
    getList<T = unknown>(this: PagedScrollInternalInstance) {
      return this.data.list as T[]
    },
  },
  lifetimes: {
    created(this: PagedScrollInternalInstance) {
      this.requestParams = {}
      this.requestVersion = 0
    },
  },
})
