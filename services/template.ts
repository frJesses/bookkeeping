import { RECORD_TEMPLATE_LIMIT, RECORD_TEMPLATE_STORAGE_KEY, type RecordType } from '../constants/add'

export type RecordTemplate = {
  id: string
  type: RecordType
  categoryId: string
  categoryName: string
  icon: string
  amount: string
  remark: string
  updatedAt: number
}

export type RecordTemplateInput = {
  type: RecordType
  categoryId: string
  categoryName: string
  icon: string
  amount: string
  remark: string
}

function isRecordType(value: unknown): value is RecordType {
  return value === 'expense' || value === 'income'
}

function normalizeTemplate(value: unknown): RecordTemplate | null {
  if (!value || typeof value !== 'object') {
    return null
  }
  const item = value as Partial<RecordTemplate>
  if (!isRecordType(item.type) || !item.categoryName) {
    return null
  }
  return {
    id: `${item.id || ''}` || `template-${item.categoryName}`,
    type: item.type,
    categoryId: `${item.categoryId || ''}`,
    categoryName: `${item.categoryName}`,
    icon: `${item.icon || ''}`,
    amount: `${item.amount || ''}`,
    remark: `${item.remark || ''}`,
    updatedAt: Number(item.updatedAt) || 0,
  }
}

export function getRecordTemplates(type?: RecordType): RecordTemplate[] {
  let stored: unknown
  try {
    stored = wx.getStorageSync(RECORD_TEMPLATE_STORAGE_KEY)
  } catch (error) {
    console.warn('read record templates failed', error)
    return []
  }
  if (!Array.isArray(stored)) {
    return []
  }
  const templates = stored
    .map(normalizeTemplate)
    .filter((item): item is RecordTemplate => Boolean(item))
    .sort((left, right) => right.updatedAt - left.updatedAt)
  return type ? templates.filter((item) => item.type === type) : templates
}

function writeRecordTemplates(templates: RecordTemplate[]) {
  try {
    wx.setStorageSync(RECORD_TEMPLATE_STORAGE_KEY, templates)
  } catch (error) {
    console.warn('save record templates failed', error)
  }
}

function createTemplateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function isSameTemplate(template: RecordTemplate, input: RecordTemplateInput) {
  return (
    template.type === input.type &&
    template.categoryId === input.categoryId &&
    template.categoryName === input.categoryName &&
    template.amount === input.amount &&
    template.remark === input.remark
  )
}

export function saveRecordTemplate(input: RecordTemplateInput): RecordTemplate {
  const template: RecordTemplate = {
    id: createTemplateId(),
    type: input.type,
    categoryId: `${input.categoryId || ''}`,
    categoryName: input.categoryName,
    icon: input.icon || '',
    amount: input.amount || '',
    remark: input.remark || '',
    updatedAt: Date.now(),
  }
  const existing = getRecordTemplates().filter((item) => !isSameTemplate(item, input))
  writeRecordTemplates([template, ...existing].slice(0, RECORD_TEMPLATE_LIMIT))
  return template
}

export function deleteRecordTemplate(id: string) {
  if (!id) {
    return
  }
  writeRecordTemplates(getRecordTemplates().filter((item) => item.id !== id))
}
