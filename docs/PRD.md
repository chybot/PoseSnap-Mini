# PoseSnap Mini — MVP PRD v1.0

> AI 拍照姿势教练微信小程序
> 最后更新：2026-04-25

---

## 1. 产品定位

**一句话**：打开相机就能跟着学的拍照姿势教练。

**核心差异化**（竞品无人实现）：
- VKSession 实时人体检测 + 角度匹配 → **告诉用户"对不对、差多少"**
- 不是静态图库，是**实时交互式引导**

**目标用户**：18-30 岁女性，拍照频率高但不会摆姿势，社交媒体重度用户。

---

## 2. MVP 功能范围

### 2.1 核心功能（P0 — 必须上线）

#### F1: 相机 + 轮廓叠加
- 全屏相机预览
- 半透明姿势轮廓 PNG 叠加在相机画面上
- 轮廓透明度可调（默认 45%）
- 前后摄像头切换（前置自动推荐自拍友好姿势）

#### F2: 实时姿势匹配
- VKSession 23 点人体检测（~10fps）
- 8 个核心角度匹配（肘/膝/肩/躯干/头部）
- 实时匹配分数（0-100）
- 三级颜色反馈：>80 绿 / 50-80 黄 / <50 红
- 文字引导提示（"左肘角度偏差较大" / "姿势很棒！"）
- VKSession 不可用时 graceful 降级（只显示轮廓，不显示分数）

#### F3: 姿势库浏览
- 分类筛选（旅行/咖啡馆/街拍/日常等 10 个场景）
- 难度标签（入门/进阶/高级）
- 关键词搜索
- 姿势详情页（轮廓大图 + 要点提示 + 常见错误）
- 点击"试拍"直接跳转相机并加载该姿势

#### F4: 智能推荐
- 打开相机默认推荐 5 个姿势（基于热度 + 人数 + 自拍适配）
- 底部轮播快速切换姿势

#### F5: 拍照 + 保存
- 拍照保存到系统相册
- 拍照后显示匹配分数（如有）

### 2.2 次要功能（P1 — 上线后迭代）

| 功能 | 说明 | 优先级理由 |
|---|---|---|
| 收藏夹 | 收藏常用姿势 | 留存功能，非核心链路 |
| 使用历史 | 记录拍照历史 | 数据积累，后续推荐依赖 |
| 个人页统计 | 拍照次数/最高分 | 锦上添花 |

### 2.3 暂不做（P2 — 竞品教训）

| 功能 | 原因 |
|---|---|
| 对比页（before/after） | Posely 做了但用户不用，增加流程摩擦 |
| 录像模式 | 技术复杂度高，核心价值不在视频 |
| 从相册选图生成轮廓 | 需要 AI 模型部署，MVP 阶段成本过高 |
| 社交分享/社区 | 冷启动无内容，先积累用户 |
| 付费订阅 | Posely 订阅冷启动失败的教训，先免费获客 |

---

## 3. 页面结构

```
Tab 1: 相机页 (pages/camera/camera)
  └─ 全屏相机 + 轮廓叠加 + 底部姿势轮播 + 拍照

Tab 2: 发现页 (pages/discover/discover)
  └─ 子页: 姿势详情 (pages/discover/pose-detail)

Tab 3: 我的 (pages/profile/profile)
  └─ 统计 + 设置
```

> MVP 从 4 Tab 精简为 3 Tab，移除独立收藏 Tab（收藏功能合并到"我的"）

---

## 4. 用户核心流程

### 流程 A：快速拍照（80% 用户路径）
```
打开小程序 → 相机页（已推荐 5 个姿势）
  → 滑动底部轮播选姿势
  → 轮廓叠加到相机画面
  → 对齐身体，看匹配分数
  → 分数 >80 时拍照
  → 保存到相册 ✅
```

### 流程 B：浏览发现（20% 用户路径）
```
切到"发现"Tab
  → 按场景/难度筛选
  → 点击姿势卡片 → 详情页
  → 看要点提示 + 常见错误
  → 点"试拍" → 跳转相机页加载该姿势
  → 拍照 → 保存 ✅
```

---

## 5. 数据模型

### 5.1 Pose（姿势）

