/**
 * 姿势数据管理服务
 * 负责姿势库加载、收藏管理、推荐排序
 */
const poseData = require('../data/pose_library')

const FAVORITES_KEY = 'posesnap_favorites'
const HISTORY_KEY = 'posesnap_history'

class PoseStore {
  constructor() {
    this.poses = poseData.poses || []
    this.categories = poseData.categories || []
    this.favorites = this._loadFavorites()
    this.history = this._loadHistory()
    this.selectedPose = null
  }

  /** 按分类筛选 */
  getPosesByCategory(categoryId) {
    if (!categoryId || categoryId === 'all') return this.poses
    return this.poses.filter(p => p.category === categoryId)
  }

  /** 按场景筛选 */
  getPosesByScene(scene) {
    return this.poses.filter(p => p.scenes.includes(scene))
  }

  /** 按人数筛选 */
  getPosesByPeopleCount(count) {
    return this.poses.filter(p => p.peopleCount === count)
  }

  /** 搜索 */
  search(keyword) {
    const kw = keyword.toLowerCase()
    return this.poses.filter(p =>
      p.name.includes(kw) ||
      p.scenes.some(s => s.includes(kw)) ||
      p.tips.some(t => t.includes(kw))
    )
  }

  /** AI 推荐：基于场景 + 人数 + 自拍/他拍 + 热度 */
  recommend({ scene, peopleCount, isSelfie }) {
    let candidates = this.poses

    // 场景匹配
    if (scene) {
      const sceneMatched = candidates.filter(p => p.scenes.includes(scene))
      if (sceneMatched.length > 0) candidates = sceneMatched
    }

    // 人数匹配
    if (peopleCount !== undefined) {
      const countMatched = candidates.filter(p => p.peopleCount === peopleCount)
      if (countMatched.length > 0) candidates = countMatched
    }

    // 自拍适配
    if (isSelfie) {
      const selfieMatched = candidates.filter(p => p.selfieFriendly)
      if (selfieMatched.length > 0) candidates = selfieMatched
    }

    // 按热度 + 收藏优先排序
    candidates.sort((a, b) => {
      const aFav = this.isFavorite(a.id) ? 1 : 0
      const bFav = this.isFavorite(b.id) ? 1 : 0
      if (aFav !== bFav) return bFav - aFav
      return b.popularity - a.popularity
    })

    return candidates.slice(0, 5)
  }

  /** 收藏管理 */
  isFavorite(poseId) {
    return this.favorites.includes(poseId)
  }

  toggleFavorite(poseId) {
    const idx = this.favorites.indexOf(poseId)
    if (idx >= 0) {
      this.favorites.splice(idx, 1)
    } else {
      this.favorites.push(poseId)
    }
    this._saveFavorites()
    return this.isFavorite(poseId)
  }

  getFavoritePoses() {
    return this.poses.filter(p => this.favorites.includes(p.id))
  }

  /** 使用历史 */
  recordUsage(poseId) {
    this.history.unshift({
      poseId,
      timestamp: Date.now(),
    })
    if (this.history.length > 100) this.history.length = 100
    this._saveHistory()
  }

  /** 根据 ID 获取姿势 */
  getPoseById(id) {
    return this.poses.find(p => p.id === id) || null
  }

  // --- 持久化 ---
  _loadFavorites() {
    try {
      return wx.getStorageSync(FAVORITES_KEY) || []
    } catch { return [] }
  }

  _saveFavorites() {
    wx.setStorageSync(FAVORITES_KEY, this.favorites)
  }

  _loadHistory() {
    try {
      return wx.getStorageSync(HISTORY_KEY) || []
    } catch { return [] }
  }

  _saveHistory() {
    wx.setStorageSync(HISTORY_KEY, this.history)
  }
}

// 单例
const store = new PoseStore()
module.exports = store
