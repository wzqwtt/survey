---
sidebar_position: 4
sidebar_label: 属性
title: 生成式 AI 属性注册表
description: gen_ai 属性的名字、类型、枚举成员和示例值，以及输入输出消息的 JSON 部件。
tags: [OpenTelemetry, GenAI, Agent, 可观测性]
date: 2026-10-09
---

# 生成式 AI 属性注册表

本页钉住提交 `06ec68e722c45a7218e23ea1bc1339fe4e21ecae` 的 [model/gen-ai/registry.yaml](https://github.com/open-telemetry/semantic-conventions-genai/blob/06ec68e722c45a7218e23ea1bc1339fe4e21ecae/model/gen-ai/registry.yaml)。每个 `gen_ai.*` 键的稳定级别都是 Development。各操作上的要求级别见 [操作](operations.md)。

带 `members` 的键是开放枚举：已知值适用时必须使用该值，否则可以使用自定义值。规范在生成文档里对 `gen_ai.operation.name`、`gen_ai.provider.name`、`gen_ai.output.type`、`gen_ai.response.status`、`gen_ai.token.modality` 都这样写。

## 提供方 `gen_ai.provider.name`

类型是枚举，值是 string。它表示客户端或服务端仪器所识别的生成式 AI 提供方。它应当按仪器所知来设置，可以和实际上游提供方不同，例如请求经过了代理。它还是遥测格式的判别字段：Bedrock 的 Span 设 `aws.bedrock` 并带 `aws.bedrock.*`，不期望同时带 `openai.*`。[registry.yaml L78-L96](https://github.com/open-telemetry/semantic-conventions-genai/blob/06ec68e722c45a7218e23ea1bc1339fe4e21ecae/model/gen-ai/registry.yaml#L78-L96)

| 值 | 含义 |
|---|---|
| `openai` | OpenAI |
| `anthropic` | Anthropic |
| `azure.ai.openai` | Azure OpenAI |
| `azure.ai.inference` | Azure AI Inference |
| `aws.bedrock` | AWS Bedrock |
| `gcp.gemini` | Gemini。访问 `generativelanguage.googleapis.com`，也称 AI Studio API。 |
| `gcp.vertex_ai` | Vertex AI。访问 `aiplatform.googleapis.com`。 |
| `gcp.gen_ai` | 任一 Google 生成式 AI 端点。具体后端未知时可以使用。 |
| `cohere` | Cohere |
| `deepseek` | DeepSeek |
| `groq` | Groq |
| `mistral_ai` | Mistral AI |
| `moonshot_ai` | Moonshot AI |
| `perplexity` | Perplexity |
| `x_ai` | xAI |
| `ibm.watsonx.ai` | IBM Watsonx AI |

## 操作、模型和输出类型

| 名字 | 类型 | 示例 | 说明 |
|---|---|---|---|
| `gen_ai.operation.name` | 枚举 string | `chat`、`invoke_agent`、`execute_tool` | 正在执行的操作名。成员表在 [操作](operations.md)。 |
| `gen_ai.request.model` | string | `gpt-4` | 请求发往的模型名。 |
| `gen_ai.response.model` | string | `gpt-4-0613` | 实际生成响应的模型名。 |
| `gen_ai.response.id` | string | `chatcmpl-123` | 这一次补全的唯一标识。 |
| `gen_ai.output.type` | 枚举 string | `text`、`json`、`image`、`speech` | 客户端请求的内容类型。它表示模态，不表示实际文件格式。请求图片时，实际输出可以是图片 URL。 |

`gen_ai.output.type` 的成员：[registry.yaml L726-L744](https://github.com/open-telemetry/semantic-conventions-genai/blob/06ec68e722c45a7218e23ea1bc1339fe4e21ecae/model/gen-ai/registry.yaml#L726-L744)

| 值 | 含义 |
|---|---|
| `text` | 纯文本 |
| `json` | 模式已知或未知的 JSON 对象 |
| `image` | 图像 |
| `speech` | 语音 |

`gen_ai.response.status` 的成员：[registry.yaml L230-L256](https://github.com/open-telemetry/semantic-conventions-genai/blob/06ec68e722c45a7218e23ea1bc1339fe4e21ecae/model/gen-ai/registry.yaml#L230-L256)

| 值 | 含义 |
|---|---|
| `queued` | 提供方已接受，生成还没开始。 |
| `in_progress` | 仍在生成。 |
| `completed` | 成功结束。 |
| `incomplete` | 在完成前停止，例如达到 token 上限或内容过滤。 |
| `failed` | 生成失败。 |
| `cancelled` | 完成前被取消。 |

它和 `gen_ai.response.finish_reasons` 不同。前者是响应的生命周期。后者是模型开始产出之后为什么停下。

`gen_ai.response.finish_reasons` 类型是 `string[]`。示例：`["stop"]`、`["stop", "length"]`、`["stop", "length", "error"]`。数组顺序与返回的候选一致。本应收到结束原因却没收到时，该位置应当填 `error`，不应当省略。输出消息 JSON 里的 `finish_reason` 成员是 `stop`、`length`、`content_filter`、`tool_call`、`compaction`、`error`。[gen-ai-output-messages.json 的 FinishReason](https://github.com/open-telemetry/semantic-conventions-genai/blob/06ec68e722c45a7218e23ea1bc1339fe4e21ecae/model/gen-ai/gen-ai-output-messages.json)

## 请求参数

| 名字 | 类型 | 示例 |
|---|---|---|
| `gen_ai.request.max_tokens` | int | `100` |
| `gen_ai.request.choice.count` | int | `3` |
| `gen_ai.request.temperature` | double | `0.0` |
| `gen_ai.request.top_p` | double | `1.0` |
| `gen_ai.request.top_k` | int | `40` |
| `gen_ai.request.stop_sequences` | string[] | `["forest", "lived"]` |
| `gen_ai.request.frequency_penalty` | double | `0.1` |
| `gen_ai.request.presence_penalty` | double | `0.1` |
| `gen_ai.request.seed` | int | `100` |
| `gen_ai.request.stream` | boolean | 规范未给示例布尔值 |
| `gen_ai.request.reasoning.level` | string | `low`、`medium`、`high` |
| `gen_ai.request.encoding_formats` | string[] | `["base64"]`、`["float", "binary"]` |
| `gen_ai.request.previous_response.id` | string | `resp_0123456789aBCdef`、`interaction-123` |
| `gen_ai.request.stream_cursor` | string | `42`、`event-abc123` |
| `gen_ai.response.time_to_first_chunk` | double | `0.5`、`1.2`。单位秒。 |
| `gen_ai.embeddings.dimension.count` | int | `512`、`1024` |

`gen_ai.request.top_k` 是解码参数。OpenAI 的 `top_logprobs` 只控制返回多少个对数概率，不改变生成，不得记成 `gen_ai.request.top_k`。[registry.yaml L124-L133](https://github.com/open-telemetry/semantic-conventions-genai/blob/06ec68e722c45a7218e23ea1bc1339fe4e21ecae/model/gen-ai/registry.yaml#L124-L133)

`server.address` 和 `server.port` 来自核心约定。生成式 AI 属性组把它们的简述写成 GenAI server address 和 GenAI server port。

## 用量

类型都是 int。示例和包含关系：[registry.yaml L278-L397](https://github.com/open-telemetry/semantic-conventions-genai/blob/06ec68e722c45a7218e23ea1bc1339fe4e21ecae/model/gen-ai/registry.yaml#L278-L397)

| 名字 | 示例 | 包含关系 |
|---|---|---|
| `gen_ai.usage.input_tokens` | `100` | 总量。应当含各类输入，含缓存。 |
| `gen_ai.usage.output_tokens` | `180` | 输出总量。 |
| `gen_ai.usage.cache_read.input_tokens` | `50` | 应当包含在输入总量里。 |
| `gen_ai.usage.cache_write.input_tokens` | `25` | 应当包含在输入总量里。 |
| `gen_ai.usage.reasoning.output_tokens` | `50` | 应当包含在输出总量里。 |
| `gen_ai.usage.text.input_tokens` | `100` | 应当包含在输入总量里。 |
| `gen_ai.usage.image.input_tokens` | `258` | 同上 |
| `gen_ai.usage.audio.input_tokens` | `120` | 同上 |
| `gen_ai.usage.text.output_tokens` | `180` | 应当包含在输出总量里。 |
| `gen_ai.usage.image.output_tokens` | `1290` | 同上 |
| `gen_ai.usage.audio.output_tokens` | `240` | 同上 |
| `gen_ai.usage.text.cache_read.input_tokens` | `40` | 应当同时包含在缓存读入和文本输入里。 |
| `gen_ai.usage.image.cache_read.input_tokens` | `128` | 应当同时包含在缓存读入和图像输入里。 |
| `gen_ai.usage.audio.cache_read.input_tokens` | `60` | 应当同时包含在缓存读入和音频输入里。 |

规范给的加总例子：100 个文本 token（其中 40 个来自缓存）加 200 个图像 token 时，`gen_ai.usage.input_tokens` 是 300，`gen_ai.usage.cache_read.input_tokens` 是 40，`gen_ai.usage.text.input_tokens` 是 100，`gen_ai.usage.text.cache_read.input_tokens` 是 40，`gen_ai.usage.image.input_tokens` 是 200。

`gen_ai.token.modality` 用于 token 计数器，不用于 Span 上的用量属性。成员是 `text`、`image`、`audio`、`unknown`。

Anthropic 细化：Anthropic 的 `input_tokens` 不含缓存。`gen_ai.usage.input_tokens` 必须等于 `input_tokens + cache_read_input_tokens + cache_write_input_tokens`。[spans.yaml L856-L867](https://github.com/open-telemetry/semantic-conventions-genai/blob/06ec68e722c45a7218e23ea1bc1339fe4e21ecae/model/gen-ai/spans.yaml#L856-L867)

## 会话、提示词和评估

| 名字 | 类型 | 示例 |
|---|---|---|
| `gen_ai.conversation.id` | string | `conv_5j66UpCpwteGg4YSxUnt7lPY` |
| `gen_ai.conversation.compacted` | boolean | `true`。不设 `false`。 |
| `gen_ai.prompt.name` | string | `analyze-code` |
| `gen_ai.prompt.version` | string | `1.0.0`、`2025-05-01`、`prod`、`v2` |
| `gen_ai.prompt.variable.<key>` | 模板 string | 变量 `user_name` 值为 Alice 时，属性名是 `gen_ai.prompt.variable.user_name`，值是 `"Alice"`。 |
| `gen_ai.evaluation.name` | string | `Relevance`、`IntentResolution` |
| `gen_ai.evaluation.score.value` | double | `4.0` |
| `gen_ai.evaluation.score.label` | string | `relevant`、`pass`、`fail` |
| `gen_ai.evaluation.explanation` | string | 一句自由文本 |

`gen_ai.data_source.id` 类型 string，示例 `H7STPQYOND`。它标识 Agent 或 RAG 应用存放依据数据的来源。

## Agent、工作流和顶层实体

| 名字 | 类型 | 示例 | 说明 |
|---|---|---|---|
| `gen_ai.agent.id` | string | `asst_5j66UpCpwteGg4YSxUnt7lPY`；`arn:aws:bedrock:us-east-1:123:agent/42` | 托管 Agent 资源的稳定唯一标识。不建议记内存实例号。 |
| `gen_ai.agent.name` | string | `Math Tutor`、`Fiction Writer` | 应用提供的人读名字。 |
| `gen_ai.agent.description` | string | `Helps with math problems` | 应用提供的自由描述。 |
| `gen_ai.agent.version` | string | `1.0.0`、`2025-05-01` | Agent 版本。 |
| `gen_ai.main_agent.id` | string | 与 `gen_ai.agent.id` 同一组示例 | 进程内顶层 Agent 的稳定标识。不得由临时标识生成。 |
| `gen_ai.main_agent.name` | string | `Math Tutor` | A2A 里对应 Agent Card 的 `name`。 |
| `gen_ai.main_agent.description` | string | `Helps with math problems` | A2A 里对应 Agent Card 的 `description`。 |
| `gen_ai.workflow.name` | string | `multi_agent_rag`、`customer_support_pipeline` | 必须低基数。 |

## 工具和技能

| 名字 | 类型 | 示例 |
|---|---|---|
| `gen_ai.tool.name` | string | `Flights` |
| `gen_ai.tool.call.id` | string | `call_mszuSIzqtI65i1wAUOE8w5H4` |
| `gen_ai.tool.description` | string | `Multiply two numbers` |
| `gen_ai.tool.type` | string | `function`、`extension`、`datastore` |
| `gen_ai.tool.call.arguments` | any，JSON 模式是对象 | `{"location": "San Francisco?", "date": "2025-10-01"}` |
| `gen_ai.tool.call.result` | any，JSON 模式是对象 | `{"temperature_range": {"high": 75, "low": 60}, "conditions": "sunny"}` |
| `gen_ai.tool.definitions` | any | 函数工具含 `type: "function"`、`name`、`description`、`parameters` |
| `gen_ai.skill.name` | string | `code-review`、`pdf-processing` |
| `gen_ai.skill.description` | string | `Review a changelist against the team's review policy.` |
| `gen_ai.skill.source.uri` | string | `https://skills.example.com/code-review`、`gs://example-skills/code-review`、`file:///opt/skills/code-review` |
| `gen_ai.skill.resource.name` | string | `references/review_policy.md`、`assets/report_template.html` |

工具定义的 JSON 有两种对象。`FunctionToolDefinition` 的 `type` 固定为 `function`，还有 `name`、`description`、`parameters`。`GenericToolDefinition` 有任意 `type` 和 `name`。[gen-ai-tool-definitions.json](https://github.com/open-telemetry/semantic-conventions-genai/blob/06ec68e722c45a7218e23ea1bc1339fe4e21ecae/model/gen-ai/gen-ai-tool-definitions.json)

## 检索和记忆

| 名字 | 类型 | 示例 |
|---|---|---|
| `gen_ai.retrieval.query.text` | string | `What is the capital of France?`、`weather in Paris` |
| `gen_ai.retrieval.top_k` | int | `5` |
| `gen_ai.retrieval.documents` | any | 文档对象含 `id` 与 `score`，例如 `doc_123` 与 `0.95` |
| `gen_ai.memory.store.id` | string | `ms_abc123`、`user-preferences-store` |
| `gen_ai.memory.record.id` | string | `mem_5j66UpCpwteGg4YSxUnt7lPY` |
| `gen_ai.memory.record.count` | int | `3` |
| `gen_ai.memory.query.text` | string | `user dietary preferences` |
| `gen_ai.memory.records` | any | 记录含 `content`，可选 `id`、`metadata`、`score` |

## 消息 JSON

三个内容属性的类型都是 `any`，并绑定 JSON 模式。

| 属性 | 模式 | 顶层含义 |
|---|---|---|
| `gen_ai.system_instructions` | [gen-ai-system-instructions.json](https://github.com/open-telemetry/semantic-conventions-genai/blob/06ec68e722c45a7218e23ea1bc1339fe4e21ecae/model/gen-ai/gen-ai-system-instructions.json) | 系统指令列表。部件可以是 `text`，也可以是通用部件。 |
| `gen_ai.input.messages` | [gen-ai-input-messages.json](https://github.com/open-telemetry/semantic-conventions-genai/blob/06ec68e722c45a7218e23ea1bc1339fe4e21ecae/model/gen-ai/gen-ai-input-messages.json) | 送给模型的消息列表。 |
| `gen_ai.output.messages` | [gen-ai-output-messages.json](https://github.com/open-telemetry/semantic-conventions-genai/blob/06ec68e722c45a7218e23ea1bc1339fe4e21ecae/model/gen-ai/gen-ai-output-messages.json) | 模型或 Agent 生成的消息列表。输出消息还可以带 `finish_reason`。 |

消息对象的字段：

| 字段 | 约束 |
|---|---|
| `role` | `system`、`user`、`assistant`、`tool` |
| `parts` | 部件数组 |
| `name` | 可选 |

部件的 `type` 固定值：

| `type` | 主要字段 |
|---|---|
| `text` | `content` |
| `reasoning` | `content` |
| `tool_call` | `id`、`name`、`arguments` |
| `tool_call_response` | `id`、`response` |
| `server_tool_call` | `id`、`name`，内容按提供方多态 |
| `server_tool_call_response` | `id` |
| `compaction` | `id`、`content` |
| `blob` | 内联数据。可选 `mime_type`、`modality`、`content` |
| `uri` | 远程文件引用。可选 `mime_type`、`modality`、`uri` |
| `file` | 已上传文件。`file_id`。可选 `mime_type`、`modality` |

`modality` 的枚举是 `image`、`video`、`audio`、`document`。模式里还有 `GenericPart`，`type` 不固定，用来容纳上表之外的部件。

系统指令的示例是一个 `type: "text"` 的对象，`content` 为 `You are an Agent that greet users, always use greetings tool to respond`。输入消息的示例依次是用户文本 `Weather in Paris?`、助手的 `tool_call`（`get_weather`，参数 `location: Paris`）、以及 `tool` 角色的 `tool_call_response`（`rainy, 57°F`）。[registry.yaml L895-L967](https://github.com/open-telemetry/semantic-conventions-genai/blob/06ec68e722c45a7218e23ea1bc1339fe4e21ecae/model/gen-ai/registry.yaml#L895-L967)
