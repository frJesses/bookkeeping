import type { RecordTemplate } from '../../../../services/template'

type TemplateBarInstance = WechatMiniprogram.Component.TrivialInstance & {
  data: {
    templates: RecordTemplate[]
    activeType: string
  }
}

Component({
  properties: {
    templates: {
      type: Array,
      value: [] as RecordTemplate[],
    },
    activeType: {
      type: String,
      value: 'expense',
    },
  },
  methods: {
    handleUse(this: TemplateBarInstance, e: WechatMiniprogram.BaseEvent) {
      const index = Number(e.currentTarget.dataset.index)
      const template = this.data.templates[index]
      if (!template) {
        return
      }
      this.triggerEvent('use', { template })
    },
    handleRemove(this: TemplateBarInstance, e: WechatMiniprogram.BaseEvent) {
      const index = Number(e.currentTarget.dataset.index)
      const template = this.data.templates[index]
      if (!template) {
        return
      }
      this.triggerEvent('remove', { id: template.id })
    },
  },
})
