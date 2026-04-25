const poseStore = require('../../services/pose-store')
const app = getApp()

Page({
  data: {
    statusBarHeight: 44,
    navBarHeight: 88,
    favPoses: [],
  },

  onLoad() {
    this.setData({
      statusBarHeight: app.globalData.statusBarHeight,
      navBarHeight: app.globalData.navBarHeight,
    })
  },

  onShow() {
    this.setData({
      favPoses: poseStore.getFavoritePoses(),
    })
  },

  tryPose(e) {
    const id = e.currentTarget.dataset.id
    const pose = poseStore.getPoseById(id)
    if (pose) {
      poseStore.selectedPose = pose
      wx.switchTab({ url: '/pages/camera/camera' })
    }
  },

  removeFavorite(e) {
    const id = e.currentTarget.dataset.id
    poseStore.toggleFavorite(id)
    this.setData({
      favPoses: poseStore.getFavoritePoses(),
    })
    wx.showToast({ title: '已取消收藏', icon: 'none' })
  },

  goDiscover() {
    wx.switchTab({ url: '/pages/discover/discover' })
  },
})
