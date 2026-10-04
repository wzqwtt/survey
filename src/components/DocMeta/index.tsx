import React, {type ReactNode} from 'react';
import {useLocation} from '@docusaurus/router';
import Icon from '@site/src/components/Icon';
import {formatDate, useKnowledgeIndex} from '@site/src/hooks/useKnowledgeIndex';
import {formatCount, useAnalyticsConfig, useViewCount} from '@site/src/lib/analytics';
import styles from './styles.module.css';

/** Views, reading time, word count, and last update for the current doc page. */
export default function DocMeta(): ReactNode {
  const {pathname} = useLocation();
  const {articles} = useKnowledgeIndex();
  const {endpoint} = useAnalyticsConfig();
  const article = articles.find((a) => a.permalink === pathname);
  const views = useViewCount(article?.showMeta ? pathname : null);

  if (!article?.showMeta) return null;
  const updated = formatDate(article.lastUpdatedAt);

  return (
    <div className={styles.meta}>
      {endpoint && (
        <span className={styles.item} title="按访客去重的阅读次数，约 4 小时更新一次">
          <Icon name="eye" />
          {views.loading ? (
            <span className={styles.skeleton} />
          ) : (
            <span>{formatCount(views.count)}</span>
          )}
          次阅读
        </span>
      )}
      <span className={styles.item} title="按每分钟 400 个汉字或 200 个英文单词估算">
        <Icon name="clock" />约 {article.readingMinutes} 分钟
      </span>
      <span className={styles.item}>
        <Icon name="text" />
        {formatCount(article.words)} 字
      </span>
      {updated && (
        <span className={styles.item}>
          <Icon name="calendar" />
          更新于 {updated}
        </span>
      )}
    </div>
  );
}
