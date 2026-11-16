import React, {useMemo, type ReactNode} from 'react';
import Link from '@docusaurus/Link';
import {useKnowledgeIndex} from '@site/src/hooks/useKnowledgeIndex';
import {formatDate} from '@site/src/hooks/useKnowledgeIndex';
import styles from './tokens.module.css';

const SERIES_SLUG = '/learning/thinking/pyramid-principle-daily/';

export default function SeriesCatalog(): ReactNode {
  const {articles} = useKnowledgeIndex();
  const lessons = useMemo(
    () =>
      articles
        .filter((a) => a.lesson != null && a.permalink.includes(SERIES_SLUG))
        .sort((a, b) => (a.lesson ?? 0) - (b.lesson ?? 0)),
    [articles],
  );

  if (lessons.length === 0) {
    return <p className={styles.muted}>尚无已发布课程。</p>;
  }

  return (
    <section className={styles.card} aria-labelledby="pyr-catalog-heading">
      <h2 id="pyr-catalog-heading">已发布课程</h2>
      <p className={styles.muted}>目录随新课文件自动更新，无需手改本页列表。</p>
      <table className={styles.catalogTable}>
        <thead>
          <tr>
            <th scope="col">课次</th>
            <th scope="col">标题</th>
            <th scope="col">要点</th>
            <th scope="col">日期</th>
          </tr>
        </thead>
        <tbody>
          {lessons.map((row) => (
            <tr key={row.permalink}>
              <td>{String(row.lesson).padStart(2, '0')}</td>
              <td>
                <Link to={row.permalink}>{row.title}</Link>
              </td>
              <td>{row.oneLiner ?? '—'}</td>
              <td>{formatDate(row.lastUpdatedAt) ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}