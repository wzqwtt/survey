import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {normalizeUrl} from '@docusaurus/utils';
import type {LoadContext, Plugin} from '@docusaurus/types';
import type {DocMetadata, LoadedContent} from '@docusaurus/plugin-content-docs';
import type {
  HtmlPage,
  KnowledgeCategory,
  KnowledgeIndex,
  KnowledgeItem,
  KnowledgeSection,
} from '../src/types/knowledge';

export type SectionOption = {key: string; label: string; description: string};

export type KnowledgeIndexOptions = {
  sections: SectionOption[];
  /** Directory under `static/` that holds standalone HTML pages, one folder per page. */
  htmlDir?: string;
};

type CategoryFile = {
  label?: string;
  position?: number;
  description?: string;
  link?: {type?: string; slug?: string; id?: string};
  customProps?: {badge?: string};
};

function readJson<T>(file: string): T | null {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8')) as T;
  } catch {
    return null;
  }
}

function listDirs(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, {withFileTypes: true})
    .filter((d) => d.isDirectory() && !d.name.startsWith('_') && !d.name.startsWith('.'))
    .map((d) => d.name);
}

function gitTimestamp(file: string, siteDir: string): number | null {
  try {
    const out = execFileSync('git', ['log', '-1', '--format=%ct', '--', file], {
      cwd: siteDir,
      stdio: ['ignore', 'pipe', 'ignore'],
    })
      .toString()
      .trim();
    return out ? Number(out) * 1000 : null;
  } catch {
    return null;
  }
}

function toTimestamp(value: unknown): number | null {
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'string' || typeof value === 'number') {
    const t = new Date(value).getTime();
    return Number.isNaN(t) ? null : t;
  }
  return null;
}

function decodeEntities(s: string): string {
  return s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&');
}

function metaContent(html: string, name: string): string | null {
  const re = new RegExp(
    `<meta\\s+[^>]*name=["']${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["'][^>]*>`,
    'i',
  );
  const tag = html.match(re)?.[0];
  const content = tag?.match(/content=["']([^"']*)["']/i)?.[1];
  return content ? decodeEntities(content.trim()) : null;
}

function isIndexDoc(doc: DocMetadata): boolean {
  const base = path.basename(doc.source).replace(/\.mdx?$/, '').toLowerCase();
  const dirName = path.basename(doc.sourceDirName).toLowerCase();
  return base === 'index' || base === 'readme' || base === dirName;
}

function sortByPosition(a: DocMetadata, b: DocMetadata): number {
  return (a.sidebarPosition ?? Infinity) - (b.sidebarPosition ?? Infinity);
}

