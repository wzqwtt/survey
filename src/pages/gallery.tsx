import React, {type ReactNode} from 'react';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import HtmlPageCard from '@site/src/components/HtmlPageCard';
import {useKnowledgeIndex} from '@site/src/hooks/useKnowledgeIndex';
import styles from './gallery.module.css';

export default function Gallery(): ReactNode {
  const {htmlPages} = useKnowledgeIndex();
  return (
    <Layout title="交互页面" description="独立的 HTML 页面：图表、交互式报告、可视化。">
      <main className="container margin-vert--xl">
        <Heading as="h1">交互页面</Heading>
        <p className={styles.lead}>
          独立的 HTML 页面，不经过 Markdown 渲染，原样发布。源文件位于{' '}
          <code>static/html/&lt;名称&gt;/index.html</code>，新增后自动出现在这里。
        </p>
        {htmlPages.length === 0 ? (
          <p className={styles.empty}>还没有交互页面。</p>
        ) : (
          <div className={styles.grid}>
            {htmlPages.map((p) => (
              <HtmlPageCard key={p.slug} page={p} />
            ))}
          </div>
        )}
      </main>
    </Layout>
  );
}
