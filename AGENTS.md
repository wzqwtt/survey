# AGENTS.md

本仓库是 Docusaurus 站点，发布到 GitHub Pages（`https://wzqwtt.github.io/survey/`）。

## 目录约定

- `docs/research/<分类>/<专题>/`：一个调研专题。必须有 `index.md`，front matter 包含 `title`、`description`、`tags`、`date`。
- `docs/learning/<分类>/`：学习笔记。单文件或带 `index.md` 的目录。
- 每个分类目录需要 `_category_.json`（`label`、`position`、`description`、`link.slug`、`customProps.badge`）。参考 `docs/research/ai-engineering/_category_.json`。
- `static/html/<名称>/index.html`：独立 HTML 页面。需要 `<title>`、`<meta name="description">`、`<meta name="survey:doc">`（所属文档路径，不含 baseUrl）和 `<base target="_top">`。
- 首页和总览页由 `plugins/knowledge-index.ts` 根据目录自动生成。不要手工维护列表。
- 访问统计：`plugins/analytics-snapshot.ts`（构建时拉取 GoatCounter API）、`src/lib/analytics.ts`（读取阅读量）、`src/clientModules/goatcounter.ts`（记录访问）、`src/pages/stats/`。用 `scripts/mock-goatcounter.mjs` 在本地验证，见 README。

## 写作约定

- 简化技术中文：短句、一句一个意思、主动语态、术语一致、多用列表。
- 源码分析类调研，每条事实附固定提交的永久链接。推断性内容单独标注。
- 文档间链接使用相对文件路径（`comparison.md`），不要写 `.html` 或站点绝对 URL。
- `.md` 按 CommonMark 解析；需要导入组件时用 `.mdx`。

## 验证

```bash
npm install
npm run typecheck
npm run build   # 断链、断锚点、断图片都会使构建失败
npm start       # http://localhost:3000/survey/
```

新增调研后，同时更新 `README.md` 中的"已有调研"表。
