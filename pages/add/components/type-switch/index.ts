import { type RecordType, ADD_RECORD_TABS } from '../../../../constants/add'
Component({
  properties: {
    activeType: {
      type: String,
      value: 'expense',
    },
  },
  data: {
    tabs: ADD_RECORD_TABS,
  },
  methods: {
    handleSelect(e: WechatMiniprogram.BaseEvent) {
      const { type } = e.currentTarget.dataset as { type?: RecordType }
      if (!type || type === this.data.activeType) {
        return
      }
      this.triggerEvent('change', { type })
    },
  },
})
