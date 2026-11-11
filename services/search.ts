import { SETTINGS_CATEGORY_NAME, type RecordType } from '../constants/add'
import { getCategoryOptions, type AddCategoryItem } from './add'
import { ensureOpenId } from './auth'
import type { HomeRecentRecordDTO } from './home'
import { get } from './request'

export type SearchType = 'all' | RecordType

export type SearchQuery = {
  month: string
  type: SearchType
  categoryId: string
  keyword: string
}

export type SearchCategoryOption = AddCategoryItem & {
  type: RecordType
}

export type SearchResult = {
  records: HomeRecentRecordDTO[]
  fetchedCount: number
  truncated: boolean
}

export type SearchSummary = {
  count: number
  expenseText: string
  incomeText: string
}

type RecentPageResponse = {
  data: HomeRecentRecordDTO[]
  total?: number
  hasMore?: boolean
}

const SEARCH_PAGE_SIZE = 100
const SEARCH_MAX_RECORDS = 500

function formatMoney(value: number) {
  return Number(value || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export async function getSearchCategoryOptions(): Promise<SearchCategoryOption[]> {
  const [expenseCategories, incomeCategories] = await Promise.all([
    getCategoryOptions('expense'),
    getCategoryOptions('income').catch(() => [] as AddCategoryItem[]),
  ])
  const toOption = (item: AddCategoryItem, type: RecordType): SearchCategoryOption => ({
    ...item,
    type,
  })
  return [
    ...expenseCategories
      .filter((item) => item.name !== SETTINGS_CATEGORY_NAME)
      .map((item) => toOption(item, 'expense')),
    ...incomeCategories.filter((item) => item.name !== SETTINGS_CATEGORY_NAME).map((item) => toOption(item, 'income')),
  ]
}

async function fetchRecentPage(query: SearchQuery, pageNo: number) {
  const openId = await ensureOpenId()
  const params: Record<string, unknown> = {
    openId,
    page: pageNo,
    size: SEARCH_PAGE_SIZE,
    status: 'normal',
  }
  if (query.month) {
    params.month = query.month
  }
  if (query.type !== 'all') {
    params.type = query.type
  }
  if (query.categoryId) {
    params.categoryId = query.categoryId
  }
  return get<RecentPageResponse>('/frontend/bookkeeping/transaction/recent', params, { skipToken: true })
}

function matchesKeyword(record: HomeRecentRecordDTO, keyword: string) {
  if (!keyword) {
    return true
  }
  const haystack = [record.categoryName, record.title, record.remark, record.amount]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
  return haystack.includes(keyword)
}

export async function searchTransactions(query: SearchQuery): Promise<SearchResult> {
  const records: HomeRecentRecordDTO[] = []
  let pageNo = 1
  let truncated = false
  for (;;) {
    const page = await fetchRecentPage(query, pageNo)
    const pageRecords = Array.isArray(page.data) ? page.data : []
    records.push(...pageRecords)
    const hasMore = typeof page.hasMore === 'boolean' ? page.hasMore : pageRecords.length >= SEARCH_PAGE_SIZE
    if (!hasMore) {
      break
    }
    if (records.length >= SEARCH_MAX_RECORDS) {
      truncated = true
      break
    }
    pageNo += 1
  }
  const keyword = query.keyword.trim().toLowerCase()
  return {
    records: records.filter((item) => matchesKeyword(item, keyword)),
    fetchedCount: records.length,
    truncated,
  }
}

export function summarizeSearchRecords(records: HomeRecentRecordDTO[]): SearchSummary {
  let expense = 0
  let income = 0
  records.forEach((item) => {
    const amount = Number(item.amount || 0)
    if (Number.isNaN(amount)) {
      return
    }
    if (item.type === 'income') {
      income += amount
    } else {
      expense += amount
    }
  })
  return {
    count: records.length,
    expenseText: formatMoney(expense),
    incomeText: formatMoney(income),
  }
}
