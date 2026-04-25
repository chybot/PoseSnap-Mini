const poseStore = require('../../services/pose-store')
const app = getApp()

Page({
  data: {
    statusBarHeight: 44,
    navBarHeight: 88,
    pose: null,
    isFavorite: false,
  },

  onLoad(options) {
    this.setData({
      statusBarHeight: app.globalData.statusBarHeight,
      navBarHeight: app.globalData.navBarHeight,
    })

    const id = options.id
    const pose = poseStore.getPoseById(id)
    if (pose) {
      this.setData({
        pose,
        isFavorite: poseStore.isFavorite(id),
      })
    }
  },

  goBack() {
    wx.navigateBack()
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
