export type RecordType = 'expense' | 'income' | 'other'

export type CategoryItem = {
  id?: number
  name: string
  icon: string
  tone: 'blue' | 'light'
}

export const DEFAULT_RECORD_TYPE: RecordType = 'expense'
export const DEFAULT_CATEGORY_NAME = ''
