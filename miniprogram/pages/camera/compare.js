const poseStore = require('../../services/pose-store')

Page({
  data: {
    photoPath: '',
    pose: null,
    matchScore: 0,
  },

  onLoad(options) {
    const photoPath = decodeURIComponent(options.photo || '')
    const poseId = options.poseId || ''
    const pose = poseId ? poseStore.getPoseById(poseId) : null

    this.setData({
      photoPath,
      pose,
      matchScore: 0, // TODO: compute from detection results
    })
  },

  retake() {
    wx.navigateBack()
  },

  saveAndShare() {
    if (!this.data.photoPath) return

    wx.saveImageToPhotosAlbum({
      filePath: this.data.photoPath,
      success() {
        wx.showToast({ title: '已保存到相册' })
      },
      fail() {
        wx.showToast({ title: '保存失败', icon: 'none' })
      },
    })
  },
})
