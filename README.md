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
| AI Infra | [提示词管理：coze-loop vs Langfuse](docs/research/ai-infra/prompt-management/index.md)：[功能设计](docs/research/ai-infra/prompt-management/feature-design/index.md) · [实现方式](docs/research/ai-infra/prompt-management/implementation/index.md) |

## 站点功能

- 首页、调研总览、学习总览根据目录自动生成，显示分类、专题卡片、最近更新、统计。
- 每个分区有独立侧边栏，支持多级分类、面包屑、标签、上一篇 / 下一篇。
- 本地全文搜索，支持中文分词。
- Mermaid 图、提示块、代码高亮、Tabs。
- 交互页面列表（`/gallery`）带实时缩略图；文档中可用 `<HtmlEmbed>` 嵌入，高度自适应。
- 亮色 / 暗色主题。
- 访问统计：每篇文章显示阅读量、预计阅读时间、字数；`/stats` 页面提供排行、趋势、来源、浏览器、地区分析。

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

## 访问统计

阅读量由 [GoatCounter](https://www.goatcounter.com/) 统计：免费、开源、不使用 Cookie。阅读时间和字数在构建时计算，不依赖 GoatCounter。

| 功能 | 需要的配置 |
|---|---|
| 预计阅读时间、字数 | 无 |
| 记录访问、每篇文章阅读量、全站总量、文章排行、分区与分类占比 | `GOATCOUNTER_CODE` |
| 近 30 天趋势、环比、热门页面、来源、浏览器、系统、地区、屏幕尺寸 | `GOATCOUNTER_CODE` + `GOATCOUNTER_TOKEN` |

启用步骤：

1. 在 [goatcounter.com](https://www.goatcounter.com/signup) 注册，站点代码即 `<code>.goatcounter.com` 中的 `<code>`。
2. 在 GoatCounter **Settings** 中勾选 **Allow adding visitor counts on your website**，否则读不到阅读量。
3. 在 GitHub 仓库 **Settings → Secrets and variables → Actions**：
   - **Variables** 中添加 `GOATCOUNTER_CODE`。
   - 可选：在 GoatCounter（用户菜单 → **API**）创建令牌（只需勾选 **Read statistics** 权限），添加为 **Secrets** 中的 `GOATCOUNTER_TOKEN`。
4. 重新运行部署流水线。之后每天 UTC 01:00 自动重建一次，刷新趋势数据。

说明：

- 令牌只在 GitHub Actions 构建时使用，不会出现在网站代码中。趋势数据是构建时的快照。
- GoatCounter 按访客去重计数；计数接口有最长 4 小时缓存，新访问不会立刻显示。
- 本地 `localhost` 的访问不会被记录。
- 本地预览统计页面：`node scripts/mock-goatcounter.mjs` 启动模拟服务，再运行 `GOATCOUNTER_URL=http://127.0.0.1:8081 GOATCOUNTER_TOKEN=dev npm start`。

## 部署

[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) 在推送到 `master` 时构建并发布，每天定时重建一次以刷新统计快照。PR 只构建，不发布。

首次使用需要在仓库 **Settings → Pages → Build and deployment → Source** 中选择 **GitHub Actions**。
