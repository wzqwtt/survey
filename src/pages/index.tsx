import React, {type ReactNode} from 'react';
import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import ItemCard from '@site/src/components/ItemCard';
import HtmlPageCard from '@site/src/components/HtmlPageCard';
import {useKnowledgeIndex} from '@site/src/hooks/useKnowledgeIndex';
import type {KnowledgeSection} from '@site/src/types/knowledge';
import styles from './index.module.css';

function Hero(): ReactNode {
  const {siteConfig} = useDocusaurusContext();
  const {sections, htmlPages, tagCount} = useKnowledgeIndex();
  const itemCount = (key: string) =>
    sections.find((s) => s.key === key)?.categories.reduce((n, c) => n + c.items.length, 0) ?? 0;
  const docCount = sections.reduce((n, s) => n + s.docCount, 0);

  const stats = [
    {label: '调研专题', value: itemCount('research'), to: '/research'},
    {label: '学习笔记', value: itemCount('learning'), to: '/learning'},
    {label: '文档', value: docCount, to: '/research'},
    {label: '交互页面', value: htmlPages.length, to: '/gallery'},
    {label: '标签', value: tagCount, to: '/tags'},
  ];

  return (
    <header className={styles.hero}>
      <div className={styles.heroGlow} aria-hidden />
      <div className="container">
        <p className={styles.eyebrow}>{siteConfig.title}</p>
        <Heading as="h1" className={styles.heroTitle}>
          {siteConfig.tagline}
        </Heading>
        <p className={styles.heroSubtitle}>
          按分类管理技术调研与学习笔记。结构化阅读 Markdown 文档，直接浏览交互式 HTML 页面。
        </p>
        <div className={styles.ctas}>
          <Link className="button button--primary button--lg" to="/research">
            浏览调研
          </Link>
          <Link className="button button--secondary button--lg" to="/learning">
            学习笔记
          </Link>
          <Link className={styles.ghostButton} to="/gallery">
            交互页面 →
          </Link>
        </div>
        <div className={styles.stats}>
          {stats.map((s) => (
            <Link key={s.label} to={s.to} className={styles.stat}>
              <strong>{s.value}</strong>
              <span>{s.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </header>
  );
}

function SectionBlock({section}: {section: KnowledgeSection}): ReactNode {
  const categories = section.categories.filter((c) => c.items.length > 0);
  return (
    <div className={styles.sectionBlock}>
      <div className={styles.sectionHead}>
        <div>
          <Heading as="h2" className={styles.blockTitle}>
            {section.label}
          </Heading>
          <p className={styles.blockDesc}>{section.description}</p>
        </div>
        <Link to={section.permalink} className={styles.more}>
          全部{section.label} →
        </Link>
      </div>
      {categories.length === 0 ? (
        <p className={styles.empty}>
          还没有内容。在 <code>docs/{section.key}/</code> 下新建分类目录即可开始。
        </p>
      ) : (
        <div className={styles.categoryGrid}>
          {categories.map((cat) => (
            <div key={cat.key} className={styles.categoryCard}>
              <div className={styles.categoryHead}>
                <span className={styles.badge}>{cat.badge}</span>
                <div>
                  <h3>
                    {cat.permalink ? <Link to={cat.permalink}>{cat.label}</Link> : cat.label}
                  </h3>
                  <span className={styles.categoryCount}>{cat.items.length} 项</span>
                </div>
              </div>
              {cat.description && <p className={styles.categoryDesc}>{cat.description}</p>}
              <ul className={styles.itemList}>
                {cat.items.slice(0, 5).map((item) => (
                  <li key={item.permalink}>
                    <Link to={item.permalink}>{item.title}</Link>
                    {item.htmlPages.length > 0 && <span className={styles.htmlDot}>HTML</span>}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Home(): ReactNode {
  const {siteConfig} = useDocusaurusContext();
  const {sections, recent, htmlPages} = useKnowledgeIndex();
  return (
    <Layout title="首页" description={siteConfig.tagline}>
      <Hero />
      <main className={styles.main}>
        <div className="container">
          {recent.length > 0 && (
            <section className={styles.block}>
              <div className={styles.sectionHead}>
                <Heading as="h2" className={styles.blockTitle}>
                  最近更新
                </Heading>
              </div>
              <div className={styles.cardGrid}>
                {recent.map((item) => (
                  <ItemCard key={item.permalink} item={item} showOrigin />
                ))}
              </div>
            </section>
          )}

          <section className={styles.block}>
            {sections.map((s) => (
              <SectionBlock key={s.key} section={s} />
            ))}
          </section>

          {htmlPages.length > 0 && (
            <section className={styles.block}>
              <div className={styles.sectionHead}>
                <div>
                  <Heading as="h2" className={styles.blockTitle}>
                    交互页面
                  </Heading>
                  <p className={styles.blockDesc}>独立的 HTML 页面：图表、交互式报告、可视化。</p>
                </div>
                <Link to="/gallery" className={styles.more}>
                  全部页面 →
                </Link>
              </div>
              <div className={styles.cardGrid}>
                {htmlPages.slice(0, 3).map((p) => (
                  <HtmlPageCard key={p.slug} page={p} />
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
    </Layout>
  );
}
