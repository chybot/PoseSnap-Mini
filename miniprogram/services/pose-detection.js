/**
 * VKSession 人体姿势检测服务
 * 封装微信 VisionKit，提供 23 个关节点实时检测
 */
const angleMath = require('../utils/angle-math')

// VKSession 返回的 23 个 2D 关节点名称映射
const JOINT_NAMES = [
  'nose', 'leftEye', 'rightEye', 'leftEar', 'rightEar',
  'leftShoulder', 'rightShoulder', 'leftElbow', 'rightElbow',
  'leftWrist', 'rightWrist', 'leftHip', 'rightHip',
  'leftKnee', 'rightKnee', 'leftAnkle', 'rightAnkle',
  'neck', 'leftPalm', 'rightPalm', 'spine',
  'leftToeBase', 'rightToeBase'
]

// 匹配使用的核心关节（与模板对比）
const CORE_JOINTS = [
  'nose', 'neck',
  'leftShoulder', 'rightShoulder',
  'leftElbow', 'rightElbow',
  'leftWrist', 'rightWrist',
  'leftHip', 'rightHip',
  'leftKnee', 'rightKnee',
  'leftAnkle', 'rightAnkle'
]

class PoseDetectionService {
  constructor() {
    this.session = null
    this.detecting = false
    this.onDetected = null  // callback(joints, matchResult)
    this._frameCount = 0
  }

  /**
   * 初始化 VKSession
   * @param {string} cameraId - camera 组件 id
   */
  start(cameraId) {
    if (this.session) return

    this.session = wx.createVKSession({
      track: {
        body: { mode: 1 }  // mode 1 = 2D body detection
      },
      version: 'v1',
    })

    this.session.on('updateAnchors', (anchors) => {
      if (!this.detecting || !anchors || anchors.length === 0) return

      // 降频：每 3 帧处理一次（~10fps）
      this._frameCount++
      if (this._frameCount % 3 !== 0) return

      const body = anchors[0] // 取第一个人
      const joints = this._parseJoints(body)

      if (this.onDetected) {
        this.onDetected(joints, anchors.length)
      }
    })

    this.session.on('removeAnchors', () => {
      if (this.onDetected) {
        this.onDetected(null, 0)
      }
    })

    this.session.start((err) => {
      if (err) {
        console.error('[PoseDetection] start failed:', err)
        return
      }
      this.detecting = true
      console.log('[PoseDetection] VKSession started')
    })
  }

  stop() {
    if (this.session) {
      this.detecting = false
      this.session.stop()
      this.session.destroy()
      this.session = null
      this._frameCount = 0
    }
  }

  /**
   * 解析 VKSession anchor 为标准关节点
   * @returns {Object} { name: [x, y], ... } 归一化坐标 0-1
   */
  _parseJoints(anchor) {
    const joints = {}
    const points = anchor.points || []

    for (let i = 0; i < Math.min(points.length, JOINT_NAMES.length); i++) {
      const pt = points[i]
      if (pt && pt.score > 0.3) {  // 置信度阈值
        joints[JOINT_NAMES[i]] = [pt.x, pt.y]
      }
    }

    return joints
  }

  /**
   * 计算当前姿势与模板的匹配结果
   * @param {Object} detectedJoints - 检测到的关节 { name: [x,y] }
   * @param {Object} templateJoints - 模板关节 { name: [x,y] }
   * @returns {Object} { score, jointFeedback: [{ name, status }], guidanceTip }
   */
  computeMatch(detectedJoints, templateJoints) {
    if (!detectedJoints || !templateJoints) {
      return { score: 0, jointFeedback: [], guidanceTip: '请站到镜头前' }
    }

    const feedback = []
    let totalScore = 0
    let count = 0

    // 计算 8 个核心角度的匹配
    const angleChecks = [
      { name: '左肘', joints: ['leftShoulder', 'leftElbow', 'leftWrist'] },
      { name: '右肘', joints: ['rightShoulder', 'rightElbow', 'rightWrist'] },
      { name: '左膝', joints: ['leftHip', 'leftKnee', 'leftAnkle'] },
      { name: '右膝', joints: ['rightHip', 'rightKnee', 'rightAnkle'] },
      { name: '左肩', joints: ['neck', 'leftShoulder', 'leftElbow'] },
      { name: '右肩', joints: ['neck', 'rightShoulder', 'rightElbow'] },
      { name: '躯干', joints: ['neck', 'leftHip', 'rightHip'] },
      { name: '头部', joints: ['leftEye', 'nose', 'rightEye'] },
    ]

    let worstAngle = null
    let worstDiff = 0

    for (const check of angleChecks) {
      const [j1, j2, j3] = check.joints

      const dAngle = angleMath.computeAngle(
        detectedJoints[j1], detectedJoints[j2], detectedJoints[j3]
      )
      const tAngle = angleMath.computeAngle(
        templateJoints[j1], templateJoints[j2], templateJoints[j3]
      )

      if (dAngle === null || tAngle === null) continue

      const diff = Math.abs(dAngle - tAngle)
      let status = 'good'   // green: <10°
      if (diff > 25) status = 'off'    // red: >25°
      else if (diff > 10) status = 'close'  // yellow: 10-25°

      const angleScore = Math.max(0, 100 - diff * 2)
      totalScore += angleScore
      count++

      feedback.push({ name: check.name, status, diff: Math.round(diff) })

      if (diff > worstDiff) {
        worstDiff = diff
        worstAngle = check.name
      }
    }

    // 同时检查关键关节位置偏移
    for (const jName of CORE_JOINTS) {
      const d = detectedJoints[jName]
      const t = templateJoints[jName]
      if (!d || !t) continue

      const dist = Math.sqrt((d[0] - t[0]) ** 2 + (d[1] - t[1]) ** 2)
      let status = 'good'
      if (dist > 0.15) status = 'off'
      else if (dist > 0.08) status = 'close'

      // 避免重复添加
      if (!feedback.find(f => f.name === jName)) {
        feedback.push({ name: jName, status, diff: Math.round(dist * 100) })
      }
    }

    const score = count > 0 ? Math.round(totalScore / count) : 0

    // 生成引导提示
    let guidanceTip = '姿势很棒！'
    if (score < 50) {
      guidanceTip = worstAngle ? `${worstAngle}角度偏差较大，调整一下` : '请调整姿势'
    } else if (score < 80) {
      guidanceTip = worstAngle ? `${worstAngle}再调整一点就完美了` : '接近了，微调一下'
    }

    return { score, jointFeedback: feedback, guidanceTip }
  }
}

module.exports = new PoseDetectionService()
