# survey

调研与学习知识库，使用 Cursor Agent 管理，用 [Docusaurus](https://docusaurus.io/zh-CN/) 发布到 GitHub Pages。

**站点：** <https://wzqwtt.github.io/survey/>

## 内容

| 分区 | 目录 | 说明 |
|---|---|---|
| 调研 | [`docs/research/`](docs/research/) | 按分类组织的技术调研。一个专题一个目录 |
| 学习 | [`docs/learning/`](docs/learning/) | 按分类组织的学习笔记 |
| 交互页面 | [`static/html/`](static/html/) | 独立 HTML 页面，原样发布 |

已有调研：

| 分类 | 专题 |
|---|---|
| AI 工程 | [提示词管理：coze-loop vs Langfuse](docs/research/ai-engineering/prompt-management/index.md) |

## 站点功能

- 首页、调研总览、学习总览根据目录自动生成，显示分类、专题卡片、最近更新、统计。
- 每个分区有独立侧边栏，支持多级分类、面包屑、标签、上一篇 / 下一篇。
- 本地全文搜索，支持中文分词。
- Mermaid 图、提示块、代码高亮、Tabs。
- 交互页面列表（`/gallery`）带实时缩略图；文档中可用 `<HtmlEmbed>` 嵌入，高度自适应。
- 亮色 / 暗色主题。

## 本地开发

需要 Node.js 20 或更高版本。

```bash
npm install
npm start           # 开发服务器：http://localhost:3000/survey/
npm run build       # 生产构建，断链会导致构建失败
npm run serve       # 预览构建结果
npm run typecheck
```

## 新增内容

详见站内 [写作指南](docs/learning/tools/writing-guide.mdx)。简要步骤：

1. 调研：新建 `docs/research/<分类>/<专题>/index.md`，填写 `title`、`description`、`tags`、`date`。新分类需要 `_category_.json`。
2. 学习笔记：新建 `docs/learning/<分类>/<笔记>.md`，或带 `index.md` 的目录。
3. 交互页面：新建 `static/html/<名称>/index.html`，在文档中用 `<HtmlEmbed src="/html/<名称>/" title="…" />` 嵌入。

## 部署

[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) 在推送到 `master` 时构建并发布。PR 只构建，不发布。

首次使用需要在仓库 **Settings → Pages → Build and deployment → Source** 中选择 **GitHub Actions**。
