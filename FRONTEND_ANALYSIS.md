# 前端代码结构与 UI 分析

本分析基于当前项目中的 `index.html`、`styles.css`、`app.js`、`README.md` 和静态资源目录。项目当前是一个无构建流程的静态单页应用，所有页面通过 `data-view` 和 `.is-visible` 在同一个 HTML 文件内切换。

## 1. 当前有哪些页面

当前应用有 5 个主页面和 2 个全局浮层/反馈区域：

| 页面 | `data-view` | 入口 |
| --- | --- | --- |
| 首页 | `home` | 侧边导航“首页”，默认可见 |
| 番茄钟页 | `focus` | 侧边导航“番茄钟”，或开始番茄后自动跳转 |
| 角色页 | `characters` | 侧边导航“角色” |
| 画廊页 | `gallery` | 侧边导航“画廊”，首页按钮“看已解锁剧情” |
| 设置页 | `settings` | 侧边导航“设置” |
| 剧情选项弹窗 | `#choiceModal` | 有未处理剧情选项时触发 |
| Toast 提示 | `#toast` | JS 中有引用和样式，但当前 HTML 未看到对应节点 |

## 2. 每个页面有哪些主要区域

### 全局框架

- `app-shell`：整体应用外壳，桌面端为左侧导航 + 右侧工作区。
- `side-rail`：主导航区域，包含品牌、页面切换按钮、今日专注计数。
- `workspace`：主内容区域，承载所有 `.view` 页面。

### 首页 `home`

- `hero-panel`：首页主视觉区域。
- `hero-copy`：标题、说明文案、主操作按钮。
- `character-stage`：当前角色展示区。
- `portrait-card`：角色图片/占位立绘容器。
- `speech-slip`：角色当前台词。
- `start-card`：新番茄表单，包含任务输入、专注时长、背景声音、静音模式、开始按钮。
- `status-card`：当前角色进度，包含累计完成、剧情进度、下一段剧情。

### 番茄钟页 `focus`

- `timer-panel`：计时器主区域。
- `timer-orbit` / `timer-core`：圆形进度和倒计时显示。
- `timer-controls`：开始、暂停/继续、退出、跳过休息等按钮。
- `companion-panel`：角色陪伴区域。
- `mini-portrait`：小头像。
- `focusLine`：角色轻语。
- `unlockRibbon`：剧情解锁提示条。

### 角色页 `characters`

- `page-title`：页面标题。
- `character-grid`：角色卡片网格。
- `character-card.is-current`：当前开放角色“岁岁”。
- `character-card-portrait`：角色头像。
- `progress-strip`：剧情进度条。
- `character-card.locked`：未来角色占位卡。
- `locked-mark`：未开放角色占位符。

### 画廊页 `gallery`

- `page-title`：页面标题。
- `galleryGrid`：剧情卡片容器。
- `gallery-card`：由 `app.js` 的 `renderGallery()` 动态生成，包含解锁时间、标题、剧情文本、任务、选择记录和语音回放按钮。
- `gallery-empty`：无画廊记录时的空状态。

### 设置页 `settings`

- `page-title`：页面标题。
- `settings-panel`：设置表单容器。
- 默认番茄时长输入。
- 休息时长输入。
- 语音音量滑杆。
- 音乐音量滑杆。
- `history-panel`：最近完成任务记录，由 `renderHistory()` 动态生成。
- 清除本地数据按钮。

### 全局浮层

- `choice-modal`：剧情选择弹窗，由 `openChoiceModal()` 填充选项。
- `choice-card`：弹窗主体。
- `choice-options`：剧情选项按钮容器。
- `toast`：`app.js` 中通过 `elements.toast` 引用，`styles.css` 也定义了 `.toast` 样式，但 `index.html` 当前没有对应 DOM 节点。

## 3. 主要组件分别在哪些文件

当前项目没有拆分成前端组件文件，主要组件由 HTML 结构、CSS class 和 JS 函数组合实现。

| 组件/模块 | 结构位置 | 样式位置 | 行为/数据位置 |
| --- | --- | --- | --- |
| 应用外壳、侧边导航 | `index.html` | `styles.css` 的 `.app-shell`、`.side-rail`、`.nav-tabs`、`.nav-button` | `app.js` 的 `showView()`、`bindEvents()` |
| 首页 Hero | `index.html` | `.home-grid`、`.hero-panel`、`.hero-copy`、`.character-stage` | `render()` 更新角色台词和进度 |
| 角色图片/占位立绘 | `index.html` | `.portrait-card`、`.character-image`、`.portrait-figure`、`.mini-portrait` | `characters` 数据、`renderCharacterImages()` |
| 新番茄表单 | `index.html` | `.start-card`、`.field`、`.settings-row`、`.toggle-row` | `requestStartFromForm()`、`startTimer()`、`hydrateForm()` |
| 状态指标卡 | `index.html` | `.status-card`、`.metric-list` | `render()` |
| 番茄计时器 | `index.html` | `.focus-layout`、`.timer-panel`、`.timer-orbit`、`.timer-core` | `startTimer()`、`togglePause()`、`completePomodoro()`、`finishBreak()`、`startTicker()` |
| 角色陪伴面板 | `index.html` | `.companion-panel`、`blockquote`、`.story-ribbon` | `getCurrentLine()`、`playLine()`、`renderUnlock()` |
| 角色卡片 | `index.html` | `.character-grid`、`.character-card`、`.progress-strip` | `render()` 更新进度条 |
| 画廊卡片 | JS 动态生成 | `.gallery-grid`、`.gallery-card`、`.gallery-empty` | `renderGallery()` |
| 设置面板 | `index.html` | `.settings-panel`、`.history-panel` | `hydrateForm()`、设置项事件监听、`renderHistory()` |
| 剧情选择弹窗 | `index.html` | `.choice-modal`、`.choice-card`、`.choice-options` | `openChoiceModal()`、`chooseStoryOption()` |
| 音频/语音 | 无独立 DOM | 无主要样式 | `musicCatalog`、`playVoice()`、`speakLine()`、`startMusic()`、`stopMusic()` |
| 本地状态 | 无独立 DOM | 无 | `defaultState`、`loadState()`、`saveState()`、`mergeState()` |

