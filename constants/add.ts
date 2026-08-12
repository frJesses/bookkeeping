export type RecordType = 'expense' | 'income'
export type CategoryItem = {
  id: string | number
  name: string
  icon: string
  accent: string
  surface: string
  shadow: string
  activeSurface: string
  activeShadow: string
}
export type KeypadAction = 'digit' | 'operator' | 'backspace' | 'date' | 'done'
export type KeypadKey = {
  id: string
  label: string
  action: KeypadAction
  value?: string
  primary?: boolean
}
export const DEFAULT_RECORD_TYPE: RecordType = 'expense'
export const DEFAULT_CATEGORY_NAME = ''
export const ADD_RECORD_TABS: Array<{ type: RecordType; label: string }> = [
  {
    type: 'expense',
    label: '支出',
  },
  {
    type: 'income',
    label: '收入',
  },
]
export const ADD_KEYPAD_ROWS: KeypadKey[][] = [
  [
    { id: '7', label: '7', action: 'digit', value: '7' },
    { id: '8', label: '8', action: 'digit', value: '8' },
    { id: '9', label: '9', action: 'digit', value: '9' },
    { id: 'today', label: '今天', action: 'date' },
  ],
  [
    { id: '4', label: '4', action: 'digit', value: '4' },
    { id: '5', label: '5', action: 'digit', value: '5' },
    { id: '6', label: '6', action: 'digit', value: '6' },
    { id: 'plus', label: '+', action: 'operator', value: '+' },
  ],
  [
    { id: '1', label: '1', action: 'digit', value: '1' },
    { id: '2', label: '2', action: 'digit', value: '2' },
    { id: '3', label: '3', action: 'digit', value: '3' },
    { id: 'minus', label: '-', action: 'operator', value: '-' },
  ],
  [
    { id: 'dot', label: '.', action: 'digit', value: '.' },
    { id: '0', label: '0', action: 'digit', value: '0' },
    { id: 'backspace', label: '⌫', action: 'backspace' },
    { id: 'done', label: '完成', action: 'done', primary: true },
  ],
]
