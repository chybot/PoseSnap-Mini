const poseStore = require('../../services/pose-store')
const poseDetection = require('../../services/pose-detection')

Page({
  data: {
    cameraPosition: 'back',
    showGuide: true,
    selectedPose: null,
    recommendedPoses: [],
    guidanceTip: '',
    matchScore: 0,
    scoreClass: '',
  },

  onLoad() {
    const preSelected = poseStore.selectedPose
    const recommended = poseStore.recommend({
      scene: null,
      peopleCount: 1,
      isSelfie: false,
    })
    const selected = preSelected || recommended[0] || null
    poseStore.selectedPose = null

    this.setData({ recommendedPoses: recommended, selectedPose: selected })
  },

  onReady() {
    this.cameraCtx = wx.createCameraContext()
    this._startDetection()
  },

  onUnload() { poseDetection.stop() },
  onHide() { poseDetection.stop() },

  onShow() {
    if (poseStore.selectedPose) {
      this.setData({ selectedPose: poseStore.selectedPose })
      poseStore.selectedPose = null
    }
    if (this._wasDetecting) this._startDetection()
  },

  // --- VKSession: 只取匹配分数和引导文案 ---
  _startDetection() {
    this._wasDetecting = true

    poseDetection.onDetected = (joints, peopleCount) => {
      if (!joints) {
        this.setData({ guidanceTip: '请站到镜头前', matchScore: 0, scoreClass: '' })
        return
      }

      const { selectedPose, showGuide } = this.data
      if (!showGuide || !selectedPose) return

      const match = poseDetection.computeMatch(joints, selectedPose.joints)

      let scoreClass = ''
      if (match.score > 80) scoreClass = 'high'
      else if (match.score > 50) scoreClass = 'medium'

      this.setData({
        matchScore: match.score,
        scoreClass,
        guidanceTip: match.guidanceTip,
      })
    }

    poseDetection.start()
  },

  // --- Actions ---
  takePhoto() {
    this.cameraCtx.takePhoto({
      quality: 'high',
      success: (res) => {
        if (this.data.selectedPose) poseStore.recordUsage(this.data.selectedPose.id)
        wx.navigateTo({
          url: `/pages/camera/compare?photo=${encodeURIComponent(res.tempImagePath)}&poseId=${this.data.selectedPose ? this.data.selectedPose.id : ''}`,
        })
      },
      fail: () => wx.showToast({ title: '拍照失败', icon: 'none' }),
    })
  },

  switchCamera() {
    const next = this.data.cameraPosition === 'back' ? 'front' : 'back'
    this.setData({
      cameraPosition: next,
      recommendedPoses: poseStore.recommend({ scene: null, peopleCount: 1, isSelfie: next === 'front' }),
    })
  },

  toggleGuide() {
    this.setData({ showGuide: !this.data.showGuide })
  },

  selectPose(e) {
    const pose = poseStore.getPoseById(e.currentTarget.dataset.id)
    if (pose) this.setData({ selectedPose: pose })
  },

  switchMode(e) {
    wx.showToast({ title: `${e.currentTarget.dataset.mode === 'video' ? '录像' : '人像'}模式开发中`, icon: 'none' })
  },

  openLibrary() {
    wx.switchTab({ url: '/pages/discover/discover' })
  },

  onCameraError() {
    wx.showModal({
      title: '相机权限',
      content: '请在设置中允许使用相机',
      confirmText: '去设置',
      success(res) { if (res.confirm) wx.openSetting() },
    })
  },
})
