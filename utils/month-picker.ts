const RECENT_YEAR_COUNT = 4

export function createRecentYearOptions(referenceDate = new Date()) {
  const currentYear = referenceDate.getFullYear()
  return Array.from({ length: RECENT_YEAR_COUNT }, (_, index) => `${currentYear - RECENT_YEAR_COUNT + 1 + index}`)
}

export function createAvailableMonthOptions(year: string, referenceDate = new Date()) {
  const currentYear = referenceDate.getFullYear()
  const endMonth = Number(year) === currentYear ? referenceDate.getMonth() + 1 : 12
  return Array.from({ length: endMonth }, (_, index) => `${index + 1}`)
}

export function createMonthPickerState(selectedMonth: string, referenceDate = new Date()) {
  const pickerYears = createRecentYearOptions(referenceDate)
  const [selectedYear, selectedMonthNumber] = selectedMonth.split('-')
  const matchedYearIndex = pickerYears.indexOf(selectedYear)
  const yearIndex = matchedYearIndex >= 0 ? matchedYearIndex : pickerYears.length - 1
  const pickerMonths = createAvailableMonthOptions(pickerYears[yearIndex], referenceDate)
  const matchedMonthIndex = pickerMonths.indexOf(`${Number(selectedMonthNumber || 1)}`)
  const monthIndex = matchedMonthIndex >= 0 ? matchedMonthIndex : pickerMonths.length - 1
  return {
    pickerYears,
    pickerMonths,
    pickerValue: [yearIndex, monthIndex],
  }
}

export function createCurrentMonthValue(referenceDate = new Date()) {
  const month = `${referenceDate.getMonth() + 1}`.padStart(2, '0')
  return `${referenceDate.getFullYear()}-${month}`
}

export function createDefaultDateForMonth(month: string, referenceDate = new Date()) {
  const currentMonth = createCurrentMonthValue(referenceDate)
  if (month === currentMonth) {
    const day = `${referenceDate.getDate()}`.padStart(2, '0')
    return `${currentMonth}-${day}`
  }
  return `${month}-01`
}

export function shiftMonthValue(month: string, offset: number) {
  const [year, monthNumber] = month.split('-').map(Number)
  const date = new Date(year, monthNumber - 1 + offset, 1)
  return `${date.getFullYear()}-${`${date.getMonth() + 1}`.padStart(2, '0')}`
}
