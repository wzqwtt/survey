import React, {useMemo, type ReactNode} from 'react';
import clsx from 'clsx';
import {HtmlClassNameProvider, PageMetadata, ThemeClassNames} from '@docusaurus/theme-common';
import SearchMetadata from '@theme/SearchMetadata';
import Heading from '@theme/Heading';
import type {TagsListItem} from '@docusaurus/utils';
import {layoutTagCloud} from './layout';
import styles from './styles.module.css';

const TONES = ['tone0', 'tone1', 'tone2', 'tone3', 'tone4', 'tone5'] as const;

function TagCloud({tags}: {tags: TagsListItem[]}): ReactNode {
  const layout = useMemo(
    () =>
      layoutTagCloud(
        tags.map((tag) => ({label: tag.label, count: tag.count, permalink: tag.permalink})),
      ),
    [tags],
  );

  return (
    <div className={styles.stage}>
      <svg className={styles.cloud} viewBox={layout.viewBox} role="list">
        {layout.tags.map((tag, index) => (
          <a
            key={tag.permalink}
            className={clsx(styles.word, styles[TONES[index % TONES.length]])}
            href={tag.permalink}
            role="listitem"
            aria-label={`${tag.label}，${tag.count} 篇文章`}>
            <title>{`${tag.label} · ${tag.count} 篇文章`}</title>
            <text
              x={tag.x}
              y={tag.y}
              fontSize={tag.fontSize}
              textAnchor="middle"
              dominantBaseline="central"
              transform={`rotate(${tag.rotate} ${tag.x} ${tag.y})`}>
              {tag.label}
            </text>
          </a>
        ))}
      </svg>
    </div>
  );
}

export default function DocTagsListPage({tags}: {tags: TagsListItem[]}): ReactNode {
  const title = '标签';
  return (
    <>
      <PageMetadata title={title} description="按文章数量展示的标签词云。" />
      <SearchMetadata tag="doc_tags_list" />
      <HtmlClassNameProvider className={clsx(ThemeClassNames.page.docsTagsListPage)}>
        <main className="container margin-vert--lg">
          <header className={styles.header}>
            <Heading as="h1">{title}</Heading>
            <p>字号越大，使用该标签的文章越多。点击标签查看对应文章。</p>
          </header>
          {tags.length === 0 ? (
            <p className={styles.empty}>
              还没有标签。在文档 front matter 的 <code>tags</code> 中添加。
            </p>
          ) : (
            <TagCloud tags={tags} />
          )}
        </main>
      </HtmlClassNameProvider>
    </>
  );
}
