import {
  createLoan,
  deleteLoan,
  getLoans,
  getTodayDate,
  repayLoan,
  updateLoan,
  type LoanRecord,
  type LoanSummary,
} from '../../services/loan'
import { getWindowInfo } from '../../utils/system-info'

type LoanPageInstance = WechatMiniprogram.Page.Instance<WechatMiniprogram.IAnyObject, WechatMiniprogram.IAnyObject> & {
  data: {
    statusBarHeight: number
    summary: Omit<LoanSummary, 'records'>
    records: Array<LoanRecord & { borrowerInitial: string; progressPercent: number }>
    showForm: boolean
    showRepay: boolean
    editingId: string
    borrower: string
    amount: string
    loanDate: string
    todayDate: string
    hasDueDate: boolean
    dueDate: string
    remark: string
    repayId: string
    repayAmount: string
    formError: string
    isLoading: boolean
    isSaving: boolean
  }
}

function decorateLoanRecord(record: LoanRecord) {
  const amount = Number(record.amount || 0)
  const repaid = Number(record.repaidAmount || 0)
  return {
    ...record,
    borrowerInitial: Array.from(record.borrower || '?')[0] || '?',
    progressPercent: amount > 0 ? Math.min(100, Math.round((repaid / amount) * 100)) : 0,
  }
}

Page({
  data: {
    statusBarHeight: 20,
    summary: { totalAmount: '0.00', totalRepaid: '0.00', totalOutstanding: '0.00', openCount: 0 },
    records: [] as Array<LoanRecord & { borrowerInitial: string; progressPercent: number }>,
    showForm: false,
    showRepay: false,
    editingId: '',
    borrower: '',
    amount: '',
    loanDate: getTodayDate(),
    todayDate: getTodayDate(),
    hasDueDate: false,
    dueDate: getTodayDate(),
    remark: '',
    repayId: '',
    repayAmount: '',
    formError: '',
    isLoading: false,
    isSaving: false,
  },
  onLoad(this: LoanPageInstance) {
    this.setData({ statusBarHeight: getWindowInfo().statusBarHeight || 20 })
    void this.loadPage()
  },
  async loadPage(this: LoanPageInstance) {
    this.setData({ isLoading: true })
    try {
      const data = await getLoans()
      this.setData({
        records: (data.records || []).map(decorateLoanRecord),
        summary: {
          totalAmount: data.totalAmount,
          totalRepaid: data.totalRepaid,
          totalOutstanding: data.totalOutstanding,
          openCount: data.openCount,
        },
        isLoading: false,
      })
    } catch (error) {
      console.error('load loan page failed', error)
      this.setData({ isLoading: false })
      wx.showToast({ title: '借出记录加载失败', icon: 'none' })
    }
  },
  openCreateForm(this: LoanPageInstance) {
    const today = getTodayDate()
    this.setData({
      showForm: true,
      editingId: '',
      borrower: '',
      amount: '',
      loanDate: today,
      hasDueDate: false,
      dueDate: today,
      remark: '',
      formError: '',
    })
  },
  editLoan(this: LoanPageInstance, e: WechatMiniprogram.BaseEvent) {
    const id = String(e.currentTarget.dataset.id || '')
    const item = this.data.records.find((record) => record.id === id)
    if (!item) return
    this.setData({
      showForm: true,
      editingId: item.id,
      borrower: item.borrower,
      amount: item.amount,
      loanDate: item.loanDate,
      hasDueDate: Boolean(item.dueDate),
      dueDate: item.dueDate || item.loanDate,
      remark: item.remark || '',
      formError: '',
    })
  },
  closeForm(this: LoanPageInstance) {
    if (!this.data.isSaving) this.setData({ showForm: false })
  },
  handleInput(this: LoanPageInstance, e: WechatMiniprogram.CustomEvent<{ value?: string }>) {
    const field = String(e.currentTarget.dataset.field || '')
    const value = e.detail.value || ''
    if (['borrower', 'amount', 'remark', 'repayAmount'].includes(field)) this.setData({ [field]: value })
  },
  handleLoanDateChange(this: LoanPageInstance, e: WechatMiniprogram.CustomEvent<{ value?: string }>) {
    if (!e.detail.value) return
    this.setData({
      loanDate: e.detail.value,
      dueDate: this.data.dueDate < e.detail.value ? e.detail.value : this.data.dueDate,
    })
  },
  handleDueDateChange(this: LoanPageInstance, e: WechatMiniprogram.CustomEvent<{ value?: string }>) {
    if (e.detail.value) this.setData({ dueDate: e.detail.value })
  },
  toggleDueDate(this: LoanPageInstance) {
    this.setData({ hasDueDate: !this.data.hasDueDate })
  },
  async saveLoan(this: LoanPageInstance) {
    const amount = Number(this.data.amount)
    if (
      !this.data.borrower.trim() ||
      !Number.isFinite(amount) ||
      amount <= 0 ||
      (this.data.hasDueDate && this.data.dueDate < this.data.loanDate)
    ) {
      this.setData({ formError: '请填写借款人、正确金额和有效日期' })
      return
    }
    this.setData({ isSaving: true, formError: '' })
    try {
      const payload = {
        borrower: this.data.borrower.trim(),
        amount: amount.toFixed(2),
        loanDate: this.data.loanDate,
        dueDate: this.data.hasDueDate ? this.data.dueDate : '',
        remark: this.data.remark.trim(),
      }
      if (this.data.editingId) await updateLoan(this.data.editingId, payload)
      else await createLoan(payload)
      this.setData({ showForm: false, isSaving: false })
      wx.showToast({ title: '已保存', icon: 'success' })
      await this.loadPage()
    } catch (error) {
      console.error('save loan failed', error)
      this.setData({ isSaving: false, formError: '保存失败，请重试' })
    }
  },
  openRepay(this: LoanPageInstance, e: WechatMiniprogram.BaseEvent) {
    this.setData({ showRepay: true, repayId: String(e.currentTarget.dataset.id || ''), repayAmount: '' })
  },
  closeRepay(this: LoanPageInstance) {
    this.setData({ showRepay: false })
  },
  async confirmRepay(this: LoanPageInstance) {
    const amount = Number(this.data.repayAmount)
    if (!this.data.repayId || !Number.isFinite(amount) || amount <= 0) {
      wx.showToast({ title: '请输入正确的收回金额', icon: 'none' })
      return
    }
    try {
      await repayLoan(this.data.repayId, amount.toFixed(2))
      this.setData({ showRepay: false })
      wx.showToast({ title: '收回成功', icon: 'success' })
      await this.loadPage()
    } catch (error) {
      console.error('repay loan failed', error)
      wx.showToast({ title: '收回失败，请检查金额', icon: 'none' })
    }
  },
  deleteLoan(this: LoanPageInstance, e: WechatMiniprogram.BaseEvent) {
    const id = String(e.currentTarget.dataset.id || '')
    if (!id) return
    wx.showModal({
      title: '删除借出记录',
      content: '删除后不会影响普通账单，确定删除吗？',
      success: (result) => {
        if (!result.confirm) return
        void deleteLoan(id)
          .then(() => this.loadPage())
          .catch(() => wx.showToast({ title: '删除失败', icon: 'none' }))
      },
    })
  },
  goBack() {
    wx.navigateBack()
  },
  noop() {},
})
