const poseStore = require('../../services/pose-store')

Page({
  data: {
    stats: {
      totalPhotos: 0,
      favCount: 0,
      bestScore: 0,
    },
  },

  onShow() {
    this.setData({
      stats: {
        totalPhotos: poseStore.history.length,
        favCount: poseStore.favorites.length,
        bestScore: this._getBestScore(),
      },
    })
  },

  _getBestScore() {
    try {
      return wx.getStorageSync('posesnap_best_score') || 0
    } catch { return 0 }
  },

  openHistory() {
    wx.showToast({ title: '开发中...', icon: 'none' })
  },

  openFeedback() {
    wx.showModal({
      title: '意见反馈',
      content: '欢迎通过小程序「意见反馈」入口提交反馈',
      showCancel: false,
    })
  },

  shareApp() {
    // 触发转发
  },

  onShareAppMessage() {
    return {
      title: 'PoseSnap - AI 拍照教练，教你摆出好看姿势',
      path: '/pages/camera/camera',
    }
  },
})