## 4. 当前 UI 风格有什么明显问题

### 视觉系统不够统一

- 当前视觉基调是温柔、纸感、暖色、番茄红点缀，但页面同时混合了仪表盘卡片、叙事角色页、较大的 landing hero 和设置表单，信息密度与情绪表达不完全一致。
- 卡片、面板、表单、弹窗基本都使用同一套半透明背景、边框和重阴影，层级差异主要靠尺寸而不是设计语言区分。

### 配色偏单一

- 主色集中在米色、番茄红、茶色、浅橙之间，整体容易变成单一暖色系。
- `--sage` 有定义，但实际使用较少，缺少能稳定区分“专注状态、休息状态、剧情解锁、危险操作”的辅助色体系。

### 字体和图标有风险

- 字体依赖 Google Fonts。如果网络、字体覆盖或本地字体不可用，中文可能出现显示不稳定或字形不一致。
- 导航图标使用字符符号，例如 `⌂`、`◷`、`♧`、`□`、`⚙`。这些符号在不同平台字体中视觉差异大，不如统一图标库稳定。

### 图片语义和容器语义不完全匹配

- 当前角色资源是横向场景图，但在首页、番茄钟页、角色页同时被当作“立绘/头像”使用。
- `.character-image` 同时服务大图和小头像，虽然已有 `.small` 分支，但长期看仍容易让不同页面的图片需求互相影响。

### 响应式策略偏基础

- 主要断点只有 `980px` 和 `620px`，大部分布局是从多列直接切成单列。
- 移动端导航使用五列横向按钮，部分中文标签可能换行，导航高度和点击区域会随文案变化。
- 首页、计时器页、角色页对图片尺寸的控制现在已有基础限制，但整体响应式仍依赖较多固定宽高和 `min-height`。

### 动态区域样式不够组件化

- 画廊卡片由 `renderGallery()` 拼接 HTML，设置历史由 `renderHistory()` 拼接 HTML，样式仍在全局 CSS 中。
- 如果后续统一视觉，需要同时检查静态 HTML 和 JS 动态生成的 markup，否则可能出现新旧样式不一致。

### 可维护性问题

- HTML、CSS、状态逻辑、渲染逻辑都集中在少数文件中。MVP 阶段可接受，但后续扩展多角色、多剧情、多主题时会变难维护。
- `app.js` 中 `toast` 有引用，但当前 `index.html` 未看到 `#toast` 节点，属于 UI 结构和行为代码不完全同步的问题。

## 5. 如果要统一调整视觉，应该优先改哪些文件

### 第一优先级：`styles.css`

这是统一视觉的核心文件，建议优先处理：

- `:root` 设计变量：颜色、阴影、圆角、字体、边框、间距。
- 全局布局：`.app-shell`、`.side-rail`、`.workspace`。
- 通用组件：按钮、表单、卡片、标题、提示、弹窗。
- 页面布局：`.home-grid`、`.hero-panel`、`.focus-layout`、`.character-grid`、`.gallery-grid`、`.settings-panel`。
- 图片系统：`.portrait-card`、`.character-image`、`.mini-portrait`、`.character-card-portrait`。
- 响应式断点：`@media (max-width: 980px)` 和 `@media (max-width: 620px)`。

### 第二优先级：`index.html`

如果视觉调整涉及结构，应改这里：

- 统一页面区域命名和 class。
- 补齐缺失的 `#toast` DOM。
- 替换字符图标为稳定的图标方案。
- 如果角色图继续作为横向场景图使用，可以把“头像/立绘/场景图”的 DOM 结构拆清楚。
- 调整首页和功能页的信息层级，减少 landing hero 与工具界面的割裂。

### 第三优先级：`app.js`

视觉统一时需要同步这里的动态 HTML：

- `renderGallery()`：画廊卡片 markup 和按钮 class。
- `renderHistory()`：历史记录列表 markup。
- `openChoiceModal()`：剧情选项按钮 markup。
- `elements` 引用：如果 HTML class/id 调整，这里需要同步。
- `renderCharacterImages()`：如果拆分头像图、立绘图、场景图，这里要改资源分配逻辑。

### 第四优先级：`public/images`

如果要让“角色陪伴”更统一，应优先补齐资源类型：

- 角色立绘：用于首页主视觉。
- 角色头像：用于番茄钟页和角色页小圆图。
- 剧情/场景图：用于画廊或剧情片段。

当前同一张横向图被复用到多个语义位置，短期能用，长期会限制视觉一致性。

### 第五优先级：测试与文档

- `tests/smoke.spec.js`：视觉重构后至少保留页面加载、导航切换、计时器开始、表单校验等冒烟测试。
- `README.md`：如果引入构建流程、图标库、字体资产或新的资源规范，需要同步更新运行和维护说明。

## 建议的视觉统一顺序

1. 先在 `styles.css` 中确定设计变量和基础组件规范。
2. 再统一五个页面的布局密度、卡片层级、按钮样式和标题体系。
3. 然后处理图片资产语义，把头像、立绘、场景图拆开。
4. 接着补齐 `index.html` 中缺失或不稳定的 UI 节点，例如 `#toast` 和图标。
5. 最后同步 `app.js` 的动态渲染 markup，并跑冒烟测试。

