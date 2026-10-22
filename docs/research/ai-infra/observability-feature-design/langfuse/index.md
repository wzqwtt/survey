---
sidebar_position: 1
sidebar_label: 总览
title: Langfuse 可观测功能设计
description: Langfuse 可观测模块的源码事实：能力清单、推断、对旧笔记的修正和调研限制。
tags: [LLM, 可观测性, Trace, coze-loop, Langfuse]
date: 2026-10-22
---

# Langfuse 可观测功能设计

本篇记录 Langfuse 可观测模块的源码事实。每条事实链到固定提交。推断单独标 **【推断】**。回到 [专题总览](../index.md)。

## 源码版本与约定

| 项 | 值 |
|---|---|
| 仓库 | [wzqwtt/langfuse](https://github.com/wzqwtt/langfuse) |
| 提交 | [`f75c661d`](https://github.com/wzqwtt/langfuse/tree/f75c661dbe8c6b85523c81486b39e8403ac2c141) |

- 每条链接都指向该提交的 blob，带 `#L` 行号。
- 每条事实一句，附「路径 行号」和 permalink。
- 搜不到的能力写「无」，并列出搜过的位置。
- 缩写：`WRITE_MODE` 指环境变量 `LANGFUSE_MIGRATION_V4_WRITE_MODE`。
- 本次调研对照当前源码重新核对了旧笔记的行号。有一处推断要更正，见「对旧笔记的修正」。
- 本文把新路径叫 v4，把旧路径叫 v3 或 legacy，沿用源码里的叫法。

## 文档地图

| 页面 | 内容 |
|---|---|
| [模型、采集与存储](model-ingest-storage.md) | Trace 模型、采集入口、鉴权限流、存储与保留 |
| [查询、视图与会话](query-views.md) | 列表与详情、过滤、聚合、视图预设、导出、会话视图 |
| [评分、指标与告警](feedback-metrics.md) | 评分与标注、自动评估、指标与大盘、告警与通知 |
| [联动、治理与前端](integration-governance.md) | 与 Prompt、评测、数据集联动，权限与隔离，前端页面 |
| [用户路径](user-path.md) | 从一次 SDK 上报到列表与详情可见的逐步路径 |

## 先看全局

- `WRITE_MODE` 有 `legacy`、`dual`、`events_only` 三个值，默认是 `events_only`（`packages/shared/src/env.ts` L378-L381，[permalink](https://github.com/wzqwtt/langfuse/blob/f75c661dbe8c6b85523c81486b39e8403ac2c141/packages/shared/src/env.ts#L378-L381)）。
- Worker 侧的 `WRITE_MODE` 默认值同样是 `events_only`（`worker/src/env.ts` L646-L649，[permalink](https://github.com/wzqwtt/langfuse/blob/f75c661dbe8c6b85523c81486b39e8403ac2c141/worker/src/env.ts#L646-L649)）。
- `LANGFUSE_MIGRATION_V4_NATIVE_OTEL_BEHAVIOUR` 有 `dual_write` 和 `direct`，默认 `direct`（`worker/src/env.ts` L649-L652，[permalink](https://github.com/wzqwtt/langfuse/blob/f75c661dbe8c6b85523c81486b39e8403ac2c141/worker/src/env.ts#L649-L652)）。
- 仓库是 pnpm monorepo，含 `web`、`worker`、`ai-gateway`、`packages/**`、`ee`（`pnpm-workspace.yaml` L3-L8，[permalink](https://github.com/wzqwtt/langfuse/blob/f75c661dbe8c6b85523c81486b39e8403ac2c141/pnpm-workspace.yaml#L3-L8)），运行时由 `web` 与 `worker` 两个进程承担。
- 观测数据的主存储是 ClickHouse，配置与元数据在 Postgres（Prisma），原始事件与媒体在 S3 兼容存储。
- 读路径有两套：旧的 `traces` / `observations` / `scores` 表，和新的 `events_full` / `events_core` 表。
- 本文把新路径叫 v4，把旧路径叫 v3 或 legacy，沿用源码里的叫法。

## 能力清单

| 能力 | 是否存在 | 一句话 | 证据链接 |
| --- | --- | --- | --- |
| 1. Trace / Observation 模型、层级、Token 与成本 | 有 | Trace 由 span 聚合，Observation 有类型与父子关系，成本在摄入时按模型价格表算 | `packages/shared/clickhouse/migrations/canonical/0039_create_events_full.up.sql` L4-L6，[permalink](https://github.com/wzqwtt/langfuse/blob/f75c661dbe8c6b85523c81486b39e8403ac2c141/packages/shared/clickhouse/migrations/canonical/0039_create_events_full.up.sql#L4-L6)；`packages/shared/prisma/schema.prisma` L955-L958，[permalink](https://github.com/wzqwtt/langfuse/blob/f75c661dbe8c6b85523c81486b39e8403ac2c141/packages/shared/prisma/schema.prisma#L955-L958) |
| 2. 采集（legacy、公共 API、OTLP、队列、限流、鉴权） | 有 | 默认 OTLP 直写 `events_full`；legacy 走 S3 加队列；OTLP metrics 端点是空实现 | `web/src/pages/api/public/otel/v1/traces/index.ts` L26-L33，[permalink](https://github.com/wzqwtt/langfuse/blob/f75c661dbe8c6b85523c81486b39e8403ac2c141/web/src/pages/api/public/otel/v1/traces/index.ts#L26-L33)；`web/src/pages/api/public/otel/v1/metrics/index.ts` L18，[permalink](https://github.com/wzqwtt/langfuse/blob/f75c661dbe8c6b85523c81486b39e8403ac2c141/web/src/pages/api/public/otel/v1/metrics/index.ts#L18) |
| 2b. SDK 代码 | 无 | 本仓库不含 SDK，只读 SDK 请求头决定写入路径 | `worker/src/queues/otelIngestionQueue.ts` L60-L100，[permalink](https://github.com/wzqwtt/langfuse/blob/f75c661dbe8c6b85523c81486b39e8403ac2c141/worker/src/queues/otelIngestionQueue.ts#L60-L100)（已搜索根目录结构：`web`、`worker`、`packages`、`ee`、`generated`、`fern`、`scripts`） |
| 3. 存储（ClickHouse、Postgres、对象存储、保留） | 有 | ClickHouse 存 Trace 数据，Postgres 存配置，S3 存原始事件与媒体，保留由 Worker 清理 | `packages/shared/clickhouse/migrations/canonical/0039_create_events_full.up.sql` L112-L115，[permalink](https://github.com/wzqwtt/langfuse/blob/f75c661dbe8c6b85523c81486b39e8403ac2c141/packages/shared/clickhouse/migrations/canonical/0039_create_events_full.up.sql#L112-L115)；`worker/src/ee/dataRetention/handleDataRetentionProcessingJob.ts` L31，[permalink](https://github.com/wzqwtt/langfuse/blob/f75c661dbe8c6b85523c81486b39e8403ac2c141/worker/src/ee/dataRetention/handleDataRetentionProcessingJob.ts#L31) |
| 4. 查询（列表、详情、树、过滤、排序分页、聚合） | 有 | tRPC 有 v3 与 v4 成对过程；详情有树、时间线、图；过滤是类型化 `FilterState` | `web/src/features/events/server/eventsRouter.ts` L215，[permalink](https://github.com/wzqwtt/langfuse/blob/f75c661dbe8c6b85523c81486b39e8403ac2c141/web/src/features/events/server/eventsRouter.ts#L215)；`packages/shared/src/interfaces/filters.ts` L4-L29，[permalink](https://github.com/wzqwtt/langfuse/blob/f75c661dbe8c6b85523c81486b39e8403ac2c141/packages/shared/src/interfaces/filters.ts#L4-L29) |
| 5. 视图预设、列配置、批量导出、批量操作 | 有 | 预设存 Postgres；列可见性存浏览器；导出支持 CSV、JSON、JSONL；批量操作有 9 种动作 | `packages/shared/prisma/schema.prisma` L1704-L1727，[permalink](https://github.com/wzqwtt/langfuse/blob/f75c661dbe8c6b85523c81486b39e8403ac2c141/packages/shared/prisma/schema.prisma#L1704-L1727)；`packages/shared/src/features/batchAction/types.ts` L24-L35，[permalink](https://github.com/wzqwtt/langfuse/blob/f75c661dbe8c6b85523c81486b39e8403ac2c141/packages/shared/src/features/batchAction/types.ts#L24-L35) |
| 6. Session 视图 | 有 | 按 `session_id` 聚合，Postgres 只存收藏与公开标志；有列表、详情、公共 API | `web/src/server/api/routers/sessions.ts` L260，[permalink](https://github.com/wzqwtt/langfuse/blob/f75c661dbe8c6b85523c81486b39e8403ac2c141/web/src/server/api/routers/sessions.ts#L260) |
| 6b. User 视图 | 部分 | 有 UI 与 tRPC，按 `user_id` 聚合；无公共 users API | `web/src/server/api/routers/users.ts` L139，[permalink](https://github.com/wzqwtt/langfuse/blob/f75c661dbe8c6b85523c81486b39e8403ac2c141/web/src/server/api/routers/users.ts#L139)（公共 API 已搜索，无） |
| 7. Score、标注、标注队列、LLM-as-judge | 有 | 5 种数据类型、3 种来源；标注队列带分配与锁；评估器有 4 种类型 | `packages/shared/src/domain/scores.ts` L46-L52，[permalink](https://github.com/wzqwtt/langfuse/blob/f75c661dbe8c6b85523c81486b39e8403ac2c141/packages/shared/src/domain/scores.ts#L46-L52)；`packages/shared/prisma/schema.prisma` L565-L582，[permalink](https://github.com/wzqwtt/langfuse/blob/f75c661dbe8c6b85523c81486b39e8403ac2c141/packages/shared/prisma/schema.prisma#L565-L582) |
| 8. Dashboard 与指标 | 有 | 自定义 Widget、9 种图表、公共 metrics API；自定义图表由统一查询引擎支撑 | `packages/shared/src/features/query/types.ts` L123-L131，[permalink](https://github.com/wzqwtt/langfuse/blob/f75c661dbe8c6b85523c81486b39e8403ac2c141/packages/shared/src/features/query/types.ts#L123-L131)；`web/src/pages/api/public/v2/metrics.ts` L10，[permalink](https://github.com/wzqwtt/langfuse/blob/f75c661dbe8c6b85523c81486b39e8403ac2c141/web/src/pages/api/public/v2/metrics.ts#L10) |
| 9. 告警、通知、Webhook、自动化 | 部分 | 有 Monitor、Webhook、Slack、GitHub dispatch；Trigger 事件源只有 prompt、monitor、project-notification，没有 Trace 事件 | `packages/shared/src/domain/automations.ts` L5-L13，[permalink](https://github.com/wzqwtt/langfuse/blob/f75c661dbe8c6b85523c81486b39e8403ac2c141/packages/shared/src/domain/automations.ts#L5-L13)；`packages/shared/prisma/schema.prisma` L1892-L1922，[permalink](https://github.com/wzqwtt/langfuse/blob/f75c661dbe8c6b85523c81486b39e8403ac2c141/packages/shared/prisma/schema.prisma#L1892-L1922) |
| 10. 与 Prompt、数据集、实验联动 | 有 | Observation 带 prompt 名与版本；数据集运行项关联 Trace；`events_full` 带实验字段 | `packages/shared/clickhouse/migrations/canonical/0039_create_events_full.up.sql` L31-L33，[permalink](https://github.com/wzqwtt/langfuse/blob/f75c661dbe8c6b85523c81486b39e8403ac2c141/packages/shared/clickhouse/migrations/canonical/0039_create_events_full.up.sql#L31-L33)；`packages/shared/clickhouse/migrations/canonical/0024_dataset_run_items.up.sql` L8-L9，[permalink](https://github.com/wzqwtt/langfuse/blob/f75c661dbe8c6b85523c81486b39e8403ac2c141/packages/shared/clickhouse/migrations/canonical/0024_dataset_run_items.up.sql#L8-L9) |
| 11. 权限、隔离、RBAC、保留、公开分享 | 有 | 5 个角色加 scope；项目隔离靠 `project_id`；Trace 与 Session 可公开；保留需企业权益 | `packages/shared/src/features/rbac/projectAccessRights.ts` L105，[permalink](https://github.com/wzqwtt/langfuse/blob/f75c661dbe8c6b85523c81486b39e8403ac2c141/packages/shared/src/features/rbac/projectAccessRights.ts#L105)；`web/src/server/api/trpc.ts` L630-L640，[permalink](https://github.com/wzqwtt/langfuse/blob/f75c661dbe8c6b85523c81486b39e8403ac2c141/web/src/server/api/trpc.ts#L630-L640) |
| 12. 前端页面与组件 | 有 | Trace、Observation、Session、User、Score、Dashboard、Monitor 等页面齐全 | `web/src/features/traces/TracesPage.tsx` L97-L107，[permalink](https://github.com/wzqwtt/langfuse/blob/f75c661dbe8c6b85523c81486b39e8403ac2c141/web/src/features/traces/TracesPage.tsx#L97-L107)；`web/src/features/events/hooks/useEventsTraceData.ts` L62，[permalink](https://github.com/wzqwtt/langfuse/blob/f75c661dbe8c6b85523c81486b39e8403ac2c141/web/src/features/events/hooks/useEventsTraceData.ts#L62) |

## 推断

以下内容不是源码里直接写明的事实，是我根据上文事实做的推断。

- 【推断】旧笔记把 `v4BetaEnabled` 当成纯数据库开关，这不准确：默认 `events_only` 下它恒为 true，只有 `dual` 模式才看用户库里的 flag。依据：`auth.ts` 的 `v4BetaEnabled` 表达式（3.1）。
- 【推断】「Trace」在 v4 里是由 `events_full` 行按 `trace_id` 聚合出来的视图，不是一张表。依据：Postgres 无 Trace 表（3.2）、`is_app_root` 与 `trace_name` 列在 `events_full`（1.2）。
- 【推断】默认 `events_only` 下，v4 之前的 SDK 不能再用 legacy 写接口上报 Trace。依据：`/api/public/ingestion` 只收 `score-create`，legacy 写端点被拒绝（2.1）。
- 【推断】`events_only` 下公共 v1 读接口（traces、observations、scores v1/v2、sessions、metrics v1、dataset-run-items）全部 404，客户要读数据只能用 v2 observations、v3 scores、v2 metrics。依据：这些路由都设置了 `rejectInEventsOnlyMode`（本节上方 6.1、7.1、8、10.2 与 `createAuthedProjectAPIRoute.ts` 的 404 分支）。
- 【推断】Langfuse 的告警能力偏「指标告警」，不是「事件告警」。依据：Monitor 只支持 observation 与 score 视图（9.1），Trigger 事件源里没有 trace 或 score 创建（9.2）。
- 【推断】租户隔离主要靠手写 SQL 里的 `project_id` 条件，`query-ast` 的强制注入还没推广。依据：仅 `environments.ts` 调用 `compileClickhouseQuery`（4.4）。
- 【推断】Dashboard、Monitor、公共 metrics API 共用同一个查询引擎，所以「自定义图表能画的指标，就是 Monitor 能告警的指标（去掉 traces 视图）」。依据：三者都调用 `executeQuery`（第 8、9 节）。
- 【推断】Session 与 User 视图没有专门存储，是靠 `session_id`、`user_id` 列做聚合，所以对没有设置这两个字段的数据，这两个页面是空的。依据：6.1、6.2 的列定义与 `TraceSession` 表只存标志位。
- 【推断】评估器自己产生的 Trace 用「内部环境」隔离，是为了避免评估循环。依据：`isInternalEvalEnvironment` 守卫（7.3）与 `execution_trace_id`（7.1）。

## 对旧笔记的修正

- 旧笔记说 v4 读路径只在数据库 flag `v4BetaEnabled` 为 true 时启用。这不准确。
- 当前源码里，登录时 session 的 `v4BetaEnabled` 由写入模式推出。`events_only` 下它恒为 true。只有 `dual` 模式才看用户库里的 flag。
- 证据：[auth.ts L844-L847](https://github.com/wzqwtt/langfuse/blob/f75c661dbe8c6b85523c81486b39e8403ac2c141/web/src/server/auth.ts#L844-L847)。
