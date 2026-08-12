import { BILL_MODE_OPTIONS, type BillMode } from '../../../../constants/bill'
Component({
  properties: {
    activeMode: {
      type: String,
      value: 'month',
    },
  },
  data: {
    options: BILL_MODE_OPTIONS,
  },
  methods: {
    handleChange(e: WechatMiniprogram.BaseEvent) {
      const { mode } = e.currentTarget.dataset as { mode?: BillMode }
      if (!mode || mode === this.data.activeMode) {
        return
      }
      this.triggerEvent('change', { mode })
    },
  },
})
