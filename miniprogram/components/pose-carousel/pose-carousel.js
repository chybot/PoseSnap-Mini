Component({
  properties: {
    poses: { type: Array, value: [] },
    selectedId: { type: String, value: '' },
  },
  methods: {
    onSelect(e) {
      const id = e.currentTarget.dataset.id
      this.triggerEvent('select', { id })
    },
  },
})