```typescript
interface Pose {
  id: string                    // "pose_001"
  name: string                  // "侧身回眸"
  category: CategoryId          // "street"
  scenes: string[]              // ["街拍", "旅行打卡"]
  peopleCount: number           // 1
  difficulty: Difficulty        // "beginner" | "intermediate" | "advanced"
  bodyType: BodyType            // "fullBody" | "upperBody"
  selfieFriendly: boolean       // true
  silhouette: string            // "pose_001_sil.png" (文件名)
  tips: string[]                // ["身体侧对镜头约45度", ...]
  mistakes: string[]            // ["肩膀太紧", ...]
  joints: JointMap              // 关节坐标（用于匹配，不传渲染线程）
  popularity: number            // 1520 (热度排序权重)
}

type Difficulty = "beginner" | "intermediate" | "advanced"
type BodyType = "fullBody" | "upperBody"
type CategoryId = "travel" | "cafe" | "beach" | "street" | "bestie"
                | "couple" | "daily" | "food" | "graduation" | "professional"
```

### 5.2 JointMap（关节坐标模板）

```typescript
// 归一化坐标 [0,1]，左上角为原点
interface JointMap {
  nose: [number, number]
  neck: [number, number]
  leftShoulder: [number, number]
  rightShoulder: [number, number]
  leftElbow: [number, number]
  rightElbow: [number, number]
  leftWrist: [number, number]
  rightWrist: [number, number]
  leftHip: [number, number]
  rightHip: [number, number]
  leftKnee?: [number, number]     // upperBody 姿势可能没有
  rightKnee?: [number, number]
  leftAnkle?: [number, number]
  rightAnkle?: [number, number]
}
```

### 5.3 Category（场景分类）

```typescript
interface Category {
  id: CategoryId
  name: string          // "旅行打卡"
  icon: string          // icon 标识
}
```

### 5.4 本地持久化（wx.setStorageSync）

| Key | 类型 | 说明 |
|---|---|---|
| `posesnap_favorites` | `string[]` | 收藏的 pose id 列表 |
| `posesnap_history` | `{ poseId: string, timestamp: number }[]` | 使用历史（最多 100 条） |
| `posesnap_best_score` | `number` | 历史最高匹配分数 |
| `posesnap_settings` | `Settings` | 用户设置 |

```typescript
interface Settings {
  contourOpacity: number    // 0.2 ~ 0.8, 默认 0.45
  guideEnabled: boolean     // 默认 true
}
```

---

## 6. 服务层接口设计

> MVP 阶段全部本地运算，无后端服务。以下是 JS 模块接口。

### 6.1 PoseStore（姿势数据管理）

```typescript
class PoseStore {
  // --- 查询 ---
  getPosesByCategory(categoryId: string): Pose[]
  getPosesByScene(scene: string): Pose[]
  search(keyword: string): Pose[]
  getPoseById(id: string): Pose | null

  // --- 推荐 ---
  recommend(params: {
    scene?: string
    peopleCount?: number
    isSelfie?: boolean
  }): Pose[]   // 返回最多 5 个

  // --- 收藏 ---
  isFavorite(poseId: string): boolean
  toggleFavorite(poseId: string): boolean  // 返回新状态
  getFavoritePoses(): Pose[]

  // --- 历史 ---
  recordUsage(poseId: string): void

  // --- 当前选中（跨页通信） ---
  selectedPose: Pose | null
}
```

### 6.2 PoseDetection（姿势检测）

```typescript
class PoseDetectionService {
  // --- 生命周期 ---
  start(): void        // 初始化 VKSession
  stop(): void         // 销毁 VKSession

  // --- 回调 ---
  onDetected: ((joints: JointMap | null, peopleCount: number) => void) | null

  // --- 匹配计算 ---
  computeMatch(
    detectedJoints: JointMap,
    templateJoints: JointMap
  ): MatchResult
}

interface MatchResult {
  score: number                    // 0-100
  jointFeedback: JointFeedback[]   // 每个关节的反馈
  guidanceTip: string              // 引导文案
}

interface JointFeedback {
  name: string       // "左肘" / "右膝"
  status: "good" | "close" | "off"
  diff: number       // 角度偏差（度）或位置偏差（%）
}
```

### 6.3 AngleMath（角度计算工具）

