/**
 * 关节角度计算工具
 */

/**
 * 计算三个点构成的角度（度数）
 * @param {number[]} p1 - [x, y]
 * @param {number[]} p2 - [x, y] 顶点
 * @param {number[]} p3 - [x, y]
 * @returns {number|null} 角度（0-180）
 */
function computeAngle(p1, p2, p3) {
  if (!p1 || !p2 || !p3) return null

  const v1x = p1[0] - p2[0]
  const v1y = p1[1] - p2[1]
  const v2x = p3[0] - p2[0]
  const v2y = p3[1] - p2[1]

  const dot = v1x * v2x + v1y * v2y
  const mag1 = Math.sqrt(v1x * v1x + v1y * v1y)
  const mag2 = Math.sqrt(v2x * v2x + v2y * v2y)

  if (mag1 === 0 || mag2 === 0) return null

  const cos = Math.max(-1, Math.min(1, dot / (mag1 * mag2)))
  return Math.acos(cos) * (180 / Math.PI)
}

/**
 * 两点之间的距离
 */
function distance(p1, p2) {
  if (!p1 || !p2) return Infinity
  return Math.sqrt((p1[0] - p2[0]) ** 2 + (p1[1] - p2[1]) ** 2)
}

/**
 * 根据匹配状态返回颜色
 */
function statusColor(status) {
  switch (status) {
    case 'good': return '#4CAF50'   // green
    case 'close': return '#FF9800'  // yellow/orange
    case 'off': return '#F44336'    // red
    default: return 'rgba(255,255,255,0.7)'
  }
}

module.exports = { computeAngle, distance, statusColor }
