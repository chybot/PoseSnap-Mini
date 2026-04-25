const poseStore = require('../../services/pose-store')
const poseDetection = require('../../services/pose-detection')

const DIFF_LABELS = { beginner: '入门', intermediate: '进阶', advanced: '高级' }

Page({
  data: {
    cameraPosition: 'back',
    showGuide: true,
    selectedPose: false,
    selectedPoseId: '',
    contourSrc: '',
    poseName: '',
    poseDiffLabel: '',
    poseTips: [],
    recommendedPoses: [],
    guidanceTip: '',
    matchScore: 0,
    scoreClass: '',
  },

  // Keep full pose object off setData (joints data is heavy)
  _currentPose: null,

  onLoad() {
    const preSelected = poseStore.selectedPose
    const recommended = poseStore.recommend({
      scene: null,
      peopleCount: 1,
      isSelfie: false,
    })
    const selected = preSelected || recommended[0] || null
    poseStore.selectedPose = null

    this.setData({ recommendedPoses: recommended })
    this._applyPose(selected)
  },

  onReady() {
    this.cameraCtx = wx.createCameraContext()
    this._startDetection()
  },

  onUnload() { poseDetection.stop() },
  onHide() { poseDetection.stop() },

  onShow() {
    if (poseStore.selectedPose) {
      this._applyPose(poseStore.selectedPose)
      poseStore.selectedPose = null
    }
    if (this._wasDetecting) this._startDetection()
  },

  _applyPose(pose) {
    this._currentPose = pose
    if (pose) {
      this.setData({
        selectedPose: true,
        selectedPoseId: pose.id,
        contourSrc: '/images/silhouettes/' + pose.silhouette,
        poseName: pose.name,
        poseDiffLabel: DIFF_LABELS[pose.difficulty] || '',
        poseTips: pose.tips || [],
      })
    } else {
      this.setData({
        selectedPose: false,
        selectedPoseId: '',
        contourSrc: '',
        poseName: '',
        poseDiffLabel: '',
        poseTips: [],
      })
    }
  },

  _startDetection() {
    this._wasDetecting = true

    poseDetection.onDetected = (joints) => {
      if (!joints) {
        this.setData({ guidanceTip: '请站到镜头前', matchScore: 0, scoreClass: '' })
        return
      }

      if (!this.data.showGuide || !this._currentPose) return

      const match = poseDetection.computeMatch(joints, this._currentPose.joints)

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

  takePhoto() {
    this.cameraCtx.takePhoto({
      quality: 'high',
      success: (res) => {
        const pose = this._currentPose
        if (pose) poseStore.recordUsage(pose.id)
        wx.navigateTo({
          url: `/pages/camera/compare?photo=${encodeURIComponent(res.tempImagePath)}&poseId=${pose ? pose.id : ''}`,
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
    if (pose) this._applyPose(pose)
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
