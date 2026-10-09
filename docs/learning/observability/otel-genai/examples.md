---
sidebar_position: 5
sidebar_label: 规范示例
title: 规范里的生成式 AI 调用示例
description: 转述 semantic-conventions-genai 非规范示例：关闭内容采集、事件采集、工具调用、独立系统指令和推理部件。
tags: [OpenTelemetry, GenAI, Agent, 可观测性]
date: 2026-10-09
---

# 规范里的生成式 AI 调用示例

示例来自非规范文件 [examples-llm-calls.md](https://github.com/open-telemetry/semantic-conventions-genai/blob/06ec68e722c45a7218e23ea1bc1339fe4e21ecae/docs/gen-ai/non-normative/examples-llm-calls.md)，提交 `06ec68e722c45a7218e23ea1bc1339fe4e21ecae`。下面只转述该文件里的场景和字段。文件没有给出进程内 `invoke_agent` 的完整属性表。Agent Span 树的规范文字在 [概览](index.md)。

## 简单对话，关闭内容采集

场景：一次聊天补全，输入里有系统消息和用户消息。序列是应用调用已仪器的客户端，客户端把输入送给模型，模型返回助手文本。[L23-L44](https://github.com/open-telemetry/semantic-conventions-genai/blob/06ec68e722c45a7218e23ea1bc1339fe4e21ecae/docs/gen-ai/non-normative/examples-llm-calls.md#L23-L44)

关闭内容采集时，Span 上没有消息正文。文件给出的字段是：

| 属性 | 值 |
|---|---|
| Span 名 | `chat gpt-4` |
| Trace id | `4bf92f3577b34da6a3ce929d0e0e4736` |
| Span id | `00f067aa0ba902b7` |
| `gen_ai.provider.name` | `openai` |
| `gen_ai.operation.name` | `chat` |
| `gen_ai.request.model` | `gpt-4` |
| `gen_ai.request.max_tokens` | `200` |
| `gen_ai.request.top_p` | `1.0` |
| `gen_ai.response.id` | `chatcmpl-9J3uIL87gldCFtiIbyaOvTeYBRA3l` |
| `gen_ai.response.model` | `gpt-4-0613` |
| `gen_ai.usage.input_tokens` | `52` |
| `gen_ai.usage.output_tokens` | `47` |
| `gen_ai.usage.cache_read.input_tokens` | `20` |
| `gen_ai.response.finish_reasons` | `["stop"]` |

[L46-L63](https://github.com/open-telemetry/semantic-conventions-genai/blob/06ec68e722c45a7218e23ea1bc1339fe4e21ecae/docs/gen-ai/non-normative/examples-llm-calls.md#L46-L63)

## 同一调用，内容写在 Span 属性上

字段与上一张表相同，并增加两个选择加入属性。

`gen_ai.input.messages` 有两条消息。第一条 `role` 是 `system`，文本部件是 `You are a helpful bot`。第二条 `role` 是 `user`，文本部件是 `Tell me a joke about OpenTelemetry`。

`gen_ai.output.messages` 有一条 `role` 为 `assistant` 的消息。文本部件以一个空格开头，正文是：Why did the developer bring OpenTelemetry to the party? Because it always knows how to trace the fun!

[L65-L125](https://github.com/open-telemetry/semantic-conventions-genai/blob/06ec68e722c45a7218e23ea1bc1339fe4e21ecae/docs/gen-ai/non-normative/examples-llm-calls.md#L65-L125)

## 同一调用，内容写在事件上

Span 表与关闭内容采集时相同，Span 上不放消息。另有一条事件，Trace id 和 Span id 与该 Span 相同。事件上重复提供方、操作名、模型和用量，并带上与上一节相同的 `gen_ai.input.messages` 和 `gen_ai.output.messages`。[L127-L207](https://github.com/open-telemetry/semantic-conventions-genai/blob/06ec68e722c45a7218e23ea1bc1339fe4e21ecae/docs/gen-ai/non-normative/examples-llm-calls.md#L127-L207)

文件这一节没有写出事件名。事件名的规范定义在推理页：`gen_ai.client.inference.operation.details`。[client-inference.md L846](https://github.com/open-telemetry/semantic-conventions-genai/blob/06ec68e722c45a7218e23ea1bc1339fe4e21ecae/docs/gen-ai/client-inference.md#L846)

## 多模态部件

文件说多模态补全的序列和遥测结构与简单对话相同，差别在部件类型。它列出三种：[L209-L217](https://github.com/open-telemetry/semantic-conventions-genai/blob/06ec68e722c45a7218e23ea1bc1339fe4e21ecae/docs/gen-ai/non-normative/examples-llm-calls.md#L209-L217)

- `blob`：内联数据。
- `uri`：用 URI 指向远程文件。
- `file`：用标识指向已经上传的文件。

输入示例的用户消息先是文本 `What is in the attached data?`，后面依次是 PNG 的 `uri`、MP4 的 `uri`、带 `file_id` 的 `file`、内联 PNG 与 WAV 的 `blob`，以及 PDF 的 `uri`。`modality` 在示例里出现了 `image`、`video`、`audio`、`document`。[L226-L283](https://github.com/open-telemetry/semantic-conventions-genai/blob/06ec68e722c45a7218e23ea1bc1339fe4e21ecae/docs/gen-ai/non-normative/examples-llm-calls.md#L226-L283)

## 客户端函数工具

场景：用户消息和函数定义进入第一次聊天补全。模型要求应用调用函数。应用执行函数，把工具结果放进历史，再请求第二次补全。[L305-L307](https://github.com/open-telemetry/semantic-conventions-genai/blob/06ec68e722c45a7218e23ea1bc1339fe4e21ecae/docs/gen-ai/non-normative/examples-llm-calls.md#L305-L307)

文件写明：这些 Span 的关系取决于应用代码。外面有一层 Span 时，它们多半是兄弟。[L334-L336](https://github.com/open-telemetry/semantic-conventions-genai/blob/06ec68e722c45a7218e23ea1bc1339fe4e21ecae/docs/gen-ai/non-normative/examples-llm-calls.md#L334-L336)

关闭内容采集时，第一次客户端 Span：

| 属性 | 值 |
|---|---|
| Span 名 | `chat gpt-4` |
| `gen_ai.operation.name` | `chat` |
| `gen_ai.provider.name` | `openai` |
| `gen_ai.request.model` | `gpt-4` |
| `gen_ai.usage.input_tokens` | `47` |
| `gen_ai.usage.output_tokens` | `17` |
| `gen_ai.usage.cache_write.input_tokens` | `47` |
| `gen_ai.response.finish_reasons` | `["tool_calls"]` |
| `gen_ai.tool.definitions` | 一个 `type` 为 `function`、`name` 为 `get_weather` 的定义。这一张表在关闭内容采集的小节里仍然带了工具定义。 |

工具 Span，文件说“如果按 execute-tool 定义做了仪器化，它可以像这样”：

| 属性 | 值 |
|---|---|
| Span 名 | `execute_tool get_weather` |
| `gen_ai.operation.name` | `execute_tool` |
| `gen_ai.tool.name` | `get_weather` |
| `gen_ai.tool.type` | `function` |
| `gen_ai.tool.call.id` | `call_VSPygqKTWdrhaFErNvMV18Yl` |

第二次客户端 Span的结束原因是 `["stop"]`。输入 token 是 `97`，输出 token 是 `52`。缓存读入是 `47`，缓存写入是 `50`。响应号是 `chatcmpl-call_VSPygqKTWdrhaFErNvMV18Yl`。这张表没有重复 `gen_ai.operation.name`。[L333-L394](https://github.com/open-telemetry/semantic-conventions-genai/blob/06ec68e722c45a7218e23ea1bc1339fe4e21ecae/docs/gen-ai/non-normative/examples-llm-calls.md#L333-L394)

打开内容采集后，第一次输出消息里有 `type: "tool_call"`。`id` 是 `call_VSPygqKTWdrhaFErNvMV18Yl`，`name` 是 `get_weather`，`arguments.location` 是 `Paris`。第二次输入在用户消息之后加上助手的工具调用，以及 `role: "tool"` 的 `tool_call_response`，`response` 是 `rainy, 57°F`。最终助手文本说明巴黎在下雨，温度大约 57°F。工具 Span 在打开内容采集时增加选择加入字段：`gen_ai.tool.call.arguments` 是 `{"location": "Paris"}`，`gen_ai.tool.call.result` 是 `rainy, 57°F`。[L396 起的工具调用内容节](https://github.com/open-telemetry/semantic-conventions-genai/blob/06ec68e722c45a7218e23ea1bc1339fe4e21ecae/docs/gen-ai/non-normative/examples-llm-calls.md#L396)

## 系统指令和对话历史分开记

有的提供方把指令和对话历史分开提交，也可以在输入里再放一条 `system` 或 `developer` 消息。示例用 OpenAI Responses API：`instructions` 是 `You must never tell jokes`，`input` 里另有一条 system 消息和一条用户消息。[L575-L588](https://github.com/open-telemetry/semantic-conventions-genai/blob/06ec68e722c45a7218e23ea1bc1339fe4e21ecae/docs/gen-ai/non-normative/examples-llm-calls.md#L575-L588)

记录结果把两边分开：

- `gen_ai.system_instructions` 只有一条文本：`You must never tell jokes`。
- `gen_ai.input.messages` 里的 system 文本是 `You are a helpful bot`，用户文本是 `Tell me a joke about OpenTelemetry`。
- 输出助手文本是 `I'm sorry, but I can't assist with that`。
- 用量是输入 `28`、输出 `10`、缓存写入 `28`。结束原因是 `["stop"]`。

同一节的 Python 片段把 input 里的 system 写成 `You are a helpful assistant`，用户句写成 `Tell me a joke`。JSON 示例用的是上一列表的句子。两处都在该文件 L580-L653，转述时保持文件原样，不把它们合成一句。

## 带推理部件的输出

Span 字段在简单对话的基础上增加 `gen_ai.usage.reasoning.output_tokens`，值为 `27`。缓存读入是 `16`。输入 token 仍是 `52`，输出 token 仍是 `47`。

输出消息的 `parts` 有两段。第一段 `type` 是 `reasoning`，内容是一段关于如何把 trace 写成笑话的英文思考。第二段 `type` 是 `text`，内容是前面那则笑话，开头仍有一个空格。[L660-L724](https://github.com/open-telemetry/semantic-conventions-genai/blob/06ec68e722c45a7218e23ea1bc1339fe4e21ecae/docs/gen-ai/non-normative/examples-llm-calls.md#L660-L724)

## 服务端内置工具

文件用 OpenAI Responses API 的 `code_interpreter` 说明：提供方自己执行工具，并在响应里带回工具调用细节。内置工具使用 `server_tool_call` 和 `server_tool_call_response`，以便和客户端函数调用分开。示例请求把 `tool_choice` 设为 `required`，并 `include` 了 `code_interpreter_call.outputs`。[L727-L741](https://github.com/open-telemetry/semantic-conventions-genai/blob/06ec68e722c45a7218e23ea1bc1339fe4e21ecae/docs/gen-ai/non-normative/examples-llm-calls.md#L727-L741)

这和指标约定一致：提供方在服务端执行的工具不计入 `gen_ai.invoke_agent.tool_calls`。该指标只计客户端工具。见 [信号](signals.md)。

## 多个候选

文件还有一节 “Chat completion with multiple choices”。它演示内容采集打开时，多条输出消息如何各自对应一个候选。字段表从 [L847](https://github.com/open-telemetry/semantic-conventions-genai/blob/06ec68e722c45a7218e23ea1bc1339fe4e21ecae/docs/gen-ai/non-normative/examples-llm-calls.md#L847) 开始。规范属性页要求每条输出消息恰好对应一个候选，见 [属性](attributes.md)。
