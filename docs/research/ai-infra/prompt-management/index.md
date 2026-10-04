---
sidebar_position: 0
sidebar_label: 提示词管理
title: 提示词管理调研：coze-loop vs Langfuse
description: 对比 coze-loop 与 Langfuse 的提示词管理。分两部分：功能设计（产品视角）和实现方式（源码视角）。
tags: [LLM, 提示词管理, coze-loop, Langfuse]
date: 2026-10-03
---

# 提示词管理调研：coze-loop vs Langfuse

本专题对比两个开源 LLM 平台的提示词管理。专题分两部分：

- **功能设计**：产品视角。用户看到什么、能做什么、如何发布与回滚、如何与 Trace / 评测 / 实验联动。
- **实现方式**：源码视角。创建 → 存储 → 获取 → 发送给 LLM，以及数据模型、模板、版本、缓存与风险。

## 两部分

| 部分 | 概览 | 详细报告 | 交互页面 |
|---|---|---|---|
| 功能设计 | [概览](feature-design/index.md) | [coze-loop](feature-design/coze-loop.md) · [Langfuse](feature-design/langfuse.md) · [对比与建议](feature-design/comparison.md) | [交互页面](feature-design/interactive.mdx) |
| 实现方式 | [概览](implementation/index.md) | [coze-loop](implementation/coze-loop.md) · [Langfuse](implementation/langfuse.md) · [对比与建议](implementation/comparison.md) | [交互页面](implementation/interactive.mdx) |

建议阅读顺序：

1. 先读 [功能设计 · 概览](feature-design/index.md)，了解两个产品的形态差异。
2. 再读 [实现方式 · 概览](implementation/index.md)，了解这些功能在后端如何实现。
3. 最后读两部分的"对比与建议"，得到自建提示词库的参考。

## 结论速览

| 维度 | coze-loop | Langfuse |
|---|---|---|
| 产品形态 | IDE 型工作台：编辑、调试、对比在一屏 | 注册中心型：版本、标签、指标闭环 |
| 执行位置 | 服务端渲染并调用 LLM | 服务端只分发模板，客户端渲染 |
| 编辑与版本 | 每用户私有草稿 → 提交 semver 版本 | 每次保存即新整数版本 |
| 发布 | 标签指针；SDK 默认读最新版本 | 标签指针；默认读 `production`，新版本默认不上线 |
| 闭环 | 调用记录 + 评测对象 | Trace 关联 + 每版本指标 + 实验 |
| 治理 | 开源版无角色 | RBAC + 受保护标签 + 审计 + 自动化 |

详细依据见两部分各自的概览和报告。

## 源码版本

| 系统 | 仓库 | 提交 |
|---|---|---|
| coze-loop | [wzqwtt/coze-loop](https://github.com/wzqwtt/coze-loop) | [`3a6a2bf0`](https://github.com/wzqwtt/coze-loop/tree/3a6a2bf07b057fec0c702e514e8345fb5684e83a) |
| Langfuse | [wzqwtt/langfuse](https://github.com/wzqwtt/langfuse) | [`f75c661d`](https://github.com/wzqwtt/langfuse/tree/f75c661dbe8c6b85523c81486b39e8403ac2c141) |

两部分的所有源码链接都是上述固定提交的永久链接。