```typescript
// 三点角度计算，返回 0-180°
function computeAngle(
  p1: [number, number] | undefined,
  p2: [number, number] | undefined,
  p3: [number, number] | undefined
): number | null

// 两点欧氏距离
function distance(
  p1: [number, number],
  p2: [number, number]
): number

// 偏差状态颜色
function statusColor(diff: number, threshold: { good: number, close: number }): string
```

---

## 7. 匹配算法规格

### 7.1 角度匹配（权重 70%）

| 检查项 | 三点定义 | 含义 |
|---|---|---|
| 左肘 | leftShoulder → leftElbow → leftWrist | 左臂弯曲角度 |
| 右肘 | rightShoulder → rightElbow → rightWrist | 右臂弯曲角度 |
| 左膝 | leftHip → leftKnee → leftAnkle | 左腿弯曲角度 |
| 右膝 | rightHip → rightKnee → rightAnkle | 右腿弯曲角度 |
| 左肩 | neck → leftShoulder → leftElbow | 左肩展开角度 |
| 右肩 | neck → rightShoulder → rightElbow | 右肩展开角度 |
| 躯干 | neck → leftHip → rightHip | 躯干倾斜 |
| 头部 | leftEye → nose → rightEye | 头部倾斜 |

**评分规则**：
- 角度偏差 < 10°：满分（good）
- 角度偏差 10-25°：部分得分（close）
- 角度偏差 > 25°：不得分（off）
- 单项分数 = max(0, 100 - diff × 2)

### 7.2 位置偏移（权重 30%）

对 14 个核心关节检查归一化坐标偏移：
- 偏移 < 0.08：good
- 偏移 0.08-0.15：close
- 偏移 > 0.15：off

### 7.3 引导文案生成

```
score >= 80 → "姿势很棒！"
score 50-79 → "{最差关节}再调整一点就完美了"
score < 50  → "{最差关节}角度偏差较大，调整一下"
无人检测到  → "请站到镜头前"
```

---

## 8. 技术架构

### 8.1 渲染引擎
- **Skyline** 渲染 + glass-easel 组件框架
- WebView 自动降级（基础库 < 2.29.2）
- `navigationStyle: "custom"` 全局自定义导航栏

### 8.2 相机层叠（Skyline same-layer rendering）
```
z-index 0:  <camera> 组件
z-index 5:  <image> 轮廓 PNG（mode="aspectFit"）
z-index 10: <view> UI 控件层
```

### 8.3 Skyline 约束
- 不使用 `cover-view` / `cover-image`（Skyline 不支持）
- 不使用 `wx:if` 切换 camera 上方元素（改用 `hidden` 防冻结）
- `setData` 不传大对象（joints 数据存 JS 变量，不进渲染线程）
- 数据文件用 `.js` 模块导出（`lazyCodeLoading` 模式下 `.json` 被忽略）

### 8.4 VKSession 降级策略
```
wx.createVKSession 存在？
  ├─ Y → 创建 session → start 成功？
  │     ├─ Y → 实时检测 + 匹配分数 + 引导文案
  │     └─ N → 仅轮廓叠加，不显示分数
  └─ N → 仅轮廓叠加，不显示分数
```

### 8.5 性能约束
- VKSession 帧回调降频：每 3 帧处理 1 次（~10fps）
- `setData` 只传变化的轻量字段（score/tip/scoreClass）
- 姿势切换不触发 DOM 增删（hidden 替代 wx:if）

---

## 9. 姿势资源规格

### 9.1 轮廓 PNG 规格
- 格式：PNG，透明背景
- 风格：黄色/白色人体轮廓线（参考竞品）
- 尺寸：推荐 600×800px
- 文件大小：< 100KB
- 命名：`pose_{id}_sil.png`

### 9.2 MVP 姿势库规模
- 初始 14 个姿势（10 个生成 + 4 个手工黄色轮廓）
- 覆盖 10 个场景分类
- 上线后按用户反馈逐步扩充

---

## 10. 上线检查清单

- [ ] 微信公众平台设置最低基础库版本 ≥ 2.29.2
- [ ] 替换 appid 占位符为正式 appid
- [ ] 轮廓 PNG 资源质量审核（风格统一）
- [ ] 真机测试：iOS + Android
- [ ] 真机测试：VKSession 可用 / 不可用两种场景
- [ ] 真机测试：前置 / 后置摄像头切换
- [ ] 代码体积 < 2MB（小程序包限制）
- [ ] 提交审核
