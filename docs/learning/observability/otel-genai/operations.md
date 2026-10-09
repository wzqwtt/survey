---
sidebar_position: 3
sidebar_label: 操作
title: 生成式 AI 操作：Span 名、种类、属性和指标
description: 按 gen_ai.operation.name 列出每个操作的 Span 名、Span 种类、必填与可选属性、事件和指标。
tags: [OpenTelemetry, GenAI, Agent, 可观测性]
date: 2026-10-09
---

# 生成式 AI 操作：Span 名、种类、属性和指标

本页钉住提交 `06ec68e722c45a7218e23ea1bc1339fe4e21ecae`。要求级别用规范的四个词：必填、条件必填、建议、选择加入。属性的类型和枚举见 [属性注册表](attributes.md)。

`gen_ai.operation.name` 的已知值适用时必须使用。特定系统用了别的名字时，建议在该系统的约定里写明，并在仪器里使用那个系统名。没有另写文档时，仪器库应当使用适用的预定义值。[registry.yaml L721-L724](https://github.com/open-telemetry/semantic-conventions-genai/blob/06ec68e722c45a7218e23ea1bc1339fe4e21ecae/model/gen-ai/registry.yaml#L721-L724)

## 总表

| 操作名 | Span 类型 | 种类 | Span 名 | 主要指标 |
|---|---|---|---|---|
| `chat`、`generate_content`、`text_completion` | `gen_ai.client.inference` | 应当 `CLIENT`。同一进程内的模型可以是 `INTERNAL`。模型通常在另一进程，或调用走了已仪器化的协议（例如 HTTP）时，建议用 `CLIENT`。[spans.yaml L183-L186](https://github.com/open-telemetry/semantic-conventions-genai/blob/06ec68e722c45a7218e23ea1bc1339fe4e21ecae/model/gen-ai/spans.yaml#L183-L186) | `{操作名} {gen_ai.request.model}` | `gen_ai.client.inference.duration`，以及 token 与流式指标 |
| `embeddings` | `gen_ai.embeddings.client` | `CLIENT` | `{操作名} {gen_ai.request.model}` | `gen_ai.client.operation.duration` |
| `retrieval` | `gen_ai.retrieval.client` | `CLIENT` | `{操作名} {gen_ai.data_source.id}` | `gen_ai.client.operation.duration` |
| `fetch_response` | `gen_ai.fetch_response.client` | `CLIENT` | `{操作名}`。响应号基数高，不放进 Span 名。 | `gen_ai.client.operation.duration`。不得上报 token。 |
| `create_memory_store`、`delete_memory_store`、`create_memory`、`update_memory`、`upsert_memory`、`search_memory`、`delete_memory` | `gen_ai.memory.client` | 应当 `CLIENT`。同一进程内的记忆系统可以是 `INTERNAL`。 | `{操作名}` | `gen_ai.client.operation.duration` |
| `create_agent` | `gen_ai.create_agent.client` | `CLIENT` | `create_agent {gen_ai.agent.name}` | `gen_ai.client.operation.duration` |
| `invoke_agent` | `gen_ai.invoke_agent.client` | `CLIENT` | 有名字时 `invoke_agent {gen_ai.agent.name}`，否则 `invoke_agent` | 这是远程调用。进程内时长指标对应 internal Span。 |
| `invoke_agent` | `gen_ai.invoke_agent.internal` | `INTERNAL` | 同上 | `gen_ai.invoke_agent.duration`、`inference_calls`、`tool_calls` |
| `execute_tool` | `gen_ai.execute_tool.internal` | `INTERNAL` | `execute_tool {gen_ai.tool.name}`。技能细化见后文。 | `gen_ai.execute_tool.duration` |
| `invoke_workflow` | `gen_ai.invoke_workflow.internal` | `INTERNAL` | `invoke_workflow {gen_ai.workflow.name}` | `gen_ai.invoke_workflow.duration` |
| `plan` | `gen_ai.plan.internal` | `INTERNAL` | 有名字时 `plan {gen_ai.agent.name}`，否则 `plan` | 规范没有单独的 plan 指标 |

单个系统或框架可以规定不同的 Span 名，但必须遵守 Span 名的总体指南。指南固定到 OpenTelemetry 规范 `v1.56.0` 的 Trace API。[spans.yaml L176-L178](https://github.com/open-telemetry/semantic-conventions-genai/blob/06ec68e722c45a7218e23ea1bc1339fe4e21ecae/model/gen-ai/spans.yaml#L176-L178)

下面各节的“事件”只列规范写到该操作上的事件。没有写到的操作，不补充事件名。

## `chat`、`generate_content`、`text_completion`

这三个值都落在推理 Span `gen_ai.client.inference` 上。Span 表示客户端调用生成式 AI 模型或服务，由输入提示生成响应，或请求一次工具调用。[spans.yaml L179-L181](https://github.com/open-telemetry/semantic-conventions-genai/blob/06ec68e722c45a7218e23ea1bc1339fe4e21ecae/model/gen-ai/spans.yaml#L179-L181)

| 值 | 规范里的例子 |
|---|---|
| `chat` | OpenAI Chat API |
| `generate_content` | Gemini Generate Content |
| `text_completion` | OpenAI Completions API，规范标为 Legacy |

推理页还把这些调用算作推理操作：OpenAI Create Response、OpenAI Create Chat Completion、Anthropic Create a Message、Google Gemini Create Interaction、Google Gemini Generate Content，含流式和非流式。[client-inference.md L32-L40](https://github.com/open-telemetry/semantic-conventions-genai/blob/06ec68e722c45a7218e23ea1bc1339fe4e21ecae/docs/gen-ai/client-inference.md#L32-L40)

### 属性

| 属性 | 要求级别 | 条件 |
|---|---|---|
| `gen_ai.operation.name` | 必填 | |
| `gen_ai.provider.name` | 必填 | 应当在创建 Span 时就设置。OpenAI 必须是 `openai`，Anthropic 必须是 `anthropic`，Azure AI Inference 必须是 `azure.ai.inference`，AWS Bedrock 必须是 `aws.bedrock`。 |
| `gen_ai.request.model` | 条件必填 | 拿得到时填写。名称必须是所请求模型的准确名字。微调模型应当比基座模型更具体。 |
| `error.type` | 条件必填 | 操作以错误结束。 |
| `gen_ai.conversation.id` | 条件必填 | 仅当仪器手头有，或应用通过 OpenTelemetry 上下文、库机制提供。 |
| `gen_ai.output.type` | 条件必填 | 适用，且请求包含输出格式。 |
| `gen_ai.prompt.name` | 条件必填 | 使用了有名字的提示词模板。 |
| `gen_ai.prompt.version` | 条件必填 | 设置了 `gen_ai.prompt.name` 且有版本。 |
| `gen_ai.request.choice.count` | 条件必填 | 请求里有，且不等于 1。 |
| `gen_ai.request.seed` | 条件必填 | 适用，且请求带了 seed。 |
| `gen_ai.request.stream` | 条件必填 | 仅当请求是流式。不设置时，请求被视为非流式。 |
| `server.port` | 条件必填 | 设置了 `server.address`。Azure 细化：不是默认 443 时才必填。 |
| `gen_ai.request.top_k` | 条件必填 | 适用时。Anthropic 细化把级别改成建议。 |
| `gen_ai.request.max_tokens` | 建议 | |
| `gen_ai.request.temperature` | 建议 | |
| `gen_ai.request.top_p` | 建议 | |
| `gen_ai.request.stop_sequences` | 建议 | |
| `gen_ai.request.frequency_penalty` | 建议 | |
| `gen_ai.request.presence_penalty` | 建议 | |
| `gen_ai.request.reasoning.level` | 建议 | 适用时。值应当是发给提供方的原文字符串。 |
| `gen_ai.request.previous_response.id` | 建议 | 拿得到，且请求引用了上一次响应。 |
| `gen_ai.response.id` | 建议 | |
| `gen_ai.response.model` | 建议 | 实际使用的模型名。 |
| `gen_ai.response.finish_reasons` | 建议 | |
| `gen_ai.response.time_to_first_chunk` | 建议 | 流式请求。单位秒。 |
| `gen_ai.usage.input_tokens` | 建议 | 含全部输入类型，含缓存。 |
| `gen_ai.usage.output_tokens` | 建议 | |
| `gen_ai.usage.reasoning.output_tokens` | 建议 | 适用时。该值应当包含在 `gen_ai.usage.output_tokens` 里。 |
| 用量细分 `gen_ai.usage.text.*`、`image.*`、`audio.*`、`cache_read`、`cache_write` | 建议 | 适用时。细分是总量的子集。 |
| `gen_ai.conversation.compacted` | 建议 | 拿得到时。只在确定发生压缩时设 `true`。 |
| `server.address` | 建议 | |
| `gen_ai.system_instructions` | 选择加入 | |
| `gen_ai.input.messages` | 选择加入 | |
| `gen_ai.output.messages` | 选择加入 | |
| `gen_ai.tool.definitions` | 选择加入 | |
| `gen_ai.prompt.variable.<key>` | 选择加入 | 模板变量。`<key>` 是变量名，值是字符串。 |

出处：[spans.yaml L188-L271](https://github.com/open-telemetry/semantic-conventions-genai/blob/06ec68e722c45a7218e23ea1bc1339fe4e21ecae/model/gen-ai/spans.yaml#L188-L271)

### 事件

| 事件 | 要求级别 |
|---|---|
| `gen_ai.client.inference.operation.details` | 选择加入。属性与推理 Span 相同。严重级别应当是 DEBUG（5）。 |
| `gen_ai.client.operation.exception` | 建议。客户端操作出现异常时记录。严重级别应当是 WARN（13）。 |

### 指标

上报 `gen_ai.client.inference.duration`。流式才上报 `time_to_first_chunk` 和 `time_per_output_chunk`。token 计数器和每次操作的 token 直方图在拿得到计数时建议上报。不应当为推理操作上报 `gen_ai.client.operation.duration`。

指标属性组要求 `gen_ai.provider.name` 必填，`gen_ai.operation.name` 必填，`gen_ai.request.model` 在拿得到时必填，`gen_ai.response.model` 建议，`server.address` 建议，`server.port` 在设置了地址时必填。时长类指标在出错时还要 `error.type`。token 计数器还要必填的 `gen_ai.token.modality`。

## `embeddings`

操作名应当是 `embeddings`。Span 表示请求模型或服务，根据输入生成嵌入。[spans.yaml L279-L283](https://github.com/open-telemetry/semantic-conventions-genai/blob/06ec68e722c45a7218e23ea1bc1339fe4e21ecae/model/gen-ai/spans.yaml#L279-L283)

| 属性 | 要求级别 |
|---|---|
| `gen_ai.operation.name` | 必填 |
| `gen_ai.provider.name` | 必填 |
| `gen_ai.request.model` | 条件必填，拿得到时 |
| `error.type` | 条件必填，出错时 |
| `server.port` | 条件必填，设置了 `server.address` 时 |
| `gen_ai.request.encoding_formats` | 建议 |
| `gen_ai.usage.input_tokens` | 建议 |
| `gen_ai.embeddings.dimension.count` | 建议 |
| `gen_ai.response.model` | 建议 |
| `server.address` | 建议 |

这个 Span 不带输出消息，也不带 `gen_ai.usage.output_tokens`。

事件：异常事件按“生成式 AI 客户端操作”的建议记录。规范没有把 `gen_ai.client.inference.operation.details` 绑到嵌入 Span 上。该事件的属性组引用的是 `span.gen_ai.client.inference`。[events.yaml L3-L15](https://github.com/open-telemetry/semantic-conventions-genai/blob/06ec68e722c45a7218e23ea1bc1339fe4e21ecae/model/gen-ai/events.yaml#L3-L15)

指标：`gen_ai.client.operation.duration`。推理专用的 `gen_ai.client.inference.*` 指标定义在推理页，嵌入 Span 不在那一页的 Span 类型里。

## `retrieval`

操作名应当是 `retrieval`。Span 表示向生成式 AI 服务或框架请求，从向量库或搜索系统取出相关信息。[spans.yaml L316-L320](https://github.com/open-telemetry/semantic-conventions-genai/blob/06ec68e722c45a7218e23ea1bc1339fe4e21ecae/model/gen-ai/spans.yaml#L316-L320)

| 属性 | 要求级别 |
|---|---|
| `gen_ai.operation.name` | 必填 |
| `gen_ai.request.model` | 条件必填，拿得到时 |
| `gen_ai.provider.name` | 条件必填，适用时 |
| `gen_ai.data_source.id` | 条件必填，适用时。应当使用生成式 AI 系统里的标识，而不是外部存储自己的名字。 |
| `error.type` | 条件必填，出错时 |
| `server.port` | 条件必填，设置了地址时 |
| `gen_ai.retrieval.top_k` | 建议。请求要求返回的最大文档数。 |
| `server.address` | 建议 |
| `gen_ai.retrieval.query.text` | 选择加入。可能含敏感信息。 |
| `gen_ai.retrieval.documents` | 选择加入。每个文档在拿得到时应当含 `id`（string）和 `score`（double）。 |

## `fetch_response`

操作名应当是 `fetch_response`。它按标识取回先前生成的模型响应，不执行推理。例子是 OpenAI Get a model response。[spans.yaml L346-L350](https://github.com/open-telemetry/semantic-conventions-genai/blob/06ec68e722c45a7218e23ea1bc1339fe4e21ecae/model/gen-ai/spans.yaml#L346-L350)

| 属性 | 要求级别 |
|---|---|
| `gen_ai.operation.name` | 必填 |
| `gen_ai.provider.name` | 必填 |
| `gen_ai.response.id` | 必填。被取回的响应标识。 |
| `gen_ai.request.stream_cursor` | 条件必填。从先前位置续传流式响应时。OpenAI 对应 `starting_after`，Google GenAI Interactions 对应 `last_event_id`。 |
| `error.type` | 条件必填，出错时 |
| `server.port` | 条件必填，设置了地址时 |
| `gen_ai.response.model` | 建议 |
| `gen_ai.response.status` | 建议。生命周期状态，映射到跨提供方枚举。 |
| `gen_ai.response.finish_reasons` | 建议。从取回响应的状态推导：完成映射到停止原因，未完成映射到被截断的原因，失败或取消映射到 `error`。 |
| `server.address` | 建议 |
| `gen_ai.system_instructions` | 选择加入 |
| `gen_ai.output.messages` | 选择加入 |
| `gen_ai.tool.definitions` | 选择加入 |

不设置 `gen_ai.input.messages`。不上报 token 属性或 token 指标。

OpenAI 细化：`openai.api.type` 建议设为 `responses`。`gen_ai.response.status` 直接映射响应的 `status`：`queued`、`in_progress`、`completed`、`incomplete`、`failed`、`cancelled`。`incomplete` 时，`max_output_tokens` 映射到结束原因 `length`，`content_filter` 映射到 `content_filter`。[spans.yaml L769-L797](https://github.com/open-telemetry/semantic-conventions-genai/blob/06ec68e722c45a7218e23ea1bc1339fe4e21ecae/model/gen-ai/spans.yaml#L769-L797)

## 记忆操作

七个操作共用 Span 类型 `gen_ai.memory.client`。Span 名应当是操作名本身。[spans.yaml L404-L414](https://github.com/open-telemetry/semantic-conventions-genai/blob/06ec68e722c45a7218e23ea1bc1339fe4e21ecae/model/gen-ai/spans.yaml#L404-L414)

| 操作名 | 何时使用 |
|---|---|
| `create_memory_store` | 创建或初始化记忆库。属于库的生命周期。 |
| `delete_memory_store` | 删除或撤销记忆库。 |
| `create_memory` | 调用方要求创建新的记忆记录。 |
| `update_memory` | 调用方要求修改已知的已有记录。 |
| `upsert_memory` | 调用方调用的公开 API 可能创建、更新或合并记录，调用方不选择哪一种。 |
| `search_memory` | 从记忆库搜索或查询。 |
| `delete_memory` | 删除记录。没有 `gen_ai.memory.record.id` 时，可能表示要删除该库中的全部记录。 |

| 属性 | 要求级别 |
|---|---|
| `gen_ai.operation.name` | 必填 |
| `gen_ai.provider.name` | 条件必填。操作由有名字的外部生成式 AI 提供方或服务处理时。 |
| `gen_ai.memory.store.id` | 条件必填，适用时 |
| `gen_ai.memory.record.id` | 条件必填。操作针对某一条记录时。 |
| `error.type` | 条件必填，出错时 |
| `server.port` | 条件必填，设置了地址时 |
| `gen_ai.memory.record.count` | 建议。涉及记录且拿得到数量时。搜索记返回条数。创建、更新、upsert、删除记该操作试图处理的条数。 |
| `server.address` | 建议 |
| `gen_ai.memory.query.text` | 选择加入 |
| `gen_ai.memory.records` | 选择加入 |

## `create_agent`

操作名应当是 `create_agent`。通常用于远程 Agent 服务。[spans.yaml L462-L466](https://github.com/open-telemetry/semantic-conventions-genai/blob/06ec68e722c45a7218e23ea1bc1339fe4e21ecae/model/gen-ai/spans.yaml#L462-L466)

Span 名应当是 `create_agent {gen_ai.agent.name}`。种类 `CLIENT`。

| 属性 | 要求级别 |
|---|---|
| `gen_ai.operation.name` | 必填 |
| `gen_ai.provider.name` | 必填 |
| `gen_ai.request.model` | 条件必填，拿得到时 |
| `gen_ai.agent.id` | 条件必填，适用时。这次操作创建出的 Agent 的稳定唯一标识。 |
| `gen_ai.agent.name` | 条件必填。应用提供了名字时。 |
| `gen_ai.agent.description` | 条件必填。应用提供了描述时。 |
| `gen_ai.agent.version` | 条件必填。应用提供了版本时。 |
| `error.type` | 条件必填，出错时 |
| `server.port` | 条件必填，设置了地址时 |
| `server.address` | 建议 |
| `gen_ai.system_instructions` | 选择加入 |

事件：按客户端操作记录异常事件。规范没有为创建 Agent 单独定义输入输出事件。

指标：`gen_ai.client.operation.duration`。涉及提供方时 `gen_ai.provider.name` 为条件必填。

## `invoke_agent`（远程，CLIENT）

Span 类型 `gen_ai.invoke_agent.client`。操作名应当是 `invoke_agent`。例子：OpenAI Assistants API、AWS Bedrock Agents。[spans.yaml L504-L518](https://github.com/open-telemetry/semantic-conventions-genai/blob/06ec68e722c45a7218e23ea1bc1339fe4e21ecae/model/gen-ai/spans.yaml#L504-L518)

Span 名：手头有 `gen_ai.agent.name` 时应当是 `invoke_agent {gen_ai.agent.name}`。没有名字时应当是 `invoke_agent`。

| 属性 | 要求级别 |
|---|---|
| `gen_ai.operation.name` | 必填 |
| `gen_ai.provider.name` | 必填 |
| `gen_ai.agent.name` | 条件必填，拿得到时。人读的被调用 Agent 名。 |
| `gen_ai.agent.description` | 条件必填，拿得到时 |
| `gen_ai.agent.id` | 条件必填，适用时。被调用 Agent 的稳定唯一标识。 |
| `gen_ai.agent.version` | 条件必填，拿得到时 |
| `gen_ai.request.model` | 建议，且仅适用时。仅当被仪器的库允许每个 Agent 只配置一个模型。支持多模型或动态选择的 Agent 不应当填。 |
| `gen_ai.conversation.id` | 条件必填。条件与推理 Span 相同。 |
| `gen_ai.data_source.id` | 条件必填，适用时 |
| `gen_ai.output.type` | 条件必填。适用且请求包含输出格式。 |
| `gen_ai.request.choice.count` | 条件必填。拿得到、在请求里、且不等于 1。 |
| `gen_ai.request.seed` | 条件必填。适用且请求带了 seed。 |
| `error.type` | 条件必填，出错时 |
| `server.port` | 条件必填，设置了地址时 |
| `gen_ai.request.max_tokens` | 建议 |
| `gen_ai.request.temperature` | 建议 |
| `gen_ai.request.top_p` | 建议 |
| `gen_ai.request.stop_sequences` | 建议 |
| `gen_ai.request.frequency_penalty` | 建议 |
| `gen_ai.request.presence_penalty` | 建议 |
| `gen_ai.request.previous_response.id` | 建议。拿得到且请求引用了上一次响应。 |
| `gen_ai.response.finish_reasons` | 建议 |
| `gen_ai.usage.input_tokens` | 建议 |
| `gen_ai.usage.output_tokens` | 建议 |
| 用量细分 | 建议，适用时 |
| `server.address` | 建议 |
| `gen_ai.system_instructions` | 选择加入 |
| `gen_ai.input.messages` | 选择加入 |
| `gen_ai.output.messages` | 选择加入 |
| `gen_ai.tool.definitions` | 选择加入 |

这个 Span 的属性组里没有 `gen_ai.request.stream`，也没有 `gen_ai.request.top_k`。这两项在推理 Span 上。

事件：异常事件覆盖生成式 AI 客户端操作，因此适用于这个 CLIENT Span。评估事件应当挂到被评估的操作 Span 上，不限于某一种操作名。

指标：远程单次提供方调用若只能量到客户端边界，使用 `gen_ai.client.operation.duration`。`gen_ai.invoke_agent.duration` 的说明指向进程内调用，并写明与 `gen_ai.invoke_agent.internal` 同时上报时值应当等于该 Span 时长。[metrics.yaml L163-L173](https://github.com/open-telemetry/semantic-conventions-genai/blob/06ec68e722c45a7218e23ea1bc1339fe4e21ecae/model/gen-ai/metrics.yaml#L163-L173)

## `invoke_agent`（进程内，INTERNAL）

Span 类型 `gen_ai.invoke_agent.internal`。操作名和 Span 名规则与远程相同。例子：LangChain agents、CrewAI agents。[spans.yaml L549-L562](https://github.com/open-telemetry/semantic-conventions-genai/blob/06ec68e722c45a7218e23ea1bc1339fe4e21ecae/model/gen-ai/spans.yaml#L549-L562)

它关联实体 `gen_ai.main_agent`。没有稳定的 `gen_ai.main_agent.id` 时不发出实体。

与远程 Span 相比，internal 使用同一组 `attributes.gen_ai.invoke_agent.common`，因此仍有 token 总量、内容属性、请求采样参数、会话号、数据源、Agent 名和描述。它不包含这些远程字段：`gen_ai.provider.name`、`server.address`、`server.port`、用量细分、`gen_ai.request.previous_response.id`、`gen_ai.agent.id`、`gen_ai.agent.version`。[spans.yaml L564-L573](https://github.com/open-telemetry/semantic-conventions-genai/blob/06ec68e722c45a7218e23ea1bc1339fe4e21ecae/model/gen-ai/spans.yaml#L564-L573)

事件：异常事件的正文写的是“生成式 AI 客户端操作”。internal Span 的种类是 `INTERNAL`。规范没有把该事件写到 internal Span 上。

指标：

| 指标 | 属性 |
|---|---|
| `gen_ai.invoke_agent.duration` | `error.type`（出错时必填）；`gen_ai.agent.name`（拿得到时必填）；`gen_ai.request.model`（适用且该 Agent 只有一个模型时建议） |
| `gen_ai.invoke_agent.inference_calls` | `gen_ai.agent.name` 建议。只计这个 Agent 自己的推理调用。 |
| `gen_ai.invoke_agent.tool_calls` | `gen_ai.agent.name` 建议。只计客户端工具。服务端内置工具不计入。 |

## `execute_tool`

操作名应当是 `execute_tool`。Span 名应当是 `execute_tool {gen_ai.tool.name}`。种类 `INTERNAL`。关联实体 `gen_ai.main_agent`。[spans.yaml L575-L628](https://github.com/open-telemetry/semantic-conventions-genai/blob/06ec68e722c45a7218e23ea1bc1339fe4e21ecae/model/gen-ai/spans.yaml#L575-L628)

| 属性 | 要求级别 |
|---|---|
| `gen_ai.operation.name` | 必填 |
| `gen_ai.tool.name` | 必填 |
| `gen_ai.tool.type` | 建议，拿得到时。示例值 `function`、`extension`、`datastore`。类型本身是 string，不是封闭枚举。 |
| `gen_ai.agent.name` | 条件必填，适用时。执行工具的 Agent 的人读名字。 |
| `gen_ai.tool.call.id` | 建议，拿得到时 |
| `gen_ai.tool.description` | 建议，拿得到时。可能含敏感信息。 |
| `gen_ai.conversation.id` | 条件必填，拿得到时 |
| `error.type` | 条件必填，出错时 |
| `gen_ai.tool.call.arguments` | 选择加入。期望是对象。 |
| `gen_ai.tool.call.result` | 选择加入。有结果且执行成功时。期望是对象。 |

`gen_ai.tool.type` 的说明：[registry.yaml L534-L543](https://github.com/open-telemetry/semantic-conventions-genai/blob/06ec68e722c45a7218e23ea1bc1339fe4e21ecae/model/gen-ai/registry.yaml#L534-L543)

| 示例值 | 规范中的含义 |
|---|---|
| `extension` | 在 Agent 侧执行，直接调用外部 API。 |
| `function` | 在客户端执行。Agent 生成预定义函数的参数，客户端执行逻辑。 |
| `datastore` | Agent 用来访问结构化或非结构化外部数据，用于检索增强或知识更新。 |

事件：规范没有为 `execute_tool` 单独定义事件。参数和结果在选择加入的属性上。

指标：`gen_ai.execute_tool.duration`。属性是 `error.type`，以及 `gen_ai.tool.name`（必填）、`gen_ai.tool.type`（拿得到时建议）、`gen_ai.agent.name`（适用时必填）。

### 技能细化

专用工具加载技能、读取技能资源或执行命令时，使用下面的细化。同一次调用只记一个 Span。仪器应当用框架自己的工具名或其他启发式区分通用工具和专用工具。[spans.yaml L595-L600](https://github.com/open-telemetry/semantic-conventions-genai/blob/06ec68e722c45a7218e23ea1bc1339fe4e21ecae/model/gen-ai/spans.yaml#L595-L600)

| 细化 | Span 名 | 额外属性 |
|---|---|---|
| 加载技能 `gen_ai.execute_tool.load_skill.internal` | 有技能名时 `execute_tool {工具名} {技能名}`，否则退回 `execute_tool {工具名}` | `gen_ai.skill.name` 有名字时必填；`gen_ai.skill.description`、`gen_ai.skill.source.uri` 拿得到时建议 |
| 读技能资源 `gen_ai.execute_tool.read_skill_resource.internal` | 技能名和资源名都有：`execute_tool {工具名} {技能名} {资源名}`。只有资源名：`execute_tool {工具名} {资源名}`。否则：`execute_tool {工具名}`。不得只追加技能名。 | 再加上 `gen_ai.skill.resource.name`，有资源名时必填 |
| 执行命令 `gen_ai.execute_tool.command.internal` | 技能名和资源名都有时带上两者。只有资源名时带资源名。只有可执行文件名时带 `process.executable.name`。否则只有工具名。不得在没有资源名时只追加技能名。 | 命令关联技能时填技能字段。直接执行单个进程且拿得到时，`process.executable.name` 必填，`process.executable.path` 建议。工具报告了单个退出码时，`process.exit.code` 必填。 |

规范点名的工具包括 Google ADK 的 `load_skill`、`load_skill_resource`、`run_skill_script`，OpenAI Agents 的 `load_skill` 和 `exec_command`，Strands 的 `skills` 和 `shell`，Agno 的 `get_skill_instructions`、`get_skill_reference`、`get_skill_script`，Microsoft Agent Framework 的 `read_skill_resource`，LangChain Deep Agents 沙箱的 `execute`，Anthropic 客户端的 `bash`。[spans.yaml L892-L990](https://github.com/open-telemetry/semantic-conventions-genai/blob/06ec68e722c45a7218e23ea1bc1339fe4e21ecae/model/gen-ai/spans.yaml#L892-L990)

命令细化还可以按 CLI 客户端 Span 约定，为观察到的每个命令、脚本或进程再发 Span。那是另一套约定，链接在规范注释里。

## `invoke_workflow`

操作名应当是 `invoke_workflow`。Span 名应当是 `invoke_workflow {gen_ai.workflow.name}`。种类 `INTERNAL`。关联实体 `gen_ai.main_agent`。[spans.yaml L630-L680](https://github.com/open-telemetry/semantic-conventions-genai/blob/06ec68e722c45a7218e23ea1bc1339fe4e21ecae/model/gen-ai/spans.yaml#L630-L680)

| 属性 | 要求级别 |
|---|---|
| `gen_ai.operation.name` | 必填 |
| `gen_ai.workflow.name` | 条件必填，拿得到时。必须低基数。 |
| `gen_ai.conversation.id` | 条件必填。条件与推理 Span 相同。 |
| `error.type` | 条件必填，出错时 |
| `gen_ai.input.messages` | 选择加入 |
| `gen_ai.output.messages` | 选择加入 |

什么时候记、什么时候不记，见 [信号](signals.md) 的多 Agent 一节。

指标：`gen_ai.invoke_workflow.duration`。属性是 `error.type`，以及拿得到时必填的 `gen_ai.workflow.name`。

## `plan`

操作名应当是 `plan`。Span 名在有 Agent 名时应当是 `plan {gen_ai.agent.name}`，否则是 `plan`。种类 `INTERNAL`。关联实体 `gen_ai.main_agent`。[spans.yaml L682-L716](https://github.com/open-telemetry/semantic-conventions-genai/blob/06ec68e722c45a7218e23ea1bc1339fe4e21ecae/model/gen-ai/spans.yaml#L682-L716)

| 属性 | 要求级别 |
|---|---|
| `gen_ai.operation.name` | 必填 |
| `gen_ai.agent.name` | 条件必填，拿得到时。做规划的 Agent 的人读名字。 |
| `error.type` | 条件必填，出错时 |

这个 Span 不带消息属性，也不带 token 属性。产生计划的模型调用是它的子 Span，子 Span 自己记录推理属性。

规范没有名为 `gen_ai.plan.duration` 的指标。

仪器不能把规划和普通推理区分开时，不应当记录这个 Span。
