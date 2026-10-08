Component({
  externalClasses: ['mask-class', 'sheet-class'],
  properties: {
    visible: {
      type: Boolean,
      value: false,
    },
    title: {
      type: String,
      value: '',
    },
    showClose: {
      type: Boolean,
      value: true,
    },
    closeOnMask: {
      type: Boolean,
      value: true,
    },
  },
  methods: {
    handleMaskTap(this: WechatMiniprogram.Component.TrivialInstance) {
      if (this.data.closeOnMask) {
        this.triggerEvent('close')
      }
    },
    handleClose(this: WechatMiniprogram.Component.TrivialInstance) {
      this.triggerEvent('close')
    },
    stopPropagation() {},
  },
})
