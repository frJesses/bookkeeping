type EmptyStateInstance = WechatMiniprogram.Component.TrivialInstance

Component({
  properties: {
    mode: {
      type: String,
      value: 'empty',
    },
    title: {
      type: String,
      value: '',
    },
    description: {
      type: String,
      value: '',
    },
    showRetry: {
      type: Boolean,
      value: false,
    },
    compact: {
      type: Boolean,
      value: false,
    },
  },
  methods: {
    handleRetry(this: EmptyStateInstance) {
      this.triggerEvent('retry')
    },
  },
})
