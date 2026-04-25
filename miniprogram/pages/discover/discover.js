const poseStore = require('../../services/pose-store')

const app = getApp()

Page({
  data: {
    statusBarHeight: 44,
    navBarHeight: 88,
    categories: [],
    currentCategory: 'all',
    difficulty: '',
    searchKeyword: '',
    filteredPoses: [],
    favorites: {},
  },

  onLoad() {
    this.setData({
      statusBarHeight: app.globalData.statusBarHeight,
      navBarHeight: app.globalData.navBarHeight,
      categories: poseStore.categories,
    })
    this._updatePoses()
    this._updateFavorites()
  },

  onShow() {
    this._updateFavorites()
    this._updatePoses()
  },

  selectCategory(e) {
    this.setData({ currentCategory: e.currentTarget.dataset.id })
    this._updatePoses()
  },

  selectDifficulty(e) {
    this.setData({ difficulty: e.currentTarget.dataset.level })
    this._updatePoses()
  },

  onSearchInput(e) {
    this.setData({ searchKeyword: e.detail.value })
    this._updatePoses()
  },

  onSearch() {
    this._updatePoses()
  },

  toggleFavorite(e) {
    const id = e.currentTarget.dataset.id
    poseStore.toggleFavorite(id)
    this._updateFavorites()
  },

  tryPose(e) {
    const id = e.currentTarget.dataset.id
    const pose = poseStore.getPoseById(id)
    if (pose) {
      poseStore.selectedPose = pose
      wx.switchTab({ url: '/pages/camera/camera' })
    }
  },

  openPoseDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/discover/pose-detail?id=${id}`,
    })
  },

  _updatePoses() {
    const { currentCategory, difficulty, searchKeyword } = this.data
    let poses = poseStore.getPosesByCategory(currentCategory)

    if (difficulty) {
      poses = poses.filter(p => p.difficulty === difficulty)
    }

    if (searchKeyword) {
      const kw = searchKeyword.toLowerCase()
      poses = poses.filter(p =>
        p.name.includes(kw) ||
        p.scenes.some(s => s.includes(kw))
      )
    }

    this.setData({ filteredPoses: poses })
  },

  _updateFavorites() {
    const favMap = {}
    poseStore.favorites.forEach(id => { favMap[id] = true })
    this.setData({ favorites: favMap })
  },
})
