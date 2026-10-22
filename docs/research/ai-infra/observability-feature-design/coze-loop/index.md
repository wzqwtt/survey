---
sidebar_position: 1
sidebar_label: 总览
title: coze-loop 可观测功能设计
description: coze-loop 可观测模块的源码事实：能力清单、推断、对旧笔记的修正和调研限制。
tags: [LLM, 可观测性, Trace, coze-loop, Langfuse]
date: 2026-10-22
---

# coze-loop 可观测功能设计

本篇记录 coze-loop 可观测模块的源码事实。每条事实链到固定提交。推断单独标 **【推断】**。回到 [专题总览](../index.md)。

## 源码版本与约定

| 项 | 值 |
|---|---|
| 仓库 | [wzqwtt/coze-loop](https://github.com/wzqwtt/coze-loop) |
| 提交 | [`3a6a2bf0`](https://github.com/wzqwtt/coze-loop/tree/3a6a2bf07b057fec0c702e514e8345fb5684e83a) |

- 每条链接都指向该提交的 blob，带 `#L` 行号。
- 每个事实一句话。推断只放在「推断」一节，标 **【推断】**。
- 某项没找到时写「无」，并列出搜索位置。
- 本次调研重新校验了旧笔记里复用的行号。有三处说法做了修正，见「对旧笔记的修正」。
- 代码标识符保持英文。

## 文档地图

| 页面 | 内容 |
|---|---|
| [模型、采集与存储](model-ingest-storage.md) | Trace 模型、采集入口、鉴权限流、存储与保留 |
| [查询、视图与会话](query-views.md) | 列表与详情、过滤、聚合、视图预设、导出、会话视图 |
| [评分、指标与告警](feedback-metrics.md) | 评分与标注、自动评估、指标与大盘、告警与通知 |
| [联动、治理与前端](integration-governance.md) | 与 Prompt、评测、数据集联动，权限与隔离，前端页面 |
| [用户路径](user-path.md) | 从一次 SDK 上报到列表与详情可见的逐步路径 |

## 能力清单

| # | 能力 | 有/无/部分 | 一句话 | 证据 |
| --- | --- | --- | --- | --- |
| 1 | Trace / Span 模型 | 有 | 以 span 为存储对象，Trace 是按 `trace_id` 聚合的查询视图，有类型、状态、父子树、token。 | [idl/thrift/coze/loop/observability/domain/trace.thrift L3-L11](https://github.com/wzqwtt/coze-loop/blob/3a6a2bf07b057fec0c702e514e8345fb5684e83a/idl/thrift/coze/loop/observability/domain/trace.thrift#L3-L11)、[backend/modules/observability/domain/trace/entity/loop_span/span.go L65-L83](https://github.com/wzqwtt/coze-loop/blob/3a6a2bf07b057fec0c702e514e8345fb5684e83a/backend/modules/observability/domain/trace/entity/loop_span/span.go#L65-L83) |
| 1b | 金额成本 | 无 | 只有 token 数，没有单价和金额。 | [idl/thrift/coze/loop/observability/domain/trace.thrift L8-L11](https://github.com/wzqwtt/coze-loop/blob/3a6a2bf07b057fec0c702e514e8345fb5684e83a/idl/thrift/coze/loop/observability/domain/trace.thrift#L8-L11) |
| 2 | OpenAPI 写入 | 有 | PAT 鉴权，JSON 批量写入。 | [idl/thrift/coze/loop/observability/coze.loop.observability.openapi.thrift L232](https://github.com/wzqwtt/coze-loop/blob/3a6a2bf07b057fec0c702e514e8345fb5684e83a/idl/thrift/coze/loop/observability/coze.loop.observability.openapi.thrift#L232) |
| 2 | OTLP 写入 | 有 | 支持 protobuf 与 JSON、gzip，并做多种语义约定映射。 | [backend/modules/observability/application/openapi.go L263-L353](https://github.com/wzqwtt/coze-loop/blob/3a6a2bf07b057fec0c702e514e8345fb5684e83a/backend/modules/observability/application/openapi.go#L263-L353)、[backend/modules/observability/lib/otel/otel_convert.go L28-L282](https://github.com/wzqwtt/coze-loop/blob/3a6a2bf07b057fec0c702e514e8345fb5684e83a/backend/modules/observability/lib/otel/otel_convert.go#L28-L282) |
| 2 | MQ 与 collector | 有 | RocketMQ 解耦，collector 批量写 ClickHouse。 | [release/deployment/docker-compose/conf/observability.yaml L330-L355](https://github.com/wzqwtt/coze-loop/blob/3a6a2bf07b057fec0c702e514e8345fb5684e83a/release/deployment/docker-compose/conf/observability.yaml#L330-L355) |
| 2 | 写入限流 | 无 | 只限流查询和标注，写入没有限流。 | [backend/modules/observability/application/openapi.go L1147-L1209](https://github.com/wzqwtt/coze-loop/blob/3a6a2bf07b057fec0c702e514e8345fb5684e83a/backend/modules/observability/application/openapi.go#L1147-L1209) |
| 3 | ClickHouse 存储 | 有 | `observability_spans` 与 `observability_annotations`，带 bloom 与 tokenbf 索引。 | [release/deployment/docker-compose/bootstrap/clickhouse-init/init-sql/observability_spans.sql L1-L36](https://github.com/wzqwtt/coze-loop/blob/3a6a2bf07b057fec0c702e514e8345fb5684e83a/release/deployment/docker-compose/bootstrap/clickhouse-init/init-sql/observability_spans.sql#L1-L36) |
| 3 | TTL 档位与物理过期 | 部分 | 有 TTL 档位和 `logic_delete_date`，但 DDL 无 TTL 子句，也无清理任务。 | [backend/modules/observability/infra/repo/dao/converter/span.go L69-L83](https://github.com/wzqwtt/coze-loop/blob/3a6a2bf07b057fec0c702e514e8345fb5684e83a/backend/modules/observability/infra/repo/dao/converter/span.go#L69-L83) |
| 3 | 大字段对象存储 | 部分 | 有 `object_storage` 列和签名 URL，上传靠 SDK 或 file 服务，观测模块不写。 | [backend/modules/observability/domain/trace/service/trace/span_processor/attr_tos_processor.go L23-L72](https://github.com/wzqwtt/coze-loop/blob/3a6a2bf07b057fec0c702e514e8345fb5684e83a/backend/modules/observability/domain/trace/service/trace/span_processor/attr_tos_processor.go#L23-L72) |
| 3 | 多租户字段 | 有 | `space_id` 加租户到表的映射，开源默认单租户。 | [release/deployment/docker-compose/conf/observability.yaml L85-L93](https://github.com/wzqwtt/coze-loop/blob/3a6a2bf07b057fec0c702e514e8345fb5684e83a/release/deployment/docker-compose/conf/observability.yaml#L85-L93) |
| 4 | 列表 / 详情 / 树查询 | 有 | 列表、详情、搜索树、批量 token 均有接口。 | [idl/thrift/coze/loop/observability/coze.loop.observability.trace.thrift L626-L632](https://github.com/wzqwtt/coze-loop/blob/3a6a2bf07b057fec0c702e514e8345fb5684e83a/idl/thrift/coze/loop/observability/coze.loop.observability.trace.thrift#L626-L632) |
| 4 | 过滤语法 | 有 | 嵌套 and/or，12 种查询类型，自定义与系统字段。 | [idl/thrift/coze/loop/observability/domain/filter.thrift L5-L54](https://github.com/wzqwtt/coze-loop/blob/3a6a2bf07b057fec0c702e514e8345fb5684e83a/idl/thrift/coze/loop/observability/domain/filter.thrift#L5-L54) |
| 4 | 排序 | 部分 | 只有「按 `start_time` 倒序」一种，`field` 与 `is_asc` 不生效。 | [backend/modules/observability/application/trace.go L217-L225](https://github.com/wzqwtt/coze-loop/blob/3a6a2bf07b057fec0c702e514e8345fb5684e83a/backend/modules/observability/application/trace.go#L217-L225) |
| 4 | 分页 | 有 | 游标式，页大小上限 1000。 | [backend/modules/observability/infra/repo/trace.go L215-L277](https://github.com/wzqwtt/coze-loop/blob/3a6a2bf07b057fec0c702e514e8345fb5684e83a/backend/modules/observability/infra/repo/trace.go#L215-L277) |
| 4 | 列表聚合 | 无 | 列表接口无 group by，聚合只在指标、thread 统计、标签统计里。 | [backend/modules/observability/domain/trace/service/trace_service.go L3370-L3427](https://github.com/wzqwtt/coze-loop/blob/3a6a2bf07b057fec0c702e514e8345fb5684e83a/backend/modules/observability/domain/trace/service/trace_service.go#L3370-L3427) |
| 5 | 视图（保存过滤） | 有 | MySQL 存储，按用户隔离，有系统视图，前端可增删改。 | [backend/modules/observability/infra/repo/mysql/view.go L59-L74](https://github.com/wzqwtt/coze-loop/blob/3a6a2bf07b057fec0c702e514e8345fb5684e83a/backend/modules/observability/infra/repo/mysql/view.go#L59-L74)、[frontend/packages/loop-components/observation-components/src/shared/components/filter-bar/custom-view.tsx L154-L182](https://github.com/wzqwtt/coze-loop/blob/3a6a2bf07b057fec0c702e514e8345fb5684e83a/frontend/packages/loop-components/observation-components/src/shared/components/filter-bar/custom-view.tsx#L154-L182) |
| 5 | 列表列配置 | 部分 | 前端存 `localStorage`；后端 `column_extract_config` 无前端调用。 | [frontend/packages/loop-components/observation-components/src/features/trace-list/hooks/use-column.ts L27-L36](https://github.com/wzqwtt/coze-loop/blob/3a6a2bf07b057fec0c702e514e8345fb5684e83a/frontend/packages/loop-components/observation-components/src/features/trace-list/hooks/use-column.ts#L27-L36) |
| 5 | 导出 | 部分 | 后端支持导出到数据集，前端无入口；无文件导出。 | [backend/modules/observability/domain/trace/service/trace_export_service.go L136-L201](https://github.com/wzqwtt/coze-loop/blob/3a6a2bf07b057fec0c702e514e8345fb5684e83a/backend/modules/observability/domain/trace/service/trace_export_service.go#L136-L201) |
| 6 | Session / thread / chat | 部分 | 后端有 thread 与 chat 四个接口，靠 `thread_id` 标签；前端未接入。 | [backend/modules/observability/domain/trace/service/trace_service.go L3016-L3427](https://github.com/wzqwtt/coze-loop/blob/3a6a2bf07b057fec0c702e514e8345fb5684e83a/backend/modules/observability/domain/trace/service/trace_service.go#L3016-L3427) |
| 7 | 手工标注 | 部分 | 后端与标注面板组件齐全，Trace 页未挂载 Feedback。 | [backend/modules/observability/domain/trace/service/trace_service.go L1955-L1998](https://github.com/wzqwtt/coze-loop/blob/3a6a2bf07b057fec0c702e514e8345fb5684e83a/backend/modules/observability/domain/trace/service/trace_service.go#L1955-L1998)、[frontend/packages/loop-components/observation-components/src/trace-list-with-detail-panel.tsx L390](https://github.com/wzqwtt/coze-loop/blob/3a6a2bf07b057fec0c702e514e8345fb5684e83a/frontend/packages/loop-components/observation-components/src/trace-list-with-detail-panel.tsx#L390) |
| 7 | OpenAPI 标注 | 有 | 可按 trace 与 key 创建和删除反馈，有独立限流。 | [backend/modules/observability/application/openapi.go L463-L556](https://github.com/wzqwtt/coze-loop/blob/3a6a2bf07b057fec0c702e514e8345fb5684e83a/backend/modules/observability/application/openapi.go#L463-L556) |
| 7 | 自动评估 | 部分 | 任务、采样、回填、回写标注都有；实时触发缺生产者，前端无入口。 | [backend/modules/observability/domain/task/service/taskexe/tracehub/span_trigger.go L69-L109](https://github.com/wzqwtt/coze-loop/blob/3a6a2bf07b057fec0c702e514e8345fb5684e83a/backend/modules/observability/domain/task/service/taskexe/tracehub/span_trigger.go#L69-L109) |
| 7 | 数据回流任务 | 无 | 只有 IDL 类型和 `Noop` 处理器。 | [backend/modules/observability/domain/task/service/taskexe/processor/noop.go L12-L30](https://github.com/wzqwtt/coze-loop/blob/3a6a2bf07b057fec0c702e514e8345fb5684e83a/backend/modules/observability/domain/task/service/taskexe/processor/noop.go#L12-L30) |
| 8 | 指标聚合与时序 | 部分 | 约 55 个指标，支持粒度、对比、下钻；仅在线查询，无前端。 | [backend/modules/observability/domain/metric/entity/metric.go L41-L114](https://github.com/wzqwtt/coze-loop/blob/3a6a2bf07b057fec0c702e514e8345fb5684e83a/backend/modules/observability/domain/metric/entity/metric.go#L41-L114) |
| 8 | 离线指标 | 无 | DAO 是空实现，开关默认关。 | [backend/modules/observability/infra/repo/ck/metric.go L13-L25](https://github.com/wzqwtt/coze-loop/blob/3a6a2bf07b057fec0c702e514e8345fb5684e83a/backend/modules/observability/infra/repo/ck/metric.go#L13-L25) |
| 8 | 大盘页面 | 无 | 前端没有指标调用和图表页。 | [frontend/apps/cozeloop/src/components/navbar/menu-config.tsx L87-L96](https://github.com/wzqwtt/coze-loop/blob/3a6a2bf07b057fec0c702e514e8345fb5684e83a/frontend/apps/cozeloop/src/components/navbar/menu-config.tsx#L87-L96) |
| 8 | 延迟统计 | 有 | pct50/90/99、avg、max、min，含 TTFT 与 TPOT。 | [backend/modules/observability/domain/metric/service/metric/model/model_duration_metric.go L55-L57](https://github.com/wzqwtt/coze-loop/blob/3a6a2bf07b057fec0c702e514e8345fb5684e83a/backend/modules/observability/domain/metric/service/metric/model/model_duration_metric.go#L55-L57) |
| 9 | 告警与通知 | 无 | 观测模块、IDL、部署配置、前端均无告警。 | 见第九节搜索清单 |
| 10 | 链接 Prompt | 有 | `prompt_key` 列与过滤、Prompt 页内嵌 Trace、`call_type` 平台过滤。 | [backend/modules/observability/domain/trace/service/trace/span_filter/prompt_filter.go L20-L33](https://github.com/wzqwtt/coze-loop/blob/3a6a2bf07b057fec0c702e514e8345fb5684e83a/backend/modules/observability/domain/trace/service/trace/span_filter/prompt_filter.go#L20-L33)、[frontend/packages/loop-pages/prompt-pages/src/components/trace-tabs/index.tsx L60-L62](https://github.com/wzqwtt/coze-loop/blob/3a6a2bf07b057fec0c702e514e8345fb5684e83a/frontend/packages/loop-pages/prompt-pages/src/components/trace-tabs/index.tsx#L60-L62) |
| 10 | 链接评测 | 部分 | 评估器与评测对象平台过滤、实验页打开 Trace、后端自动评估；Trace 页无入口。 | [backend/modules/observability/domain/task/service/taskexe/processor/auto_evaluate.go L57-L82](https://github.com/wzqwtt/coze-loop/blob/3a6a2bf07b057fec0c702e514e8345fb5684e83a/backend/modules/observability/domain/task/service/taskexe/processor/auto_evaluate.go#L57-L82) |
| 10 | Trace 到数据集 | 部分 | 后端导出与预览齐全，前端无入口。 | [idl/thrift/coze/loop/observability/coze.loop.observability.trace.thrift L642-L643](https://github.com/wzqwtt/coze-loop/blob/3a6a2bf07b057fec0c702e514e8345fb5684e83a/idl/thrift/coze/loop/observability/coze.loop.observability.trace.thrift#L642-L643) |
| 11 | 权限 | 部分 | 动作名齐全，但开源 `MCheckPermission` 只检查空间成员。 | [backend/modules/foundation/application/auth.go L30-L70](https://github.com/wzqwtt/coze-loop/blob/3a6a2bf07b057fec0c702e514e8345fb5684e83a/backend/modules/foundation/application/auth.go#L30-L70) |
| 11 | 空间隔离 | 有 | 查询带 workspace 条件，视图按用户隔离。 | [backend/modules/observability/domain/trace/service/trace/span_filter/cozeloop_filter.go L16-L30](https://github.com/wzqwtt/coze-loop/blob/3a6a2bf07b057fec0c702e514e8345fb5684e83a/backend/modules/observability/domain/trace/service/trace/span_filter/cozeloop_filter.go#L16-L30) |
| 11 | 数据保留 | 部分 | 有 TTL 档位、查询窗口、过期报错；无物理清理。 | [backend/modules/observability/domain/trace/service/trace/span_processor/expire_error_processor.go L29-L48](https://github.com/wzqwtt/coze-loop/blob/3a6a2bf07b057fec0c702e514e8345fb5684e83a/backend/modules/observability/domain/trace/service/trace/span_processor/expire_error_processor.go#L29-L48) |
| 12 | 前端页面与组件 | 部分 | 只有一个 Trace 页；组件包含列表、详情、选择器、span 渲染，其余能力无页面。 | [frontend/packages/loop-pages/observation-pages/src/app.tsx L9-L11](https://github.com/wzqwtt/coze-loop/blob/3a6a2bf07b057fec0c702e514e8345fb5684e83a/frontend/packages/loop-pages/observation-pages/src/app.tsx#L9-L11)、[frontend/packages/loop-components/observation-components/src/index.ts L4-L26](https://github.com/wzqwtt/coze-loop/blob/3a6a2bf07b057fec0c702e514e8345fb5684e83a/frontend/packages/loop-components/observation-components/src/index.ts#L4-L26) |

## 推断

以下不是源码直接写出的结论。

- **【推断】** 产品里的一条 Trace 是同一 `trace_id` 下 span 的查询视图，存储层没有独立 Trace 行。依据：第一节的 DDL 和 `GetTrace`。
- **【推断】** Prompt 调试、Evaluator、评测对象和用户 SDK 的 span 都落在同一张 `observability_spans` 表，靠 `call_type` 区分平台。依据：默认配置把四个平台都映射到租户 `cozeloop`，且各平台过滤器只比较 `call_type`。
- **【推断】** 外部 SDK 上报的 span，`call_type` 恒为 `Custom`，所以只在 `cozeloop` 平台列表可见。依据：`GetCallType` 恒返回 `"Custom"`。
- **【推断】** 默认开源配置下，自动评估任务的实时触发很可能不会运行。依据：`trace_to_task` 在仓库里没有生产者，且 `SpanTrigger` 先读配置键 `consumer_listening`，默认 `observability.yaml` 里没有这个键；`IsAllSpace` 与 `SpaceList` 取零值时所有任务会被跳过。这一条没有实际运行验证。
- **【推断】** 另一条触发路径是「给 span 写入标注后，带标注的 span 事件触发任务匹配」，它不依赖 `trace_to_task`，但同样受 `consumer_listening` 影响。
- **【推断】** `logic_delete_date` 是给外部清理或运维用的标记，开源仓库本身不会据此删除数据。依据：DDL 无 `TTL`，没有清理任务，查询不按该字段过滤。因此默认部署的数据会一直增长，直到运维自行配置 ClickHouse TTL 或清理。
- **【推断】** 数据保留的「生效」主要体现在查询窗口上限和空结果时的过期报错，而不是物理删除。
- **【推断】** 指标与任务后端已实现但开源前端未接入，可能是商业版 UI 使用这些接口。依据：生成的 API 客户端有，前端业务源码没有调用。
- **【推断】** Feedback 页签和标注面板是为 Trace 详情预留的，开源 Trace 页没有挂载。
- **【推断】** 开源版没有角色级权限。依据：`MCheckPermission` 只看空间成员关系，不看 `Action`。
- **【推断】** 要做金额成本统计，需要新增模型单价配置和计价逻辑。依据：现有只有 token 汇总，没有金额字段。
- **【推断】** `order_bys` 在开源实现里等价于一个「是否倒序」开关。依据：只判断是否非空，不读字段名。

## 对旧笔记的修正

- 旧笔记 说「内部 `IngestTracesInner` 没有 HTTP 路由」。这一点成立，且补充：平台自身用 `cozeloop-go` 加自定义 exporter 经该入口上报，见第二节。
- 旧笔记的「OpenAPI 还有 search、search_tree、list（L234-L238）」是概括。精确的是 L234 `traces/search`、L235 `traces/search_tree`、L236 `spans/search`、L237 `pre_span/search`、L238 `traces/list`、L239 `traces/trajectory`。
- 旧笔记没有覆盖指标、任务、告警、数据保留和权限，这些是本报告新增的内容。

## 未覆盖与限制

- 没有运行服务，所有结论来自静态阅读。
- 外部 SDK（`cozeloop-go` 等）源码不在本仓库，SDK 侧的批量、重试、限流行为未核实。
- 没有逐条阅读 `trace_field_meta_info` 里每个字段的过滤类型，只列了字段名。
- 商业版（闭源）可能有开源仓库里看不到的前端和后端能力。
