Component({
  properties: {
    categories: {
      type: Array,
      value: [],
    },
    activeCategory: {
      type: String,
      value: '',
    },
  },
  methods: {
    handleSelect(e: WechatMiniprogram.BaseEvent) {
      const { name } = e.currentTarget.dataset as { name?: string }
      if (!name) {
        return
      }
      this.triggerEvent('select', { name })
    },
  },
})
