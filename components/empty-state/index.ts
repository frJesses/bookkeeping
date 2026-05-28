Component({
  properties: {
    image: {
      type: String,
      value: 'search',
    },
    description: {
      type: String,
      value: '',
    },
    buttonText: {
      type: String,
      value: '',
    },
    buttonColor: {
      type: String,
      value: '',
    },
  },
  methods: {
    handleAction() {
      this.triggerEvent('action')
    },
  },
})
