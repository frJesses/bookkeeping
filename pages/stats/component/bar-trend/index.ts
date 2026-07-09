type AnimatedPoint = Record<string, unknown> & {
  height: number
  animatedHeight: number
}

Component({
  properties: {
    axisLabels: {
      type: Array,
      value: [],
    },
    points: {
      type: Array,
      value: [],
    },
    activeFlow: {
      type: String,
      value: 'expense',
    },
    hasActivePoint: {
      type: Boolean,
      value: false,
    },
    tooltipLabel: {
      type: String,
      value: '',
    },
    dateRange: {
      type: String,
      value: '',
    },
  },
  data: {
    animatedPoints: [] as AnimatedPoint[],
  },
  observers: {
    points(val: Array<{ height: number }>) {
      const basePoints: AnimatedPoint[] = Array.isArray(val)
        ? val.map((item) => ({ ...item, animatedHeight: 0 }))
        : []
      this.setData({ animatedPoints: basePoints })
      if (basePoints.length === 0) {
        return
      }
      setTimeout(() => {
        const nextPoints: AnimatedPoint[] = (Array.isArray(this.data.points) ? this.data.points : []).map((item) => {
          const point = item as Record<string, unknown> & { height: number }
          return {
            ...point,
            animatedHeight: point.height,
          }
        })
        this.setData({ animatedPoints: nextPoints })
      }, 40)
    },
  },
  methods: {
    handleSelect(e: WechatMiniprogram.BaseEvent) {
      const { index } = e.currentTarget.dataset as { index?: number | string }
      this.triggerEvent('select', { index })
    },
  },
})
