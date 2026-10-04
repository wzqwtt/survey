import React, {type ReactNode} from 'react';
import Link from '@docusaurus/Link';
import ItemCard from '@site/src/components/ItemCard';
import {useKnowledgeIndex} from '@site/src/hooks/useKnowledgeIndex';
import styles from './styles.module.css';

type Props = {
  section: string;
};

export default function SectionOverview({section}: Props): ReactNode {
  const {sections} = useKnowledgeIndex();
  const data = sections.find((s) => s.key === section);
  const categories = data?.categories.filter((c) => c.items.length > 0) ?? [];

  if (categories.length === 0) {
    return (
      <div className={styles.empty}>
        这里还没有内容。在 <code>docs/{section}/</code> 下新建分类目录即可开始。
      </div>
    );
  }

  return (
    <div className={styles.overview}>
      {categories.map((cat) => (
        <section key={cat.key} className={styles.category}>
          <header className={styles.header}>
            <span className={styles.badge}>{cat.badge}</span>
            <div className={styles.heading}>
              <h2 className={styles.label} id={`category-${cat.key}`}>
                {cat.permalink ? <Link to={cat.permalink}>{cat.label}</Link> : cat.label}
                <span className={styles.count}>{cat.items.length}</span>
              </h2>
              {cat.description && <p className={styles.desc}>{cat.description}</p>}
            </div>
          </header>
          <div className={styles.grid}>
            {cat.items.map((item) => (
              <ItemCard key={item.permalink} item={item} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