export default function knowledgeIndexPlugin(
  context: LoadContext,
  rawOptions: unknown,
): Plugin {
  const options = rawOptions as KnowledgeIndexOptions;
  const {siteDir, baseUrl} = context;
  const docsDir = path.join(siteDir, 'docs');
  const htmlDirName = options.htmlDir ?? 'html';
  const htmlDir = path.join(siteDir, 'static', htmlDirName);
  const trailingSlash = context.siteConfig.trailingSlash;
  const permalinkOf = (p: string) => {
    const url = normalizeUrl([baseUrl, p]).replace(/(.)\/$/, '$1');
    return trailingSlash && !url.endsWith('/') ? `${url}/` : url;
  };

  return {
    name: 'knowledge-index',

    getPathsToWatch() {
      return [`${htmlDir}/**/*.html`, `${docsDir}/**/_category_.json`];
    },

    async loadContent(): Promise<HtmlPage[]> {
      return listDirs(htmlDir)
        .map((slug): HtmlPage | null => {
          const file = path.join(htmlDir, slug, 'index.html');
          if (!fs.existsSync(file)) return null;
          const html = fs.readFileSync(file, 'utf8');
          const title = html.match(/<title>([\s\S]*?)<\/title>/i)?.[1]?.trim();
          const doc = metaContent(html, 'survey:doc');
          return {
            slug,
            title: title ? decodeEntities(title) : slug,
            description: metaContent(html, 'description') ?? '',
            path: `/${htmlDirName}/${slug}/`,
            docPermalink: doc ? permalinkOf(doc) : null,
            updatedAt: gitTimestamp(file, siteDir) ?? fs.statSync(file).mtimeMs,
          };
        })
        .filter((p): p is HtmlPage => p !== null)
        .sort((a, b) => b.updatedAt - a.updatedAt);
    },

    async allContentLoaded({allContent, actions}) {
      const htmlPages = (allContent['knowledge-index']?.default ?? []) as HtmlPage[];
      const docsContent = allContent['docusaurus-plugin-content-docs']?.default as
        | LoadedContent
        | undefined;
      const docs = docsContent?.loadedVersions[0]?.docs ?? [];

      const docsUnder = (dir: string) =>
        docs.filter((d) => d.sourceDirName === dir || d.sourceDirName.startsWith(`${dir}/`));

      const makeItem = (
        doc: DocMetadata,
        dir: string,
        section: SectionOption,
        category: {key: string; label: string},
        title?: string,
      ): KnowledgeItem => ({
        title: title ?? doc.title,
        description: doc.description,
        permalink: doc.permalink,
        section: section.key,
        sectionLabel: section.label,
        category: category.key,
        categoryLabel: category.label,
        tags: doc.tags.map((t) => ({label: t.label, permalink: t.permalink})),
        date: toTimestamp(doc.frontMatter.date) ?? doc.lastUpdatedAt ?? null,
        docCount: dir ? docsUnder(dir).length : 1,
        htmlPages: htmlPages.filter((p) => p.docPermalink === doc.permalink).map((p) => p.slug),
      });

      const sections: KnowledgeSection[] = options.sections.map((section) => {
        const sectionDocs = docsUnder(section.key);
        const root = sectionDocs.find((d) => d.sourceDirName === section.key && isIndexDoc(d));

        const categories: KnowledgeCategory[] = listDirs(path.join(docsDir, section.key))
          .map((key) => {
            const catDir = `${section.key}/${key}`;
            const meta =
              readJson<CategoryFile>(path.join(docsDir, catDir, '_category_.json')) ?? {};
            const category = {key, label: meta.label ?? key};

            const notes = docs
              .filter((d) => d.sourceDirName === catDir && !isIndexDoc(d))
              .sort(sortByPosition)
              .map((d) => makeItem(d, '', section, category));

            const topics = listDirs(path.join(docsDir, catDir))
              .map((topicKey) => {
                const topicDir = `${catDir}/${topicKey}`;
                const topicDocs = docsUnder(topicDir).sort(sortByPosition);
                const topicMeta = readJson<CategoryFile>(
                  path.join(docsDir, topicDir, '_category_.json'),
                );
                const indexDoc =
                  topicDocs.find((d) => d.sourceDirName === topicDir && isIndexDoc(d)) ??
                  topicDocs[0];
                if (!indexDoc) return null;
                const fallbackTitle = isIndexDoc(indexDoc) ? undefined : topicMeta?.label;
                return {
                  position: topicMeta?.position ?? Infinity,
                  item: makeItem(indexDoc, topicDir, section, category, fallbackTitle),
                };
              })
              .filter((t): t is {position: number; item: KnowledgeItem} => t !== null)
              .sort((a, b) => a.position - b.position)
              .map((t) => t.item);

            let permalink: string | null = null;
            if (meta.link?.type === 'generated-index' && meta.link.slug) {
              permalink = permalinkOf(meta.link.slug);
            } else if (meta.link?.type === 'doc' && meta.link.id) {
              permalink = docs.find((d) => d.id === meta.link?.id)?.permalink ?? null;
            }

            return {
              position: meta.position ?? Infinity,
              category: {
                key,
                label: category.label,
                description: meta.description ?? '',
                badge: meta.customProps?.badge ?? category.label.slice(0, 1).toUpperCase(),
                permalink,
                items: [...topics, ...notes],
              },
            };
          })
          .sort((a, b) => a.position - b.position)
          .map((c) => c.category);

        return {
          key: section.key,
          label: section.label,
          description: section.description,
          permalink: root?.permalink ?? permalinkOf(section.key),
          docCount: sectionDocs.length,
          categories,
        };
      });

      const recent = sections
        .flatMap((s) => s.categories.flatMap((c) => c.items))
        .sort((a, b) => (b.date ?? 0) - (a.date ?? 0))
        .slice(0, 6);

      const tagCount = new Set(docs.flatMap((d) => d.tags.map((t) => t.label))).size;

      const data: KnowledgeIndex = {sections, htmlPages, recent, tagCount};
      actions.setGlobalData(data);
    },
  };
}
