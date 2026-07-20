# 番茄轻语

番茄轻语是一个专注驱动的个人效率管理应用，将任务管理、番茄钟、专注数据和角色剧情连接成完整闭环。

```text
创建任务 → 开始专注 → 生成记录 → 更新任务进度 → 查看数据 → 解锁剧情
```

## 技术栈

Vue 3、TypeScript、Pinia、Element Plus、ECharts、Vite、Playwright、localStorage。

当前版本使用本地持久化 repository，已为 `userId` 和 `workspaceId` 预留数据归属字段。云端登录、数据库同步和多用户权限隔离属于后续后端阶段。

## 功能

1. 项目与任务的创建、编辑、完成、删除和筛选。
2. 从任务直接启动番茄钟，完成后自动更新任务进度。
3. 保存专注记录，统计今日、本周、完成率和连续专注天数。
4. 角色选择、语音陪伴、背景音乐和剧情解锁。
5. 专注记录虚拟列表，开发模式支持 5000 条测试数据。
6. 旧版 `fanqieqingyu:v1` 数据自动迁移。
7. 计时状态基于时间戳恢复，并使用节流持久化减少同步写入。
8. 基于 Element Plus 按需实现任务表单、筛选、表格、状态标签和设置控件。
9. 基于 ECharts 展示最近七天专注趋势和本周项目投入分布。

## 运行

```bash
npm install
npm run dev
```

访问 `http://127.0.0.1:5173`。

## 验证

```bash
npm run build
npm test
```

虚拟列表性能场景：

```text
http://127.0.0.1:5173/?perf=1
```

打开设置页后可以查看 5000 条专注记录，页面实际只保留可视区域附近的几十个 DOM 节点。

性能报告位于 `docs/performance/README.md`，架构说明位于 `docs/ARCHITECTURE.md`。
