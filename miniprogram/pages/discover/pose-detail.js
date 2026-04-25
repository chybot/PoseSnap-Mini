const poseStore = require('../../services/pose-store')

Page({
  data: {
    pose: null,
    isFavorite: false,
  },

  onLoad(options) {
    const id = options.id
    const pose = poseStore.getPoseById(id)
    if (pose) {
      this.setData({
        pose,
        isFavorite: poseStore.isFavorite(id),
      })
      wx.setNavigationBarTitle({ title: pose.name })
    }
  },

  toggleFavorite() {
    if (!this.data.pose) return
    const isFav = poseStore.toggleFavorite(this.data.pose.id)
    this.setData({ isFavorite: isFav })
    wx.showToast({
      title: isFav ? '已收藏' : '已取消收藏',
      icon: 'none',
    })
  },

  tryPose() {
    if (!this.data.pose) return
    poseStore.selectedPose = this.data.pose
    wx.switchTab({ url: '/pages/camera/camera' })
  },
})
