import {
  DEFAULT_CATEGORY_NAME,
  DEFAULT_RECORD_TYPE,
  type CategoryItem,
  type RecordType,
} from '../constants/add'

export type AddCategoryItem = CategoryItem

export type AddPageState = {
  activeType: RecordType
  activeCategory: string
  amount: string
  remark: string
  categories: AddCategoryItem[]
}

export function createAddPageState(type?: string): AddPageState {
  const activeType: RecordType =
    type === 'income' || type === 'other' || type === 'expense' ? type : DEFAULT_RECORD_TYPE

  return {
    activeType,
    activeCategory: DEFAULT_CATEGORY_NAME,
    amount: '',
    remark: '',
    categories: [],
  }
}

export async function getCategoryOptions(_: RecordType): Promise<AddCategoryItem[]> {
  return []
}

export async function submitTransaction(_: {
  categoryId: number
  type: RecordType
  amount: string
  remark: string
}) {
  return null
}
