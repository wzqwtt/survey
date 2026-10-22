---
sidebar_position: 5
sidebar_label: 联动、治理与前端
title: coze-loop · 联动、治理与前端
description: coze-loop 的与 Prompt、评测、数据集联动，权限与隔离，前端页面。每条事实链到固定提交的源码。
tags: [LLM, 可观测性, Trace, coze-loop, Langfuse]
date: 2026-10-22
---

# coze-loop · 联动、治理与前端

本页覆盖：与 Prompt、评测、数据集联动，权限与隔离，前端页面。每条事实链到固定提交（`3a6a2bf0`）。回到 [coze-loop 总览](index.md)。

## 十、与 Prompt、评测、数据集的联动

### Prompt

- Prompt 调试按场景给 span 设置 `call_type`：`PromptPlayground` 或 `PromptDebug`；PTaaS 设为 `PTaaS`（[backend/modules/prompt/application/debug.go L66-L96](https://github.com/wzqwtt/coze-loop/blob/3a6a2bf07b057fec0c702e514e8345fb5684e83a/backend/modules/prompt/application/debug.go#L66-L96)、[backend/modules/prompt/application/openapi.go L1021](https://github.com/wzqwtt/coze-loop/blob/3a6a2bf07b057fec0c702e514e8345fb5684e83a/backend/modules/prompt/application/openapi.go#L1021)、[backend/modules/prompt/pkg/consts/trace.go L34-L37](https://github.com/wzqwtt/coze-loop/blob/3a6a2bf07b057fec0c702e514e8345fb5684e83a/backend/modules/prompt/pkg/consts/trace.go#L34-L37)）。
- Prompt 执行把 `prompt_key` 和版本记到 span 上，并放进 baggage（[backend/modules/prompt/domain/service/execute.go L338-L379](https://github.com/wzqwtt/coze-loop/blob/3a6a2bf07b057fec0c702e514e8345fb5684e83a/backend/modules/prompt/domain/service/execute.go#L338-L379)）。
- Prompt 平台的 Trace 列表只看 `call_type` 属于 `PromptPlayground`、`PromptDebug`、`PTaaS` 的 span（[backend/modules/observability/domain/trace/service/trace/span_filter/prompt_filter.go L20-L33](https://github.com/wzqwtt/coze-loop/blob/3a6a2bf07b057fec0c702e514e8345fb5684e83a/backend/modules/observability/domain/trace/service/trace/span_filter/prompt_filter.go#L20-L33)）。
- 观测列表有 `prompt_key` 列，用 `PromptSelect` 渲染（[frontend/packages/loop-pages/observation-pages/src/pages/trace/trace-render.tsx L26-L47](https://github.com/wzqwtt/coze-loop/blob/3a6a2bf07b057fec0c702e514e8345fb5684e83a/frontend/packages/loop-pages/observation-pages/src/pages/trace/trace-render.tsx#L26-L47)、[frontend/packages/loop-pages/observation-pages/src/pages/trace/trace-render.tsx L120-L128](https://github.com/wzqwtt/coze-loop/blob/3a6a2bf07b057fec0c702e514e8345fb5684e83a/frontend/packages/loop-pages/observation-pages/src/pages/trace/trace-render.tsx#L120-L128)）。
- Prompt 页面内嵌 Trace 详情：`TraceTab` 调 `observabilityTrace.ListSpans`，再渲染 `TraceDetail` 适配器（[frontend/packages/loop-pages/prompt-pages/src/components/trace-tabs/index.tsx L29-L31](https://github.com/wzqwtt/coze-loop/blob/3a6a2bf07b057fec0c702e514e8345fb5684e83a/frontend/packages/loop-pages/prompt-pages/src/components/trace-tabs/index.tsx#L29-L31)、[frontend/packages/loop-pages/prompt-pages/src/components/trace-tabs/index.tsx L60-L62](https://github.com/wzqwtt/coze-loop/blob/3a6a2bf07b057fec0c702e514e8345fb5684e83a/frontend/packages/loop-pages/prompt-pages/src/components/trace-tabs/index.tsx#L60-L62)）。
- 执行历史面板引用这个 `TraceTab`（[frontend/packages/loop-pages/prompt-pages/src/components/execute-history-panel/index.tsx L22](https://github.com/wzqwtt/coze-loop/blob/3a6a2bf07b057fec0c702e514e8345fb5684e83a/frontend/packages/loop-pages/prompt-pages/src/components/execute-history-panel/index.tsx#L22)、[frontend/packages/loop-pages/prompt-pages/src/components/execute-history-panel/index.tsx L166](https://github.com/wzqwtt/coze-loop/blob/3a6a2bf07b057fec0c702e514e8345fb5684e83a/frontend/packages/loop-pages/prompt-pages/src/components/execute-history-panel/index.tsx#L166)）。

### 评测

- 评估器平台只看 `call_type = Evaluator`，评测对象平台只看 `call_type = EvalTarget`（[backend/modules/observability/domain/trace/service/trace/span_filter/evaluator_filter.go L16-L29](https://github.com/wzqwtt/coze-loop/blob/3a6a2bf07b057fec0c702e514e8345fb5684e83a/backend/modules/observability/domain/trace/service/trace/span_filter/evaluator_filter.go#L16-L29)、[backend/modules/observability/domain/trace/service/trace/span_filter/eval_target_filter.go L16-L29](https://github.com/wzqwtt/coze-loop/blob/3a6a2bf07b057fec0c702e514e8345fb5684e83a/backend/modules/observability/domain/trace/service/trace/span_filter/eval_target_filter.go#L16-L29)）。
- 评测里的 prompt 执行默认把 `call_type` 设为 `Evaluation`（[backend/modules/prompt/application/execute.go L128-L143](https://github.com/wzqwtt/coze-loop/blob/3a6a2bf07b057fec0c702e514e8345fb5684e83a/backend/modules/prompt/application/execute.go#L128-L143)）。
- 评测实验详情用 `actual-output-with-trace` 组件，按 `traceID` 打开 Trace 详情（[frontend/packages/loop-modules/evaluate/src/components/experiment/actual-output-with-trace.tsx L62-L69](https://github.com/wzqwtt/coze-loop/blob/3a6a2bf07b057fec0c702e514e8345fb5684e83a/frontend/packages/loop-modules/evaluate/src/components/experiment/actual-output-with-trace.tsx#L62-L69)）。
- Span 到评测的链路在后端：自动评估处理器 `AutoEvaluateProcessor` 依赖 evaluator RPC 和 evaluation RPC，创建实验并逐 span 评测（[backend/modules/observability/domain/task/service/taskexe/processor/auto_evaluate.go L57-L82](https://github.com/wzqwtt/coze-loop/blob/3a6a2bf07b057fec0c702e514e8345fb5684e83a/backend/modules/observability/domain/task/service/taskexe/processor/auto_evaluate.go#L57-L82)、[backend/modules/observability/domain/task/service/taskexe/processor/auto_evaluate.go L120-L206](https://github.com/wzqwtt/coze-loop/blob/3a6a2bf07b057fec0c702e514e8345fb5684e83a/backend/modules/observability/domain/task/service/taskexe/processor/auto_evaluate.go#L120-L206)）。
- 评测目标类型里有 `Trace`（[idl/thrift/coze/loop/evaluation/domain/eval_target.thrift L91](https://github.com/wzqwtt/coze-loop/blob/3a6a2bf07b057fec0c702e514e8345fb5684e83a/idl/thrift/coze/loop/evaluation/domain/eval_target.thrift#L91)）。

### 数据集

- Trace 可导出到数据集，见第五节。
- 评测集业务分类 `from_online_trace` 表示数据来自在线 trace（[idl/thrift/coze/loop/evaluation/domain/eval_set.thrift L177](https://github.com/wzqwtt/coze-loop/blob/3a6a2bf07b057fec0c702e514e8345fb5684e83a/idl/thrift/coze/loop/evaluation/domain/eval_set.thrift#L177)）。
- 数据回流任务的配置结构存在（数据集 id、schema、字段映射），但没有对应处理器（[idl/thrift/coze/loop/observability/domain/task.thrift L99-L105](https://github.com/wzqwtt/coze-loop/blob/3a6a2bf07b057fec0c702e514e8345fb5684e83a/idl/thrift/coze/loop/observability/domain/task.thrift#L99-L105)）。

## 十一、权限、空间隔离、数据保留

### 权限与隔离

- 控制台接口用 `SessionMW` 的会话认证，OpenAPI 用 PAT，见第二节。
- Trace 相关动作名有 `readLoopTrace`、`ingestLoopTrace`、`listLoopTrace`、`createLoopTraceView`、`listLoopTraceView`、`createLoopTraceAnnotation`、`deleteLoopTraceAnnotation`、`exportLoopTrace`、`previewExportLoopTrace`、`createLoopTask`、`listLoopTask`、`readLoopIndictor`（[backend/modules/observability/domain/component/rpc/auth.go L8-L23](https://github.com/wzqwtt/coze-loop/blob/3a6a2bf07b057fec0c702e514e8345fb5684e83a/backend/modules/observability/domain/component/rpc/auth.go#L8-L23)）。
- 观测模块把这些检查统一交给 `MCheckPermission` RPC，`CheckWorkspacePermission` 忽略最后一个布尔参数（[backend/modules/observability/infra/rpc/auth/auth.go L26-L70](https://github.com/wzqwtt/coze-loop/blob/3a6a2bf07b057fec0c702e514e8345fb5684e83a/backend/modules/observability/infra/rpc/auth/auth.go#L26-L70)）。
- 开源版 `MCheckPermission` 只检查「用户是否属于该 space」，以及请求对象的 `space_id` 是否等于请求的 space（[backend/modules/foundation/application/auth.go L30-L70](https://github.com/wzqwtt/coze-loop/blob/3a6a2bf07b057fec0c702e514e8345fb5684e83a/backend/modules/foundation/application/auth.go#L30-L70)）。
- 它不看 `Action` 名，所以上面的动作名在开源版里不区分角色（[backend/modules/foundation/application/auth.go L45-L65](https://github.com/wzqwtt/coze-loop/blob/3a6a2bf07b057fec0c702e514e8345fb5684e83a/backend/modules/foundation/application/auth.go#L45-L65)）。
- 空间隔离体现在查询条件：所有列表和详情都带 workspace 条件（[backend/modules/observability/domain/trace/service/trace/span_filter/cozeloop_filter.go L16-L30](https://github.com/wzqwtt/coze-loop/blob/3a6a2bf07b057fec0c702e514e8345fb5684e83a/backend/modules/observability/domain/trace/service/trace/span_filter/cozeloop_filter.go#L16-L30)）。
- 开源版 `WorkspaceProvider` 的 `ClipTableByWorkspace` 原样返回表列表，没有按空间裁剪表（[backend/modules/observability/infra/workspace/workspace.go L21-L34](https://github.com/wzqwtt/coze-loop/blob/3a6a2bf07b057fec0c702e514e8345fb5684e83a/backend/modules/observability/infra/workspace/workspace.go#L21-L34)）。
- 视图按创建人隔离，见第五节。
- 租户（tenant）与空间（workspace）是两层概念：租户决定落哪张表，空间是 `space_id` 字段，见第三节。

### 数据保留

- 写入时按 TTL 档位选表，并写 `logic_delete_date`（见第三节）。
- 查询时间窗被 `trace_max_duration_day` 限制，开源默认 180 天（见第四节）。
- 读到空结果时，`ExpireErrorProcessor` 用权益的存储天数判断查询终点是否早于保留期，是则返回 `ExpiredTraceErrorCode`（[backend/modules/observability/domain/trace/service/trace/span_processor/expire_error_processor.go L29-L48](https://github.com/wzqwtt/coze-loop/blob/3a6a2bf07b057fec0c702e514e8345fb5684e83a/backend/modules/observability/domain/trace/service/trace/span_processor/expire_error_processor.go#L29-L48)、[backend/modules/observability/application/wire.go L234-L257](https://github.com/wzqwtt/coze-loop/blob/3a6a2bf07b057fec0c702e514e8345fb5684e83a/backend/modules/observability/application/wire.go#L234-L257)）。
- 清理任务：无。已在 `backend/modules/observability`、`release/deployment/docker-compose/bootstrap/clickhouse-init`、`release/deployment/docker-compose/conf/observability.yaml` 搜索 `DROP PARTITION`、`ALTER TABLE`、`DELETE FROM`、`MODIFY TTL`、`retention`，没有观测相关命中。
- 查询 SQL 不按 `logic_delete_date` 过滤。已在 `backend/modules/observability/infra/repo/ck/spans.go` 搜索，该字段只出现在列清单和字段白名单中（[backend/modules/observability/infra/repo/ck/spans.go L654](https://github.com/wzqwtt/coze-loop/blob/3a6a2bf07b057fec0c702e514e8345fb5684e83a/backend/modules/observability/infra/repo/ck/spans.go#L654)、[backend/modules/observability/infra/repo/ck/spans.go L680](https://github.com/wzqwtt/coze-loop/blob/3a6a2bf07b057fec0c702e514e8345fb5684e83a/backend/modules/observability/infra/repo/ck/spans.go#L680)）。

## 十二、前端：页面与组件清单

### 页面

- 控制台路由是 `observation/*`，懒加载 `@cozeloop/observation-pages`（[frontend/apps/cozeloop/src/routes/index.tsx L17](https://github.com/wzqwtt/coze-loop/blob/3a6a2bf07b057fec0c702e514e8345fb5684e83a/frontend/apps/cozeloop/src/routes/index.tsx#L17)、[frontend/apps/cozeloop/src/routes/index.tsx L77](https://github.com/wzqwtt/coze-loop/blob/3a6a2bf07b057fec0c702e514e8345fb5684e83a/frontend/apps/cozeloop/src/routes/index.tsx#L77)）。
- 导航文案是 `Trace`，菜单键是 `observation/traces`（[frontend/apps/cozeloop/src/components/navbar/menu-config.tsx L87-L96](https://github.com/wzqwtt/coze-loop/blob/3a6a2bf07b057fec0c702e514e8345fb5684e83a/frontend/apps/cozeloop/src/components/navbar/menu-config.tsx#L87-L96)）。
- `observation-pages` 只有三个源文件：`app.tsx`、`index.ts`、`pages/trace/{index,trace-render}.tsx`。
- `app.tsx` 把空路径重定向到 `traces` 并渲染 `TracesPage`（[frontend/packages/loop-pages/observation-pages/src/app.tsx L9-L11](https://github.com/wzqwtt/coze-loop/blob/3a6a2bf07b057fec0c702e514e8345fb5684e83a/frontend/packages/loop-pages/observation-pages/src/app.tsx#L9-L11)）。
- Trace 页面渲染 `CozeloopTraceListWithDetailPanel`，列表数据来自 `observabilityTrace.ListSpans`，详情来自 `GetTrace`（[frontend/packages/loop-pages/observation-pages/src/pages/trace/trace-render.tsx L69-L111](https://github.com/wzqwtt/coze-loop/blob/3a6a2bf07b057fec0c702e514e8345fb5684e83a/frontend/packages/loop-pages/observation-pages/src/pages/trace/trace-render.tsx#L69-L111)）。
- 页面列有 status、trace_id、input、output、tokens、latency、latency_first_resp、start_time、input_tokens、output_tokens、span_id、span_type、span_name、prompt_key、logic_delete_date（[frontend/packages/loop-pages/observation-pages/src/pages/trace/trace-render.tsx L26-L47](https://github.com/wzqwtt/coze-loop/blob/3a6a2bf07b057fec0c702e514e8345fb5684e83a/frontend/packages/loop-pages/observation-pages/src/pages/trace/trace-render.tsx#L26-L47)）。
- 页面没有其他子页面：无 dashboard、无 task、无 session。已列目录 `frontend/packages/loop-pages/observation-pages/src/pages/`，只有 `trace`。

### 组件包 `observation-components`

- 包内共 281 个文件，源码目录有 `features`、`shared`、`services`、`i18n`、`stories`、`assets`、`types`（`find frontend/packages/loop-components/observation-components/src -type f | wc -l`）。
- `features` 下有 `trace-list`、`trace-detail`、`trace-data`、`trace-selector` 四块。
- 对外导出的业务组件有 `CozeloopTraceList`、`CozeloopTraceDetail`、`CozeloopTraceDetailPanel`、`TraceSelector`、`CozeloopTraceListWithDetailPanel`、`PreselectedDatePicker`（[frontend/packages/loop-components/observation-components/src/index.ts L4-L26](https://github.com/wzqwtt/coze-loop/blob/3a6a2bf07b057fec0c702e514e8345fb5684e83a/frontend/packages/loop-components/observation-components/src/index.ts#L4-L26)）。
- 对外导出的通用组件有 `PromptSelect`、`FilterSelectUI`、`AnalyticsLogicExpr`、`ManualAnnotation`（[frontend/packages/loop-components/observation-components/src/index.ts L28-L41](https://github.com/wzqwtt/coze-loop/blob/3a6a2bf07b057fec0c702e514e8345fb5684e83a/frontend/packages/loop-components/observation-components/src/index.ts#L28-L41)、[frontend/packages/loop-components/observation-components/src/index.ts L60](https://github.com/wzqwtt/coze-loop/blob/3a6a2bf07b057fec0c702e514e8345fb5684e83a/frontend/packages/loop-components/observation-components/src/index.ts#L60)）。
- `trace-list` 子组件有 `banner`、`column-item`、`label-select`、`logic-left-expr`、`logic-right-expr`、`queries`。
- `trace-detail` 子组件有 `feedback`、`graphs`、`header`、`span-detail`、`span-detail-list`。
- 详情图表面板枚举目前只有 `runTree`（[frontend/packages/loop-components/observation-components/src/features/trace-detail/constants/tab.ts L2-L4](https://github.com/wzqwtt/coze-loop/blob/3a6a2bf07b057fec0c702e514e8345fb5684e83a/frontend/packages/loop-components/observation-components/src/features/trace-detail/constants/tab.ts#L2-L4)）。
- span 详情固定页签是 Run 和 Metadata（[frontend/packages/loop-components/observation-components/src/features/trace-detail/components/span-detail/index.tsx L38-L41](https://github.com/wzqwtt/coze-loop/blob/3a6a2bf07b057fec0c702e514e8345fb5684e83a/frontend/packages/loop-components/observation-components/src/features/trace-detail/components/span-detail/index.tsx#L38-L41)）。
- `trace-data/span-definition` 按 span 类型提供渲染：`default`、`model`、`prompt`、`query-span`、`retriever`、`user-input`。
- `shared/components` 有 `analytics-logic-expr`、`date-picker`、`filter-bar`、`jump-button`、`logic-expr`、`search-select`、`user-profile`。
- 时间范围预设从 5 分钟到 90 天（[frontend/packages/loop-components/observation-components/src/features/trace-list/constants/time.ts L22-L40](https://github.com/wzqwtt/coze-loop/blob/3a6a2bf07b057fec0c702e514e8345fb5684e83a/frontend/packages/loop-components/observation-components/src/features/trace-list/constants/time.ts#L22-L40)）。
- 筛选器默认平台是 `Cozeloop`，默认 span 类型是 `RootSpan`（[frontend/packages/loop-components/observation-components/src/features/trace-selector/index.tsx L290-L298](https://github.com/wzqwtt/coze-loop/blob/3a6a2bf07b057fec0c702e514e8345fb5684e83a/frontend/packages/loop-components/observation-components/src/features/trace-selector/index.tsx#L290-L298)）。
- 只有 `root_span` 列表会再请求 `BatchGetTracesAdvanceInfo` 补 token（[frontend/packages/loop-components/observation-components/src/features/trace-list/components/queries/table/hooks/use-fetch-traces.tsx L59-L88](https://github.com/wzqwtt/coze-loop/blob/3a6a2bf07b057fec0c702e514e8345fb5684e83a/frontend/packages/loop-components/observation-components/src/features/trace-list/components/queries/table/hooks/use-fetch-traces.tsx#L59-L88)）。
- 字段元数据来自 `GetTracesMetaInfo`（[frontend/packages/loop-components/observation-components/src/features/trace-list/hooks/use-get-meta-info.ts L31](https://github.com/wzqwtt/coze-loop/blob/3a6a2bf07b057fec0c702e514e8345fb5684e83a/frontend/packages/loop-components/observation-components/src/features/trace-list/hooks/use-get-meta-info.ts#L31)）。

### 适配层与其他使用方

- 适配接口在 `adapter-interfaces/src/observation/trace.ts`，实现在 `observation-adapter/src/components/trace-detail.tsx`（[frontend/packages/loop-components/adapter-interfaces/src/observation/trace.ts L1-L40](https://github.com/wzqwtt/coze-loop/blob/3a6a2bf07b057fec0c702e514e8345fb5684e83a/frontend/packages/loop-components/adapter-interfaces/src/observation/trace.ts#L1-L40)、[frontend/packages/loop-components/observation-adapter/src/components/trace-detail.tsx L1-L40](https://github.com/wzqwtt/coze-loop/blob/3a6a2bf07b057fec0c702e514e8345fb5684e83a/frontend/packages/loop-components/observation-adapter/src/components/trace-detail.tsx#L1-L40)）。
- 生成的 API 客户端在 `loop-base/api-schema/src/api/idl/observability/`，含 `trace`、`metric`、`task` 三个服务。
- 后端接口里没有前端调用的有：指标、任务、导出到数据集、thread 与 chat、column_extract_config、trajectory、`SearchTraceTree`（各项搜索范围见前文）。
