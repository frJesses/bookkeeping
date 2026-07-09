import {
  cacheEditingTransaction,
  clearCachedTransactionDetail,
  clearEditingTransaction,
  createTransactionDetailState,
  deleteTransactionById,
  getCachedTransactionDetail,
} from '../../../services/transaction-detail'
Page({
  data: {
    ...createTransactionDetailState(),
  },
  onLoad() {
    const record = getCachedTransactionDetail()
    const nextState = createTransactionDetailState(record)
    this.setData(nextState)
    if (nextState.pageTitle) {
      wx.setNavigationBarTitle({
        title: nextState.pageTitle,
      })
    }
  },
  onUnload() {
    clearCachedTransactionDetail()
  },
  handleEdit() {
    const record = this.data.record
    if (!record) {
      return
    }
    cacheEditingTransaction(record)
    wx.navigateTo({
      url: `/pages/add/add?mode=edit&type=${record.amountClass}&id=${record.id}`,
    })
  },
  handleDelete() {
    const record = this.data.record
    if (!record) {
      return
    }
    wx.showModal({
      title: '删除记录',
      content: '确认删除这条记录吗？',
      success: async (result) => {
        if (!result.confirm) {
          return
        }
        try {
          await deleteTransactionById(record.id)
          clearEditingTransaction()
          clearCachedTransactionDetail()
          wx.showToast({
            title: '删除成功',
            icon: 'success',
          })
          setTimeout(() => {
            wx.navigateBack()
          }, 500)
        } catch (error) {
          console.error('delete transaction failed', error)
          wx.showToast({
            title: '删除失败',
            icon: 'none',
          })
        }
      },
    })
  },
})
