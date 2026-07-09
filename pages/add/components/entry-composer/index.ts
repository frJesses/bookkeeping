type InputEventDetail = {
  value?: string
}
Component({
  properties: {
    categoryName: {
      type: String,
      value: '',
    },
    categoryIcon: {
      type: String,
      value: '',
    },
    amount: {
      type: String,
      value: '0',
    },
    remark: {
      type: String,
      value: '',
    },
    dateValue: {
      type: String,
      value: '',
    },
    dateLabel: {
      type: String,
      value: '今天',
    },
    isRelativeDateLabel: {
      type: Boolean,
      value: true,
    },
    maxDate: {
      type: String,
      value: '',
    },
    submitLabel: {
      type: String,
      value: '完成',
    },
    keyboardRows: {
      type: Array,
      value: [],
    },
  },
  methods: {
    handleKeyTap(e: WechatMiniprogram.BaseEvent) {
      const { action, value } = e.currentTarget.dataset as {
        action?: string
        value?: string
      }
      if (!action) {
        return
      }
      if (action === 'done') {
        this.triggerEvent('done')
        return
      }
      this.triggerEvent('keytap', {
        action,
        value: value || '',
      })
    },
    handleRemarkInput(e: WechatMiniprogram.CustomEvent<InputEventDetail>) {
      this.triggerEvent('remarkchange', {
        value: e.detail.value || '',
      })
    },
    handleDateChange(e: WechatMiniprogram.CustomEvent<InputEventDetail>) {
      this.triggerEvent('datechange', {
        value: e.detail.value || '',
      })
    },
  },
})
