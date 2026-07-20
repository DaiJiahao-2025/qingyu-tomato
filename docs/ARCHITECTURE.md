# 架构说明

## 状态边界

`useAppStore` 保留原有计时和剧情组件需要的兼容 API，并负责统一持久化快照。新增业务通过模块化 Store 对外提供清晰入口。

| 模块 | 职责 |
|---|---|
| `stores/task.ts` | 项目、任务、筛选和任务操作 |
| `stores/focus.ts` | 计时状态和计时动作入口 |
| `stores/story.ts` | 角色、剧情和画廊数据入口 |
| `stores/analytics.ts` | 从任务和专注记录派生效率指标 |
| `stores/settings.ts` | 计时和音频设置入口 |
| `stores/auth.ts` | 当前本地用户身份边界 |
| `stores/workspace.ts` | 当前工作区和切换入口 |
| `services/persistence.ts` | 默认状态、读取、保存、清理和旧数据迁移 |

## 数据流

```text
TaskView
  ↓
taskStore.createTask
  ↓
taskStore.startTask
  ↓
appStore.startTimer
  ↓
appStore.completePomodoro
  ├→ focusSessions 新增记录
  ├→ tasks 更新番茄进度
  ├→ analyticsStore 派生指标
  └→ story progress 解锁剧情
```

## UI 与图表边界

Element Plus 通过具体组件入口按需导入，应用于任务表单、任务表格、筛选和设置页面。`BaseInput` 与 `BaseSelect` 保留受控和非受控 API，内部使用 Element Plus 实现基础交互。自定义 `VirtualList` 继续负责大量专注记录渲染。

ECharts 跟随异步 `DashboardView` 加载。`analyticsStore` 负责生成七天趋势和项目分布，图表组件只接收数据和生成 option。

```text
analyticsStore
  ├→ weeklyTrend → WeeklyFocusChart → BarChart
  └→ projectDistribution → ProjectTimeChart → PieChart
```

`BaseChart` 统一处理 ECharts 初始化、option 更新、ResizeObserver 和实例销毁。柱状图与环形图各自注册所需模块，并通过二级异步组件拆分代码块。

## 持久化

存储 key 继续使用 `fanqieqingyu:v1`。读取旧数据时，`taskHistory` 会迁移为 `focusSessions`，缺少的工作区、任务和项目字段使用默认值补齐。

计时开始、暂停、继续、完成时立即保存。运行中每 5 秒节流保存，页面进入后台时再保存一次。剩余时间通过 `startTime` 和 `endTime` 计算。

## SaaS 边界

当前完成的是本地个人效率 MVP。`userId`、`workspaceId` 和 Store 边界为云端阶段预留。

后续接入 Supabase 或自建 API 时，需要补充：

1. 邮箱或第三方登录。
2. 服务端 PostgreSQL 数据库。
3. 用户与工作区的行级权限。
4. 本地与云端同步冲突策略。
5. 多用户权限测试。
