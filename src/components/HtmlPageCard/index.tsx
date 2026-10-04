import React, {type ReactNode} from 'react';
import Link from '@docusaurus/Link';
import useBaseUrl from '@docusaurus/useBaseUrl';
import type {HtmlPage} from '@site/src/types/knowledge';
import {formatDate} from '@site/src/hooks/useKnowledgeIndex';
import styles from './styles.module.css';

export default function HtmlPageCard({page}: {page: HtmlPage}): ReactNode {
  const url = useBaseUrl(page.path);
  return (
    <article className={styles.card}>
      <a className={styles.preview} href={url} target="_blank" rel="noopener noreferrer">
        <iframe src={url} title={page.title} loading="lazy" tabIndex={-1} aria-hidden />
        <span className={styles.overlay}>新窗口打开 ↗</span>
      </a>
      <div className={styles.body}>
        <h3 className={styles.title}>{page.title}</h3>
        {page.description && <p className={styles.desc}>{page.description}</p>}
        <div className={styles.footer}>
          <time>{formatDate(page.updatedAt)}</time>
          <span className={styles.actions}>
            {page.docPermalink && <Link to={page.docPermalink}>所属文档</Link>}
            <a href={url} target="_blank" rel="noopener noreferrer">
              打开
            </a>
          </span>
        </div>
      </div>
    </article>
  );
}
