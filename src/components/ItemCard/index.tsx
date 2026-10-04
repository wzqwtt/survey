import React, {type ReactNode} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import type {KnowledgeItem} from '@site/src/types/knowledge';
import {formatDate} from '@site/src/hooks/useKnowledgeIndex';
import Icon from '@site/src/components/Icon';
import {formatCount, useViewCount} from '@site/src/lib/analytics';
import styles from './styles.module.css';

type Props = {
  item: KnowledgeItem;
  /** Show "section · category" above the title. */
  showOrigin?: boolean;
};

export default function ItemCard({item, showOrigin = false}: Props): ReactNode {
  const date = formatDate(item.date);
  const views = useViewCount(item.permalink);
  return (
    <article className={clsx(styles.card, styles[item.section])}>
      {showOrigin && (
        <div className={styles.origin}>
          <span className={styles.section}>{item.sectionLabel}</span>
          <span>{item.categoryLabel}</span>
        </div>
      )}
      <h3 className={styles.title}>
        <Link to={item.permalink} className={styles.stretched}>
          {item.title}
        </Link>
      </h3>
      {item.description && <p className={styles.desc}>{item.description}</p>}
      {item.tags.length > 0 && (
        <div className={styles.tags}>
          {item.tags.slice(0, 5).map((t) => (
            <Link key={t.permalink} to={t.permalink} className={styles.tag}>
              {t.label}
            </Link>
          ))}
        </div>
      )}
      <div className={styles.meta}>
        {item.docCount > 1 && <span>{item.docCount} 篇文档</span>}
        <span className={styles.stat} title="预计阅读时间">
          <Icon name="clock" size={13} />
          {item.readingMinutes} 分钟
        </span>
        {views.count != null && (
          <span className={styles.stat} title="概览页阅读次数">
            <Icon name="eye" size={13} />
            {formatCount(views.count)}
          </span>
        )}
        {item.htmlPages.length > 0 && <span className={styles.html}>含交互页面</span>}
        {date && <time className={styles.date}>{date}</time>}
      </div>
    </article>
  );
}
