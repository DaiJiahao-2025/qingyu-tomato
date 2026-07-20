# 性能测试报告

测试日期：2026 年 7 月 18 日。

测试环境：Vite 正式构建、Vite Preview、本机 Chromium、Lighthouse 13.4.0、Desktop preset。

## Lighthouse

| 指标 | 优化前 | 优化后三次中位数 | 变化 |
|---|---:|---:|---:|
| Performance | 91 | 89 | 减少 2 分 |
| FCP | 1354 ms | 1512 ms | 增加 11.7% |
| LCP | 1416 ms | 1512 ms | 增加 6.8% |
| TBT | 0 ms | 0 ms | 持平 |
| CLS | 0 | 0 | 持平 |
| 请求数 | 18 | 19 | 增加 1 个 |
| 传输体积 | 1,084,600 B | 1,023,425 B | 减少 5.6% |

优化前只保留到一次完整 Lighthouse 报告，优化后执行三次并取中位数。因此时间指标只能作为当前阶段参考，不能宣称 FCP 或 LCP 已提升。

本轮可以确认的结果：

1. 首屏传输体积减少约 5.6%。
2. TBT 保持为 0，新增功能没有带来可测的主线程阻塞。
3. CLS 保持为 0，页面没有可测的布局偏移。
4. 任务页、概览页和设置页被拆分为异步代码块。
5. 首屏主 JavaScript 从功能全部同步打包时的 128.98 kB 降至 109.62 kB。

## Element Plus 与 ECharts 接入

组件库和图表接入后的正式构建结果：

1. 首屏主 JavaScript 为 123.71 kB，gzip 为 47.15 kB。
2. 相比接入前的 109.62 kB，首屏主包增加 14.09 kB；gzip 增加约 5.44 kB。
3. Element Plus 使用具体组件入口导入，任务页、设置页和公共表单组件保持异步代码块。
4. ECharts 概览页壳体为 5.65 kB，gzip 为 2.29 kB。
5. ECharts 共享核心为 454.55 kB，gzip 为 156.04 kB，只在打开效率概览时加载。
6. 七天柱状图代码块为 42.84 kB，gzip 为 15.70 kB。
7. 项目环形图代码块为 1.15 kB，gzip 为 0.78 kB。
8. 所有产物均低于 Vite 默认的 500 kB 单块警告线。

Element Plus 和 ECharts 没有进入首页首屏的异步页面代码，首屏增量主要来自共享运行时代码和主题变量。

接入后再次执行三次桌面 Lighthouse，并取中位数：

| 指标 | 接入前中位数 | 接入后中位数 | 变化 |
|---|---:|---:|---:|
| Performance | 89 | 88 | 减少 1 分 |
| FCP | 1512 ms | 1546 ms | 增加 34 ms |
| LCP | 1512 ms | 1581 ms | 增加 69 ms |
| TBT | 0 ms | 0 ms | 持平 |
| CLS | 0 | 0 | 持平 |
| 请求数 | 19 | 19 | 持平 |
| 传输体积 | 1,023,425 B | 1,029,540 B | 增加约 0.6% |

本机 Lighthouse 时间存在正常波动，当前结果支持“首屏影响较小”，不能宣称 FCP 或 LCP 得到提升。原始报告位于 `docs/performance/after-libraries/`。

## 虚拟列表

Playwright 使用 `?perf=1` 生成 5000 条专注记录。

验收结果：

1. 数据总量为 5000 条。
2. 首次可见 DOM 行数少于 30 条。
3. 关键词筛选后列表数量和 DOM 行数同步更新。
4. 页面滚动容器使用固定行高、可视区域切片和 overscan。

## 原始报告

```text
docs/performance/before/lighthouse-1.json
docs/performance/after/lighthouse-1.json
docs/performance/after/lighthouse-2.json
docs/performance/after/lighthouse-3.json
docs/performance/after-libraries/lighthouse-1.json
docs/performance/after-libraries/lighthouse-2.json
docs/performance/after-libraries/lighthouse-3.json
```

Lighthouse 在 Windows 上生成报告后，清理临时 Chrome profile 时返回 `EPERM`。四份 JSON 均已完整写入并可通过 `ConvertFrom-Json` 解析。
