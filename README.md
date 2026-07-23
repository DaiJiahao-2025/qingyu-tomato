# 番茄轻语

番茄轻语是一个带有角色剧情陪伴的个人专注工具。它把任务、番茄钟、专注记录、效率统计和剧情解锁串成一个完整流程，让一次学习时段同时留下可见的进度和故事反馈。

项目当前以 Vue 3 + TypeScript 实现，支持浏览器本地使用，也支持通过 Express、MySQL 和 JWT 开启账号登录与多设备同步。

> 写下一个任务，完成一轮专注，解锁一段新的回忆。

## 目录

- [核心流程](#核心流程)
- [功能](#功能)
- [技术栈](#技术栈)
- [快速开始](#快速开始)
- [使用方式](#使用方式)
- [项目结构](#项目结构)
- [数据与同步](#数据与同步)
- [开发命令](#开发命令)
- [测试与验证](#测试与验证)
- [内容与资源扩展](#内容与资源扩展)
- [贡献指南](#贡献指南)
- [许可证](#许可证)
- [联系与致谢](#联系与致谢)

## 核心流程

```mermaid
flowchart LR
    A[创建任务] --> B[开始番茄钟]
    B --> C[角色语音与音乐陪伴]
    C --> D[完成专注]
    D --> E[保存专注记录]
    E --> F[更新任务进度]
    F --> G[解锁剧情]
    G --> H[画廊回看]
```

## 功能

### 专注与任务

- 创建、编辑、完成、删除和筛选项目与任务。
- 从任务直接启动番茄钟，完成后自动增加任务的番茄进度。
- 默认专注时长为 25 分钟，开始前不能低于 25 分钟，也可以设置更长时长。
- 支持开始、暂停、继续、退出本轮、跳过休息和开始下一轮。
- 页面刷新或浏览器短暂休眠后，根据真实时间戳恢复计时状态。

### 记录与统计

- 保存每次专注的任务、时长、角色和完成时间。
- 查看今日完成数、本周专注趋势、项目投入分布、完成率和连续专注天数。
- 设置页提供虚拟列表，性能场景可以加载 5000 条记录而不创建 5000 个同时可见的 DOM 节点。

### 角色与剧情

- 当前包含岁岁和娅娅两个角色入口，岁岁拥有完整的第一季 10 段剧情。
- 每完成一轮番茄钟，按角色进度解锁对应剧情。
- 在专注开始和结束时播放角色台词，在休息阶段查看本轮解锁内容。
- 在画廊中查看已解锁的角色回忆，支持角色切换和语音试听。

### 音频与设置

- 提供 Chill、雨天和森林等背景音乐选项。
- 可分别调整语音音量和音乐音量，也可以开启静音模式。
- 音频和图片在浏览器空闲时预加载，降低首次交互等待。

### 账号与云同步

- 支持邮箱注册、登录和退出。
- 游客数据保存在浏览器中，注册后可以将现有数据同步到云端。
- 登录同一账号的其他设备可以拉取任务、项目、专注记录、设置、角色进度和画廊数据。
- 本地数据作为离线缓存，修改内容会在后台批量推送。
- 普通实体使用行级最后更新时间解决冲突，角色进度按最大值合并，已解锁剧集按集合合并，已完成进度只增加不减少。

## 技术栈

| 层次 | 技术 |
| --- | --- |
| 前端 | Vue 3、TypeScript、Vite、Pinia |
| UI | Element Plus、自定义设计系统 |
| 图表 | ECharts |
| 音频 | 浏览器 Audio API |
| 前端测试 | Playwright |
| 后端 | Node.js、Express 5、TypeScript、Zod |
| 数据库 | MySQL 8、Prisma |
| 身份认证 | JWT、bcryptjs |
| 后端测试 | Vitest、Supertest |
| 部署 | Docker Compose、nginx、GitHub Actions |

## 快速开始

### 环境要求

- Node.js 22，CI 使用 Node.js 22。
- npm 10 或更高版本。
- 只体验前端时不需要数据库。
- 开启账号和云同步时需要 MySQL 8。

### 只运行前端

适合先体验任务、番茄钟、剧情、画廊和本地记录。

```bash
git clone https://github.com/DaiJiahao-2025/qingyu-tomato.git
cd qingyu-tomato
npm install
npm run dev
```

打开 <http://127.0.0.1:5173>。

前端默认使用游客模式。数据保存在浏览器 localStorage 中，清理站点数据会删除本地进度。当前版本暂未提供数据导出功能，长期使用建议开启账号同步。

### 本地运行后端

后端用于账号登录和云同步。先准备一个可连接的 MySQL 8 数据库，然后在项目根目录执行：

```bash
cd server
npm install
```

复制 `server/.env.example` 为 `server/.env`，至少填写以下配置：

```dotenv
DATABASE_URL="mysql://user:password@localhost:3306/fanqie"
JWT_SECRET="请替换为足够长的随机字符串"
PORT=3000
```

初始化数据库并启动 API：

```bash
npm run migrate:dev
npm run dev
```

后端默认地址为 <http://localhost:3000>，健康检查地址为 <http://localhost:3000/api/health>。

前端开发服务器会把 `/api` 请求代理到 `http://localhost:3000`。如后端运行在其他地址，可以设置 `API_PROXY_TARGET`：

```bash
API_PROXY_TARGET=http://localhost:3001 npm run dev
```

PowerShell 可以这样设置：

```powershell
$env:API_PROXY_TARGET = "http://localhost:3001"
npm run dev
```

### Docker Compose 部署

Docker Compose 会同时启动 MySQL、API 和 nginx。先复制根目录的 `.env.example` 为 `.env`，填写密钥：

```dotenv
MYSQL_ROOT_PASSWORD=请替换为数据库密码
JWT_SECRET=请替换为足够长的随机字符串
WEB_PORT=80
```

启动服务：

```bash
docker compose up --build -d
```

打开 <http://localhost>。停止服务：

```bash
docker compose down
```

MySQL 数据保存在名为 `mysql-data` 的 Docker volume 中。删除 volume 会删除数据库数据，请先确认目标后再执行清理操作。

## 使用方式

1. 在首页创建一个项目或任务，也可以直接输入本轮要完成的事项。
2. 点击“添加番茄钟”，确认专注时长。最短时长为 25 分钟。
3. 选择角色、背景音乐和是否静音，然后开始专注。
4. 专注完成后查看结束语音和休息阶段的剧情内容。
5. 在任务页查看进度，在概览页查看统计，在画廊页回看已解锁剧情。
6. 打开设置页调整默认时长、休息时长、音量和账号同步。

### 本地数据位置

| 数据 | 存储位置 |
| --- | --- |
| 应用状态 | `fanqieqingyu:v1` |
| 登录信息 | `fanqieqingyu:auth:v1` |
| 同步元数据 | `fanqieqingyu:sync:v1` |
| 当前计时会话标记 | `fanqieqingyu:activeTimerSession`，存于 sessionStorage |

应用启动时会自动合并旧版数据。旧的 `taskHistory` 会迁移为 `focusSessions`，缺少的工作区、项目和任务字段会补充默认值。

## 项目结构

| 路径 | 职责 |
| --- | --- |
| `src/main.ts` | 创建 Vue 应用并挂载 Pinia |
| `src/App.vue` | 应用壳和视图挂载 |
| `src/components/` | 首页、任务、概览、画廊、设置和通用 UI 组件 |
| `src/components/charts/` | ECharts 图表封装 |
| `src/stores/app.ts` | 计时状态机、持久化快照、任务进度和剧情解锁的核心实现 |
| `src/stores/task.ts` | 项目、任务、筛选和任务操作入口 |
| `src/stores/focus.ts` | 专注状态和计时动作入口 |
| `src/stores/story.ts` | 角色、剧情和画廊入口 |
| `src/stores/analytics.ts` | 从任务和专注记录派生统计数据 |
| `src/stores/settings.ts` | 计时和音频设置入口 |
| `src/stores/auth.ts` | 登录状态和本地身份边界 |
| `src/stores/workspace.ts` | 工作区切换入口 |
| `src/services/persistence.ts` | localStorage 默认值、读取、保存和旧数据迁移 |
| `src/services/sync.ts` | 前端同步队列、脏数据标记、推送和增量拉取 |
| `src/services/api.ts` | 前端 API 请求封装 |
| `src/composables/` | 音频、计时 ticker 和资源预加载等纯辅助逻辑 |
| `public/data/stories.json` | 角色、剧集、台词和资源引用配置 |
| `public/images/` | 角色图片和剧情视觉资源 |
| `public/audio/` | 背景音乐和角色语音 |
| `server/src/` | Express API、认证、同步服务和实体接口 |
| `server/prisma/` | Prisma schema 和数据库迁移 |
| `tests/` | Playwright 前端端到端测试 |
| `docs/` | 架构说明和性能报告 |

## 数据与同步

游客模式只依赖浏览器本地存储，打开页面即可使用。登录后，前端在本地快照之外维护独立的同步元数据，记录影子快照、待推送行和增量拉取游标，因此游客数据结构保持兼容。

同步接口 `POST /api/sync` 会在一次请求中完成批量推送和增量拉取。实体删除使用墓碑记录，服务端同时维护客户端更新时间和服务端同步时间：

- `updatedAt` 用于判断哪一份修改更新。
- `syncedAt` 用于增量拉取，避免设备时钟回拨造成漏数据。
- 专注记录按不可变数据批量插入，重复记录会被跳过。
- 角色完成数按最大值合并，已解锁剧集按集合合并。

详细边界和数据流请查看 [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)。

## 开发命令

### 前端

| 命令 | 用途 |
| --- | --- |
| `npm run dev` | 启动 Vite 开发服务器 |
| `npm run build` | 构建生产文件 |
| `npm run preview` | 预览生产构建 |
| `npm run typecheck` | 执行 `vue-tsc` 类型检查 |
| `npm test` | 运行 Playwright 测试 |
| `npm run test:headed` | 以可见浏览器运行 Playwright |
| `npm run test:ui` | 打开 Playwright 测试界面 |

### 后端

在 `server/` 目录执行：

| 命令 | 用途 |
| --- | --- |
| `npm run dev` | 监听模式启动 API |
| `npm run build` | 编译 TypeScript |
| `npm run typecheck` | 执行类型检查 |
| `npm test` | 运行 Vitest 和 Supertest |
| `npm run migrate:dev` | 本地创建或更新数据库迁移 |
| `npm run migrate:deploy` | 部署环境执行已有迁移 |
| `npm run generate` | 生成 Prisma Client |

## 测试与验证

提交代码前建议至少运行：

```bash
npm run typecheck
npm run build
npm test
```

后端测试需要 MySQL：

```bash
cd server
npm run typecheck
npm test
```

Playwright 会自动启动端口 `54321` 的 Vite 测试服务。云同步测试会先检查 `http://localhost:3000/api/health`，后端未启动时会自动跳过。要完整验证登录和多设备同步，请先启动 `server/` 后再执行 `npm test`。

虚拟列表性能场景：

```text
http://127.0.0.1:5173/?perf=1
```

打开设置页可以查看 5000 条测试专注记录。性能数据见 [`docs/performance/README.md`](docs/performance/README.md)。

## 内容与资源扩展

新增角色或剧集时，优先修改 `public/data/stories.json`，再补齐对应的图片和音频文件：

1. 在 `characters` 中增加角色基本信息。
2. 在 `episodes` 中配置解锁所需番茄数、台词、视觉资源和语音资源。
3. 在 `public/images/` 和 `public/audio/` 放置文件，并确认路径与 JSON 完全一致。
4. 如果角色需要在首页或画廊展示，检查 `src/stores/app.ts` 中的角色定义和试听配置。
5. 更新对应的 Playwright 测试，覆盖角色切换、剧情解锁和资源加载。

资源文件需要拥有可用的授权。当前仓库中的音频和图片素材来源、授权范围仍需要项目维护者进一步整理，公开发布前请完成版权核查。

## 贡献指南

欢迎提交代码、文档、测试、内容和问题反馈。建议按下面的流程参与：

1. 先阅读 [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) 和相关组件、Store。
2. 在 Issues 中确认是否已有相同问题，或先创建一个清晰的问题说明。
3. 从 `main` 创建能表达改动目的的分支，例如 `feat/task-filter`。
4. 保持一次提交聚焦一个主题，并补充必要的测试。
5. 提交 Pull Request 时说明改动内容、验证命令和可能影响的数据迁移。

### 问题反馈建议

请尽量提供以下信息：

- 浏览器和操作系统版本。
- 是否登录账号，是否开启云同步。
- 可复现的操作步骤。
- 预期结果和实际结果。
- 控制台报错、截图或测试日志。

涉及 localStorage 结构、计时流程、任务管理、画廊或音频播放的改动，应同时更新 Playwright 覆盖，并在变更说明中写清楚兼容处理。

## 许可证

`package.json` 当前声明许可证为 `ISC`，仓库根目录暂未包含独立的 `LICENSE` 文件。公开分发前，请项目维护者补充正式许可证文本，并确认图片、音乐和语音素材的授权范围。

## 联系与致谢

- 问题反馈和功能建议：<https://github.com/DaiJiahao-2025/qingyu-tomato/issues>
- 代码仓库：<https://github.com/DaiJiahao-2025/qingyu-tomato>
- 感谢 Vue、Vite、Pinia、Element Plus、ECharts、Playwright、Express、Prisma 和 MySQL 社区提供的开源工具。
