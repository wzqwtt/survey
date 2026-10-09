---
sidebar_position: 2
sidebar_label: 信号与迁移
title: 信号模型、旧版差异、输入输出和上下文
description: 生成式 AI 语义约定里 Span、事件、指标和日志各记什么，以及相对 v1.36 的迁移、脱敏、截断和多 Agent 父子关系。
tags: [OpenTelemetry, GenAI, Agent, 可观测性]
date: 2026-10-09
---

# 信号模型、旧版差异、输入输出和上下文

本页钉住提交 `06ec68e722c45a7218e23ea1bc1339fe4e21ecae`。名称和稳定状态见 [概览](index.md)。

## Span 记什么

Span 表示调用方看到的一次逻辑操作。Span 覆盖操作的持续时间。起点是操作开始。终点是响应收齐，或操作因错误、取消而结束。请求被自动重试时，同一个 Span 覆盖包含全部重试的逻辑操作。[gen-ai-spans.md L28-L35](https://github.com/open-telemetry/semantic-conventions-genai/blob/06ec68e722c45a7218e23ea1bc1339fe4e21ecae/docs/gen-ai/gen-ai-spans.md#L28-L35)

Span 上放这些内容：

- Span 名和 Span 种类。
- `gen_ai.operation.name`，以及该操作要求的身份字段，例如 `gen_ai.provider.name`、`gen_ai.agent.name`、`gen_ai.tool.name`。
- 低基数的请求参数和响应字段，例如温度、结束原因、token 计数。
- 选择加入之后，才放指令、输入消息、输出消息、工具定义、工具参数和工具结果。

Span 状态遵循核心约定的 Recording Errors。[client-inference.md L62](https://github.com/open-telemetry/semantic-conventions-genai/blob/06ec68e722c45a7218e23ea1bc1339fe4e21ecae/docs/gen-ai/client-inference.md#L62)

## 事件记什么

规范把“事件”指向日志数据模型里的 Event，固定到 OpenTelemetry 规范 `v1.55.0` 的日志数据模型。[client-inference.md L832](https://github.com/open-telemetry/semantic-conventions-genai/blob/06ec68e722c45a7218e23ea1bc1339fe4e21ecae/docs/gen-ai/client-inference.md#L832)

本提交定义三个事件。三个事件的稳定级别都是 Development。

| 事件名 | 要求级别 | 严重级别 | 记什么 |
|---|---|---|---|
| `gen_ai.client.inference.operation.details` | 选择加入 | 应当设为 DEBUG，严重级别数字 5 | 一次补全的对话历史和参数。属性组与推理客户端 Span 相同。可以独立于 Trace 存放输入和输出。[events.yaml L3-L15](https://github.com/open-telemetry/semantic-conventions-genai/blob/06ec68e722c45a7218e23ea1bc1339fe4e21ecae/model/gen-ai/events.yaml#L3-L15) |
| `gen_ai.evaluation.result` | 建议 | 规范未指定数字 | 对生成结果的质量、准确性或其他特性做评估。能挂到被评估操作的 Span 时应当挂上。没有 Span id 时设置 `gen_ai.response.id`。[events.yaml L16-L21](https://github.com/open-telemetry/semantic-conventions-genai/blob/06ec68e722c45a7218e23ea1bc1339fe4e21ecae/model/gen-ai/events.yaml#L16-L21) |
| `gen_ai.client.operation.exception` | 建议 | 应当设为 WARN，严重级别数字 13 | 客户端操作中的异常，例如 API 错误、限流、模型错误、超时。`exception.message` 与 `exception.type` 至少有一个。`exception.message` 可能含敏感信息。[gen-ai-exceptions.md L26-L50](https://github.com/open-telemetry/semantic-conventions-genai/blob/06ec68e722c45a7218e23ea1bc1339fe4e21ecae/docs/gen-ai/gen-ai-exceptions.md#L26-L50) |

评估事件的属性：

| 属性 | 类型 | 要求级别 | 示例 |
|---|---|---|---|
| `gen_ai.evaluation.name` | string | 必填 | `Relevance`、`IntentResolution` |
| `gen_ai.evaluation.score.value` | double | 适用时必填 | `4.0` |
| `gen_ai.evaluation.score.label` | string | 适用时必填 | `relevant`、`not_relevant`、`correct`、`incorrect`、`pass`、`fail` |
| `gen_ai.evaluation.explanation` | string | 建议 | 一句自由文本解释 |
| `gen_ai.response.id` | string | 有标识时建议 | `chatcmpl-123` |
| `error.type` | string | 操作以错误结束时必填 | `timeout`、`500`、`_OTHER` |

标签应当是低基数。同一分数在不同评估器里含义可以不同，实现方应当写明可能的标签。[gen-ai-events.md L39-L52](https://github.com/open-telemetry/semantic-conventions-genai/blob/06ec68e722c45a7218e23ea1bc1339fe4e21ecae/docs/gen-ai/gen-ai-events.md#L39-L52)

异常事件可以选择把对应客户端 Span 上的属性也抄到事件上。这是配置项，不是默认行为。[events.yaml L54-L55](https://github.com/open-telemetry/semantic-conventions-genai/blob/06ec68e722c45a7218e23ea1bc1339fe4e21ecae/model/gen-ai/events.yaml#L54-L55)

## 指标记什么

指标都是 Development。时长单位是 `s`。token 单位是 `{token}`。调用次数单位是 `{inference_call}` 或 `{tool_call}`。

推理操作使用 `gen_ai.client.inference.duration`。规范写明：推理操作不应当上报 `gen_ai.client.operation.duration`。[metrics.yaml L21-L28](https://github.com/open-telemetry/semantic-conventions-genai/blob/06ec68e722c45a7218e23ea1bc1339fe4e21ecae/model/gen-ai/metrics.yaml#L21-L28)

| 指标 | 仪器 | 记录边界 |
|---|---|---|
| `gen_ai.client.inference.duration` | 直方图，double | 客户端发出推理请求，到响应收齐，或错误、取消。与推理 Span 同时上报时，值应当等于 Span 时长。[metrics.yaml L39-L51](https://github.com/open-telemetry/semantic-conventions-genai/blob/06ec68e722c45a7218e23ea1bc1339fe4e21ecae/model/gen-ai/metrics.yaml#L39-L51) |
| `gen_ai.client.inference.time_to_first_chunk` | 直方图 | 仅流式。从发出请求到收到第一块。[metrics.yaml L59-L65](https://github.com/open-telemetry/semantic-conventions-genai/blob/06ec68e722c45a7218e23ea1bc1339fe4e21ecae/model/gen-ai/metrics.yaml#L59-L65) |
| `gen_ai.client.inference.time_per_output_chunk` | 直方图 | 仅流式。第一块之后，每一块相对上一块结束的耗时。[metrics.yaml L72-L78](https://github.com/open-telemetry/semantic-conventions-genai/blob/06ec68e722c45a7218e23ea1bc1339fe4e21ecae/model/gen-ai/metrics.yaml#L72-L78) |
| `gen_ai.client.operation.duration` | 直方图 | 非推理的客户端操作。涉及提供方调用时，`gen_ai.provider.name` 为有条件必填。[metrics.yaml L21-L38](https://github.com/open-telemetry/semantic-conventions-genai/blob/06ec68e722c45a7218e23ea1bc1339fe4e21ecae/model/gen-ai/metrics.yaml#L21-L38) |
| `gen_ai.server.request.duration` | 直方图 | 服务端请求时长，例如到最后一个字节或最后一个输出 token。[metrics.yaml L85-L89](https://github.com/open-telemetry/semantic-conventions-genai/blob/06ec68e722c45a7218e23ea1bc1339fe4e21ecae/model/gen-ai/metrics.yaml#L85-L89) |
| `gen_ai.server.time_to_first_token` | 直方图 | 成功响应里，生成第一个 token 的时间。[metrics.yaml L109-L113](https://github.com/open-telemetry/semantic-conventions-genai/blob/06ec68e722c45a7218e23ea1bc1339fe4e21ecae/model/gen-ai/metrics.yaml#L109-L113) |
| `gen_ai.server.time_per_output_token` | 直方图 | 成功响应里，第一个 token 之后每个输出 token 的时间。[metrics.yaml L98-L102](https://github.com/open-telemetry/semantic-conventions-genai/blob/06ec68e722c45a7218e23ea1bc1339fe4e21ecae/model/gen-ai/metrics.yaml#L98-L102) |
| `gen_ai.invoke_agent.duration` | 直方图 | 一次进程内 Agent 调用，从开始到最后一块最终响应，或到错误结束。与 `gen_ai.invoke_agent.internal` 同时上报时，值应当等于 Span 时长。[metrics.yaml L149-L173](https://github.com/open-telemetry/semantic-conventions-genai/blob/06ec68e722c45a7218e23ea1bc1339fe4e21ecae/model/gen-ai/metrics.yaml#L149-L173) |
| `gen_ai.invoke_agent.inference_calls` | 直方图，int | 这一次调用里，该 Agent 自己发出的推理次数，含失败。子 Agent 的调用记在子 Agent 自己的调用上，整棵树上每个推理调用只计一次。[metrics.yaml L180-L192](https://github.com/open-telemetry/semantic-conventions-genai/blob/06ec68e722c45a7218e23ea1bc1339fe4e21ecae/model/gen-ai/metrics.yaml#L180-L192) |
| `gen_ai.invoke_agent.tool_calls` | 直方图，int | 这一次调用里，该 Agent 自己触发的客户端工具次数，含失败。提供方在服务端执行的内置工具不计入，例如提供方内置的网页搜索或代码执行。[metrics.yaml L203-L219](https://github.com/open-telemetry/semantic-conventions-genai/blob/06ec68e722c45a7218e23ea1bc1339fe4e21ecae/model/gen-ai/metrics.yaml#L203-L219) |
| `gen_ai.execute_tool.duration` | 直方图 | 单次工具执行。与 `gen_ai.execute_tool` Span 同时上报时，值应当等于 Span 时长。[metrics.yaml L229-L241](https://github.com/open-telemetry/semantic-conventions-genai/blob/06ec68e722c45a7218e23ea1bc1339fe4e21ecae/model/gen-ai/metrics.yaml#L229-L241) |
| `gen_ai.invoke_workflow.duration` | 直方图 | 工作流端到端时长，与工作流内部复杂度无关。只能量到单次提供方调用时，应当改用 `gen_ai.client.operation.duration`。两个边界都有时，可以同时上报。[metrics.yaml L119-L137](https://github.com/open-telemetry/semantic-conventions-genai/blob/06ec68e722c45a7218e23ea1bc1339fe4e21ecae/model/gen-ai/metrics.yaml#L119-L137) |

token 指标分两类。计数器按模态累计。直方图按一次推理操作记录。拿不到计数时，不得上报用量指标。可以让用户打开离线计数。提供方同时给出已用 token 和计费 token 时，必须上报计费 token。[token-metrics.yaml L16-L21](https://github.com/open-telemetry/semantic-conventions-genai/blob/06ec68e722c45a7218e23ea1bc1339fe4e21ecae/model/gen-ai/token-metrics.yaml#L16-L21) 与 [token-metrics.yaml L84-L95](https://github.com/open-telemetry/semantic-conventions-genai/blob/06ec68e722c45a7218e23ea1bc1339fe4e21ecae/model/gen-ai/token-metrics.yaml#L84-L95)

| 指标 | 仪器 | 含义 |
|---|---|---|
| `gen_ai.client.inference.usage.input_tokens` | 计数器 | 输入 token，含缓存。属性 `gen_ai.token.modality` 必填。 |
| `gen_ai.client.inference.usage.output_tokens` | 计数器 | 输出 token，含推理 token。 |
| `gen_ai.client.inference.usage.cache_read.input_tokens` | 计数器 | 从提供方缓存读出的输入 token。它是输入 token 的子集。 |
| `gen_ai.client.inference.usage.cache_write.input_tokens` | 计数器 | 写入提供方缓存的输入 token。它是输入 token 的子集。 |
| `gen_ai.client.inference.usage.reasoning.output_tokens` | 计数器 | 推理用的输出 token。它是输出 token 的子集。 |
| `gen_ai.client.inference.operation.input_tokens` | 直方图 | 每次推理操作的输入 token。 |
| `gen_ai.client.inference.operation.output_tokens` | 直方图 | 每次推理操作的输出 token。 |

`gen_ai.token.modality` 的成员是 `text`、`image`、`audio`、`unknown`。提供方不按模态拆分、仪器也无法可靠判断时，应当记在 `unknown`。[registry.yaml L398-L421](https://github.com/open-telemetry/semantic-conventions-genai/blob/06ec68e722c45a7218e23ea1bc1339fe4e21ecae/model/gen-ai/registry.yaml#L398-L421)

`fetch_response` 不得上报 token 用量，无论是属性还是指标。[registry.yaml L666-L670](https://github.com/open-telemetry/semantic-conventions-genai/blob/06ec68e722c45a7218e23ea1bc1339fe4e21ecae/model/gen-ai/registry.yaml#L666-L670)

## 日志记什么

规范没有另外定义“普通日志”正文格式。它定义的日志信号就是上一节的事件：事件名、严重级别、属性。异常的消息、类型和栈在 `gen_ai.client.operation.exception` 上，使用核心约定的 `exception.message`、`exception.type`、`exception.stacktrace`。

旧版把每条聊天消息记成 Span 事件。现行文本把那组名字标成废弃，见下一节。

## 和旧版的差异

这里的“旧版”指主仓库 `v1.36.0`（提交 `4b2c0e6544d740178c9c77809d25705e77acd0b0`）及更早。`v1.37.0`（提交 `aec6e9d3e86754683dab7c707655d69d953b2768`）改了内容模型和提供方字段。`v1.42.0`（提交 `ae3a98640194ed405c4c797281502e4d3bd258b3`）把整套约定迁到本仓库。

`v1.37.0` 的迁移规则写在 Span 页的警告里：

- 已经按 `v1.36.0` 或更早输出的仪器，默认不应当改它所发出的约定版本。这包括属性、指标、Span 名、事件名、Span 种类和计量单位。
- 仪器应当提供环境变量 `OTEL_SEMCONV_STABILITY_OPT_IN`。它是逗号分隔的类别列表。
- 值 `gen_ai_latest_experimental` 表示发出仪器所支持的最新实验约定，并且不再发旧约定。
- 默认行为是继续发仪器原来的版本，即 `v1.36.0` 或更早。
- 约定标成 stable 之前，这份过渡计划会再更新。

[v1.37.0 gen-ai-spans.md L26-L44](https://github.com/open-telemetry/semantic-conventions/blob/aec6e9d3e86754683dab7c707655d69d953b2768/docs/gen-ai/gen-ai-spans.md#L26-L44)

### 内容从“每条消息一个事件”变成属性

`v1.36.0` 的事件页列出五个事件名，每个事件名都必须使用对应字符串：[v1.36.0 gen-ai-events.md L47-L58](https://github.com/open-telemetry/semantic-conventions/blob/4b2c0e6544d740178c9c77809d25705e77acd0b0/docs/gen-ai/gen-ai-events.md#L47-L58) 以及同文件后续各节。

| v1.36.0 的事件名 | v1.37.0 起的替代 |
|---|---|
| `gen_ai.system.message` | `gen_ai.system_instructions`，或放进 `gen_ai.input.messages` |
| `gen_ai.user.message` | `gen_ai.input.messages` |
| `gen_ai.assistant.message` | `gen_ai.input.messages` |
| `gen_ai.tool.message` | `gen_ai.input.messages` |
| `gen_ai.choice` | `gen_ai.output.messages` |

这些属性可以出现在生成式 AI Span 上，也可以出现在新事件 `gen_ai.client.inference.operation.details` 上。内容采集关闭时，新属性默认不记录。[v1.37.0 CHANGELOG L14-L27](https://github.com/open-telemetry/semantic-conventions/blob/aec6e9d3e86754683dab7c707655d69d953b2768/CHANGELOG.md#L14-L27)

### 字段改名

| 旧名字 | 现行名字 | 出处 |
|---|---|---|
| `gen_ai.system` | `gen_ai.provider.name` | [v1.37.0 CHANGELOG L30-L31](https://github.com/open-telemetry/semantic-conventions/blob/aec6e9d3e86754683dab7c707655d69d953b2768/CHANGELOG.md#L30-L31) |
| `gen_ai.openai.*` | 去掉 `gen_ai` 前缀，成为 `openai.*` | 同一条 changelog |
| `az.ai.*` | `azure.ai.*` | 同一条 changelog |
| `gen_ai.client.token.usage` | 拆成按模态的计数器，以及每次操作的直方图。旧指标是直方图，单位 `{token}`，描述为测量输入和输出 token 数量。[v1.36.0 gen-ai-metrics.md L36-L58](https://github.com/open-telemetry/semantic-conventions/blob/4b2c0e6544d740178c9c77809d25705e77acd0b0/docs/gen-ai/gen-ai-metrics.md#L36-L58) | 现行定义见上一节 token 表 |

`v1.36.0` 的 `gen_ai.system` 是必填。没有已知值时应当设为 `_OTHER`。[v1.36.0 gen-ai-spans.md L48](https://github.com/open-telemetry/semantic-conventions/blob/4b2c0e6544d740178c9c77809d25705e77acd0b0/docs/gen-ai/gen-ai-spans.md#L48) 与 [L82](https://github.com/open-telemetry/semantic-conventions/blob/4b2c0e6544d740178c9c77809d25705e77acd0b0/docs/gen-ai/gen-ai-spans.md#L82)

现行 `gen_ai.provider.name` 在推理 Span 和远程 `invoke_agent` 上仍是必填。它是开放枚举：已知值适用时必须用已知值，否则可以用自定义值。注册表里没有 `_OTHER` 这个成员。[registry.yaml L3-L97](https://github.com/open-telemetry/semantic-conventions-genai/blob/06ec68e722c45a7218e23ea1bc1339fe4e21ecae/model/gen-ai/registry.yaml#L3-L97)

### Agent Span 的种类

`v1.36.0` 只有一种 Invoke Agent Span。种类应当是 `CLIENT`。说明文字是：通常适用于远程 Agent 服务。[v1.36.0 gen-ai-agent-spans.md L154-L161](https://github.com/open-telemetry/semantic-conventions/blob/4b2c0e6544d740178c9c77809d25705e77acd0b0/docs/gen-ai/gen-ai-agent-spans.md#L154-L161)

现行文本拆成两个 Span 类型，操作名仍都是 `invoke_agent`：

| Span 类型 | 种类 | 适用 |
|---|---|---|
| `gen_ai.invoke_agent.client` | `CLIENT` | 远程服务。例子写了 OpenAI Assistants API、AWS Bedrock Agents。[spans.yaml L504-L518](https://github.com/open-telemetry/semantic-conventions-genai/blob/06ec68e722c45a7218e23ea1bc1339fe4e21ecae/model/gen-ai/spans.yaml#L504-L518) |
| `gen_ai.invoke_agent.internal` | `INTERNAL` | 同一进程。例子写了 LangChain agents、CrewAI agents。[spans.yaml L549-L562](https://github.com/open-telemetry/semantic-conventions-genai/blob/06ec68e722c45a7218e23ea1bc1339fe4e21ecae/model/gen-ai/spans.yaml#L549-L562) |

主仓库 `v1.42.0` 的 changelog 把这次拆分记为：把 `invoke_agent` 拆成 client 与 internal，并把属性从推理层级里拆出来。[v1.42.0 CHANGELOG L148](https://github.com/open-telemetry/semantic-conventions/blob/ae3a98640194ed405c4c797281502e4d3bd258b3/CHANGELOG.md#L148)

### v1.36.0 还没有的操作

`v1.36.0` 的操作名表有 `chat`、`create_agent`、`embeddings`、`execute_tool`、`generate_content`、`invoke_agent`、`text_completion`。[v1.36.0 gen-ai-spans.md L130-L136](https://github.com/open-telemetry/semantic-conventions/blob/4b2c0e6544d740178c9c77809d25705e77acd0b0/docs/gen-ai/gen-ai-spans.md#L130-L136)

现行注册表在此之外还有 `retrieval`、`fetch_response`、`invoke_workflow`、`plan`，以及七个 memory 操作。完整表在 [操作](operations.md)。

## 输入输出怎么记录

模型指令、用户消息和模型输出被视为敏感数据，体积也常常很大。仪器默认不应当采集它们，但应当提供选择加入的开关。[gen-ai-spans.md L909-L917](https://github.com/open-telemetry/semantic-conventions-genai/blob/06ec68e722c45a7218e23ea1bc1339fe4e21ecae/docs/gen-ai/gen-ai-spans.md#L909-L917)

规范列出三种用法：

1. 默认：不记录指令、输入、输出。
2. 把它们记在 Span 属性上：`gen_ai.system_instructions`、`gen_ai.input.messages`、`gen_ai.output.messages`。规范说这适合遥测量可控、并且隐私规则不适用或存储本身符合隐私规则的场合，例如预生产环境。
3. 内容放在外部存储，Span 上只留引用。规范说生产环境里遥测量大、或敏感数据需要单独访问控制时，推荐这种模式。

[gen-ai-spans.md L919-L940](https://github.com/open-telemetry/semantic-conventions-genai/blob/06ec68e722c45a7218e23ea1bc1339fe4e21ecae/docs/gen-ai/gen-ai-spans.md#L919-L940)

也可以把同一组内容记在事件 `gen_ai.client.inference.operation.details` 上。该事件的要求级别是选择加入。非规范示例同时给出了“写在 Span 属性上”和“写在事件属性上”两种表。[examples-llm-calls.md L65-L166](https://github.com/open-telemetry/semantic-conventions-genai/blob/06ec68e722c45a7218e23ea1bc1339fe4e21ecae/docs/gen-ai/non-normative/examples-llm-calls.md#L65-L166)

记录规则：

- 输入消息必须按送给模型的顺序排列。[registry.yaml L923-L924](https://github.com/open-telemetry/semantic-conventions-genai/blob/06ec68e722c45a7218e23ea1bc1339fe4e21ecae/model/gen-ai/registry.yaml#L923-L924)
- 能单独提供系统指令时，用 `gen_ai.system_instructions`。已经在对话历史里的指令，记入 `gen_ai.input.messages`。[registry.yaml L880-L885](https://github.com/open-telemetry/semantic-conventions-genai/blob/06ec68e722c45a7218e23ea1bc1339fe4e21ecae/model/gen-ai/registry.yaml#L880-L885)
- 每条输出消息对应一个候选。一个候选不能拆进多条消息。一条消息也不能混入多个候选的部件。[registry.yaml L975-L979](https://github.com/open-telemetry/semantic-conventions-genai/blob/06ec68e722c45a7218e23ea1bc1339fe4e21ecae/model/gen-ai/registry.yaml#L975-L979)
- 操作以错误结束时，只有操作确实产出了输出（含流式的部分输出）才设置 `gen_ai.output.messages`。仪器不应当为失败操作编造输出。[registry.yaml L986-L989](https://github.com/open-telemetry/semantic-conventions-genai/blob/06ec68e722c45a7218e23ea1bc1339fe4e21ecae/model/gen-ai/registry.yaml#L986-L989)
- `gen_ai.response.finish_reasons` 与提供方返回的各次生成对齐，不与过滤或截断后的 `gen_ai.output.messages` 对齐。[registry.yaml L982-L984](https://github.com/open-telemetry/semantic-conventions-genai/blob/06ec68e722c45a7218e23ea1bc1339fe4e21ecae/model/gen-ai/registry.yaml#L982-L984)
- 语言还不支持 Span 上的结构化属性时，Span 上序列化成 JSON 字符串，事件上保留结构。[gen-ai-spans.md L961-L963](https://github.com/open-telemetry/semantic-conventions-genai/blob/06ec68e722c45a7218e23ea1bc1339fe4e21ecae/docs/gen-ai/gen-ai-spans.md#L961-L963)
- `fetch_response` 只记录响应上携带的内容。它有系统指令、输出消息和工具定义。它没有原始输入消息，所以这个 Span 不设置 `gen_ai.input.messages`。[spans.yaml L377-L382](https://github.com/open-telemetry/semantic-conventions-genai/blob/06ec68e722c45a7218e23ea1bc1339fe4e21ecae/model/gen-ai/spans.yaml#L377-L382)

工具参数 `gen_ai.tool.call.arguments` 和工具结果 `gen_ai.tool.call.result` 也是选择加入。仪器拿到的是序列化字符串时，应当尽量反序列化成对象。[registry.yaml L545-L557](https://github.com/open-telemetry/semantic-conventions-genai/blob/06ec68e722c45a7218e23ea1bc1339fe4e21ecae/model/gen-ai/registry.yaml#L545-L557)

记忆查询 `gen_ai.memory.query.text` 和记忆记录 `gen_ai.memory.records` 默认不采集。采集应当由显式选择加入打开。规范举的例子是环境变量 `OTEL_INSTRUMENTATION_GENAI_CAPTURE_MESSAGE_CONTENT`。[registry.yaml L834-L836](https://github.com/open-telemetry/semantic-conventions-genai/blob/06ec68e722c45a7218e23ea1bc1339fe4e21ecae/model/gen-ai/registry.yaml#L834-L836)

### 脱敏和截断

规范没有规定统一的脱敏算法，也没有规定统一的截断长度。它规定了这些行为：

- 仪器可以让用户过滤或截断系统指令、输入消息、输出消息。截断时应当保留 JSON 结构，截断的是单条消息内容这类属性。[gen-ai-spans.md L965-L966](https://github.com/open-telemetry/semantic-conventions-genai/blob/06ec68e722c45a7218e23ea1bc1339fe4e21ecae/docs/gen-ai/gen-ai-spans.md#L965-L966) 与 [registry.yaml L887-L888](https://github.com/open-telemetry/semantic-conventions-genai/blob/06ec68e722c45a7218e23ea1bc1339fe4e21ecae/model/gen-ai/registry.yaml#L887-L888)
- `gen_ai.input.messages` 和 `gen_ai.output.messages` 的说明写明：这些属性很可能含用户数据和个人数据。
- `gen_ai.tool.description`、`gen_ai.tool.call.arguments`、`gen_ai.tool.call.result`、`gen_ai.tool.definitions`、`gen_ai.retrieval.query.text`、`gen_ai.skill.description`、`gen_ai.skill.source.uri`、`gen_ai.prompt.variable`、`exception.message` 的说明写明：可能含敏感信息。
- `gen_ai.tool.definitions` 可能很大。默认不建议填充非必填属性。仪器可以提供开关来填充可选属性。[registry.yaml L599-L601](https://github.com/open-telemetry/semantic-conventions-genai/blob/06ec68e722c45a7218e23ea1bc1339fe4e21ecae/model/gen-ai/registry.yaml#L599-L601)
- `gen_ai.skill.source.uri` 应当标识技能来源，不应当标识为执行而临时展开的位置。仪器能识别用户信息和查询参数里的访问令牌时，应当抹掉这些敏感 URI 成分。[registry.yaml L1106-L1114](https://github.com/open-telemetry/semantic-conventions-genai/blob/06ec68e722c45a7218e23ea1bc1339fe4e21ecae/model/gen-ai/registry.yaml#L1106-L1114)
- 外部上传钩子应当独立于那三个内容属性的选择加入开关。钩子已配置时，无论 Span 是否被采样，仪器都应当调用它。钩子可以修改 Span 和消息对象。若同时还记录那三个属性，应当在钩子之后记录，并记录钩子改过的值。[gen-ai-spans.md L970-L992](https://github.com/open-telemetry/semantic-conventions-genai/blob/06ec68e722c45a7218e23ea1bc1339fe4e21ecae/docs/gen-ai/gen-ai-spans.md#L970-L992)
- 引用外部内容的统一属性名仍是 TODO。

`gen_ai.conversation.id` 不得用临时值充数。没有现成会话标识时，不应当填写。新的 UUID、trace 标识、请求内容的哈希都不应当当作回退值。[registry.yaml L439-L441](https://github.com/open-telemetry/semantic-conventions-genai/blob/06ec68e722c45a7218e23ea1bc1339fe4e21ecae/model/gen-ai/registry.yaml#L439-L441)

`gen_ai.conversation.compacted` 只在能可靠判定发生了上下文压缩时设为 `true`。不应当把它设为 `false`。无法判定时保持不设置。[registry.yaml L452-L455](https://github.com/open-telemetry/semantic-conventions-genai/blob/06ec68e722c45a7218e23ea1bc1339fe4e21ecae/model/gen-ai/registry.yaml#L452-L455)

## 上下文、父子 Span 和多 Agent

规范没有定义单独的 Agent 传播协议，也没有定义 `traceparent` 之外的 Agent 头。它使用 OpenTelemetry 原有的 Trace 上下文，再用属性和实体把多次调用绑在一起。

会话号的传入方式写在 `gen_ai.conversation.id` 上：仪器手头有会话标识时应当填写。应用自己管理对话历史时，可以通过自定义 Span 或日志处理器，或通过仪器库提供的钩子，把会话号加到生成式 AI Span 和其他 Span、日志上。属性说明还写了另一条路径：用户应用通过 OpenTelemetry 上下文或库自己的机制提供会话号。[registry.yaml L427-L445](https://github.com/open-telemetry/semantic-conventions-genai/blob/06ec68e722c45a7218e23ea1bc1339fe4e21ecae/model/gen-ai/registry.yaml#L427-L445) 与 [spans.yaml L145-L147](https://github.com/open-telemetry/semantic-conventions-genai/blob/06ec68e722c45a7218e23ea1bc1339fe4e21ecae/model/gen-ai/spans.yaml#L145-L147)

进程内 Span 的父子关系：

- `invoke_agent` 的 internal Span 包住同一次进程内调用。
- 能可靠判定为规划时，记录 `plan`。产生计划的模型调用应当是 `plan` 的子 Span。计划产生的工具或任务 Span 通常是兄弟，并挂在同一个 `invoke_agent` 下。[spans.yaml L694-L698](https://github.com/open-telemetry/semantic-conventions-genai/blob/06ec68e722c45a7218e23ea1bc1339fe4e21ecae/model/gen-ai/spans.yaml#L694-L698)
- 仪器分不清规划和普通推理时，不应当记录 `plan`。[spans.yaml L700-L703](https://github.com/open-telemetry/semantic-conventions-genai/blob/06ec68e722c45a7218e23ea1bc1339fe4e21ecae/model/gen-ai/spans.yaml#L700-L703)
- `execute_tool` 是 `INTERNAL`。能仪器化工具执行的生成式 AI 仪器应当记录它，除非另一种仪器已经可靠覆盖全部受支持的工具类型。MCP 工具执行也可以由 MCP 仪器记录。同一次调用不应当记两个不同的 Span。[spans.yaml L585-L600](https://github.com/open-telemetry/semantic-conventions-genai/blob/06ec68e722c45a7218e23ea1bc1339fe4e21ecae/model/gen-ai/spans.yaml#L585-L600)
- 工具常常由应用代码直接执行。规范鼓励应用开发者按这套约定给自己的工具调用打点，并手工补上自动仪器没覆盖的调用。[spans.yaml L590-L593](https://github.com/open-telemetry/semantic-conventions-genai/blob/06ec68e722c45a7218e23ea1bc1339fe4e21ecae/model/gen-ai/spans.yaml#L590-L593)

多 Agent 和工作流：

- `invoke_workflow` 用于协调多个 Agent 或其他生成式 AI 操作的可组合过程，例如图、编排器。单独的 Agent 调用不记这个 Span。[spans.yaml L642-L644](https://github.com/open-telemetry/semantic-conventions-genai/blob/06ec68e722c45a7218e23ea1bc1339fe4e21ecae/model/gen-ai/spans.yaml#L642-L644)
- 工作流只是另一个操作的内部实现时，不应当上报。例子是 Agent 或工具在内部拉起 runner 去委托子 Agent。应用自己定义的工作流即使嵌套也应当上报，例子是一张图里的子图节点。[spans.yaml L646-L650](https://github.com/open-telemetry/semantic-conventions-genai/blob/06ec68e722c45a7218e23ea1bc1339fe4e21ecae/model/gen-ai/spans.yaml#L646-L650)
- 规范点名的入口包括 ADK 的 `Runner.run`、CrewAI 的 `Crew.kickoff()`、LangGraph 的 `*Graph*.invoke`、Microsoft Agent Framework 的 `Workflow*.run`、以及带 handoff、子 Agent 或 Agent 即工具的 OpenAI Agents `Runner.run`。[spans.yaml L656-L662](https://github.com/open-telemetry/semantic-conventions-genai/blob/06ec68e722c45a7218e23ea1bc1339fe4e21ecae/model/gen-ai/spans.yaml#L656-L662)
- 子 Agent 或被移交 Agent 发出的推理和工具调用，记在那些 Agent 自己的 `invoke_agent` 上。父 Agent 的 `gen_ai.invoke_agent.inference_calls` 和 `gen_ai.invoke_agent.tool_calls` 只计自己发出的调用。[metrics.yaml L188-L192](https://github.com/open-telemetry/semantic-conventions-genai/blob/06ec68e722c45a7218e23ea1bc1339fe4e21ecae/model/gen-ai/metrics.yaml#L188-L192)
- `gen_ai.workflow.name` 必须是低基数。不应当用类型名，例如 `StateGraph`。框架没有有意义的低基数名字时，默认不得采集。[registry.yaml L1073-L1084](https://github.com/open-telemetry/semantic-conventions-genai/blob/06ec68e722c45a7218e23ea1bc1339fe4e21ecae/model/gen-ai/registry.yaml#L1073-L1084)

顶层 Agent 实体 `gen_ai.main_agent`：

- 它标识进程里一个逻辑上的顶层生成式 AI Agent。该 Agent 要有跨调用稳定的标识，例如定时任务、云厂商托管 Agent、或 A2A Agent Card 里声明的 Agent。
- 标识必须稳定。内存里的临时标识、进程本地标识不得用来生成 `gen_ai.main_agent.id`。没有稳定标识时，不得发出这个实体。
- 进程内的 `invoke_agent` 继续用 Span 上的 `gen_ai.agent.*`。
- 在 A2A 里，`gen_ai.main_agent.name` 对应 Agent Card 的 `name`，`gen_ai.main_agent.description` 对应 `description`。

[entities.yaml L3-L20](https://github.com/open-telemetry/semantic-conventions-genai/blob/06ec68e722c45a7218e23ea1bc1339fe4e21ecae/model/gen-ai/entities.yaml#L3-L20) 与 [registry.yaml L500-L513](https://github.com/open-telemetry/semantic-conventions-genai/blob/06ec68e722c45a7218e23ea1bc1339fe4e21ecae/model/gen-ai/registry.yaml#L500-L513)

`invoke_agent` 的 internal Span、`execute_tool`、`invoke_workflow`、`plan` 都关联实体 `gen_ai.main_agent`。[spans.yaml L564-L566](https://github.com/open-telemetry/semantic-conventions-genai/blob/06ec68e722c45a7218e23ea1bc1339fe4e21ecae/model/gen-ai/spans.yaml#L564-L566)

远程 Agent 的稳定资源号放在 Span 属性 `gen_ai.agent.id`。规范举例：AWS Bedrock agent ARN、GCP Agent Registry 标识。它不建议把内存实例号记在这个属性上。[registry.yaml L458-L466](https://github.com/open-telemetry/semantic-conventions-genai/blob/06ec68e722c45a7218e23ea1bc1339fe4e21ecae/model/gen-ai/registry.yaml#L458-L466)

采样相关属性在模型里标了 `sampling_relevant: true`。推理 Span 上包括 `gen_ai.provider.name`、`gen_ai.operation.name`、`server.address`、`server.port`、`gen_ai.request.model`。[spans.yaml L261-L271](https://github.com/open-telemetry/semantic-conventions-genai/blob/06ec68e722c45a7218e23ea1bc1339fe4e21ecae/model/gen-ai/spans.yaml#L261-L271)
