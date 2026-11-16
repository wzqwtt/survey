# 金字塔每日课 · 追加合同（给 routine）

## 路径

- 系列扉页（一次性，勿每日改）：`docs/learning/thinking/pyramid-principle-daily/index.mdx`
- **每日只新增**：`docs/learning/thinking/pyramid-principle-daily/YYYY-MM-DD-lesson-NN.mdx`
  - 示例：`2026-11-17-lesson-02.mdx`
- 可选图片：`docs/learning/thinking/pyramid-principle-daily/assets/YYYY-MM-DD/`

## Front matter（必填）

```yaml
---
series: pyramid
sidebar_position: <递增整数，扉页为 1，首课为 2>
sidebar_label: 第NN课
title: 第N课：<主题>
description: <一句话，供卡片与搜索>
tags: [金字塔原理, 每日学习]
date: YYYY-MM-DD
lesson: <整数课次，与路线图一致>
one_liner: <一句话要点>
---
```

## 正文结构（顺序固定，用全局 MDX 组件）

1. `import` + `<PyramidSeriesRoot>`
2. `<LessonChrome ... />`
3. `<CourseRoadmap currentLesson={N} />`
4. `<LessonHero oneLiner="..." />`
5. `## 为什么…`（短句 Markdown）
6. `<PyramidDiagram data={...} />`（JSON 放 `src/data/` 或课内 import）
7. `<CaseCompare ... />`（啰嗦版与结构版**事实一致**）
8. `<MicroExercise ... />`
9. `<ReviewPrompt ... />`（可选块，建议保留）
10. `<CollapsiblePanel title="适用边界">`
11. `<CollapsiblePanel title="可靠来源">`

复制模板：以 `2026-11-16-lesson-01.mdx` 为准。

## 验证

```bash
npm run validate:pyramid-lesson -- docs/learning/thinking/pyramid-principle-daily/YYYY-MM-DD-lesson-NN.mdx
npm run test:pyramid-lesson
npm run typecheck
npm run build
```

## 发布

- 开 PR 到 `master`；**不要** routine 自动合并。
- 合并后 Actions 部署；线上前缀：`https://wzqwtt.github.io/survey/learning/thinking/pyramid-principle-daily/`