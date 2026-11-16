# 金字塔原理每日课 · 实施计划

**Goal:** 在学习分区落地系列扉页 + 第1课 + 系列设计系统 + 课表自动发现 + 校验脚本；PR 不合并。

**Architecture:** `docs/learning/thinking/pyramid-principle-daily/` 专题目录；`src/components/pyramid-series/*` 作用域样式与块组件；`knowledge-index` 扩展 `Article.lesson/oneLiner` 供 `SeriesCatalog`；无 DocItem swizzle。

**Tech Stack:** Docusaurus 3.10 MDX、CSS Modules、Node built-in test。

## Tasks

- [x] 计划落盘 `.cursor/plans/`
- [ ] 组件 + token + 数据 JSON
- [ ] 扩展 knowledge-index 类型与映射
- [ ] 扉页 index.mdx + 第1课 mdx（案例事实对齐）
- [ ] `scripts/validate-pyramid-lesson.mjs` + test
- [ ] README 已有学习表、`.cursor/pyramid-daily-contract.md`
- [ ] typecheck + build + 校验 + 手工移动预览