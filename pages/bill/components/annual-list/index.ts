Component({
  properties: {
    rows: {
      type: Array,
      value: [],
    },
    mode: {
      type: String,
      value: 'year',
    },
  },
  methods: {
    handleSelect(e: WechatMiniprogram.BaseEvent) {
      const { periodKey } = e.currentTarget.dataset as { periodKey?: string }
      if (!periodKey) {
        return
      }
      this.triggerEvent('select', { periodKey })
    },
  },
})
