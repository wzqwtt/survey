import React, {useMemo, useState, type ReactNode} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import BarList, {type BarItem} from '@site/src/components/Stats/BarList';
import TrendChart from '@site/src/components/Stats/TrendChart';
import {formatDate, useKnowledgeIndex} from '@site/src/hooks/useKnowledgeIndex';
import {
  formatCount,
  useAnalyticsConfig,
  useAnalyticsSnapshot,
  useViewCount,
  useViewCounts,
} from '@site/src/lib/analytics';
import type {Article} from '@site/src/types/knowledge';
import type {AnalyticsSnapshot} from '@site/src/types/analytics';
import styles from './styles.module.css';

type SortKey = 'views' | 'recent' | 'minutes' | 'words' | 'updated';

function Kpi({label, value, hint}: {label: string; value: ReactNode; hint?: ReactNode}): ReactNode {
  return (
    <div className={styles.kpi}>
      <span className={styles.kpiLabel}>{label}</span>
      <strong className={styles.kpiValue}>{value}</strong>
      {hint && <span className={styles.kpiHint}>{hint}</span>}
    </div>
  );
}

function Panel({title, children, wide}: {title: string; children: ReactNode; wide?: boolean}) {
  return (
    <section className={clsx(styles.panel, wide && styles.wide)}>
      <h3 className={styles.panelTitle}>{title}</h3>
      {children}
    </section>
  );
}

function sumBy<T>(rows: T[], key: (r: T) => string, value: (r: T) => number): Map<string, number> {
  const out = new Map<string, number>();
  rows.forEach((r) => out.set(key(r), (out.get(key(r)) ?? 0) + value(r)));
  return out;
}

function SetupGuide(): ReactNode {
  return (
    <div className={styles.setup}>
      <Heading as="h2">尚未启用访问统计</Heading>
      <p>阅读时间和字数已经可用。启用 GoatCounter 后，这里会显示阅读量、排行、趋势和来源。</p>
      <ol>
        <li>
          在 <a href="https://www.goatcounter.com/signup">goatcounter.com</a>{' '}
          免费注册，记下站点代码（
          <code>&lt;code&gt;.goatcounter.com</code>）。
        </li>
        <li>
          在 GoatCounter 的 <b>Settings</b> 中勾选{' '}
          <b>Allow adding visitor counts on your website</b>。
        </li>
        <li>
          在 GitHub 仓库 <b>Settings → Secrets and variables → Actions → Variables</b> 中添加{' '}
          <code>GOATCOUNTER_CODE</code>。
        </li>
        <li>
          可选：在 GoatCounter 创建 API 令牌，添加为 Secret <code>GOATCOUNTER_TOKEN</code>
          ，即可显示趋势、来源、浏览器和地区分析。
        </li>
      </ol>
    </div>
  );
}

function ArticleTable({
  articles,
  counts,
  recent,
}: {
  articles: Article[];
  counts: Map<string, number | null>;
  recent: Map<string, number> | null;
}): ReactNode {
  const [sort, setSort] = useState<SortKey>('views');
  const [section, setSection] = useState('all');
  const {sections: allSections} = useKnowledgeIndex();
  const sections = allSections
    .filter((sec) => articles.some((a) => a.section === sec.key))
    .map((sec) => [sec.key, sec.label] as const);

  const rows = useMemo(() => {
    const value = (a: Article): number => {
      switch (sort) {
        case 'recent':
          return recent?.get(a.permalink) ?? 0;
        case 'minutes':
          return a.readingMinutes;
        case 'words':
          return a.words;
        case 'updated':
          return a.lastUpdatedAt ?? 0;
        default:
          return counts.get(a.permalink) ?? -1;
      }
    };
    return articles
      .filter((a) => section === 'all' || a.section === section)
      .sort((a, b) => value(b) - value(a));
  }, [articles, counts, recent, sort, section]);

  const maxViews = Math.max(1, ...rows.map((a) => counts.get(a.permalink) ?? 0));
  const sortButton = (key: SortKey, label: string) => (
    <button
      type="button"
      className={clsx(styles.sortButton, sort === key && styles.active)}
      onClick={() => setSort(key)}>
      {label}
      {sort === key && ' ↓'}
    </button>
  );

  return (
    <>
      <div className={styles.toolbar}>
        <div className={styles.chips}>
          {[['all', '全部'] as const, ...sections].map(([key, label]) => (
            <button
              key={key}
              type="button"
              className={clsx(styles.chip, section === key && styles.active)}
              onClick={() => setSection(key)}>
              {label}
            </button>
          ))}
        </div>
        <span className={styles.muted}>{rows.length} 篇</span>
      </div>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>#</th>
              <th>文章</th>
              <th>{sortButton('views', '阅读量')}</th>
              {recent && <th>{sortButton('recent', '近 30 天')}</th>}
              <th>{sortButton('minutes', '阅读时长')}</th>
              <th>{sortButton('words', '字数')}</th>
              <th>{sortButton('updated', '更新')}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((a, i) => {
              const views = counts.get(a.permalink);
              return (
                <tr key={a.permalink}>
                  <td className={styles.rank}>{i + 1}</td>
                  <td>
                    <Link to={a.permalink}>{a.title}</Link>
                    <div className={styles.origin}>
                      {a.sectionLabel}
                      {a.categoryLabel && ` / ${a.categoryLabel}`}
                    </div>
                  </td>
                  <td className={styles.viewsCell}>
                    <span
                      className={styles.inlineBar}
                      style={{width: `${((views ?? 0) / maxViews) * 100}%`}}
                    />
                    <span className={styles.num}>
                      {counts.has(a.permalink) ? formatCount(views) : '…'}
                    </span>
                  </td>
                  {recent && (
                    <td className={styles.num}>{formatCount(recent.get(a.permalink) ?? 0)}</td>
                  )}
                  <td className={styles.num}>{a.readingMinutes} 分钟</td>
                  <td className={styles.num}>{formatCount(a.words)}</td>
                  <td className={styles.num}>{formatDate(a.lastUpdatedAt) ?? '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

function SnapshotSection({snapshot, articles}: {snapshot: AnalyticsSnapshot; articles: Article[]}) {
  const days = snapshot.daily;
  const peak = days.reduce((best, d) => (d.count > best.count ? d : best), {day: '—', count: 0});
  const last7 = days.slice(-7).reduce((n, d) => n + d.count, 0);
  const prev7 = days.slice(-14, -7).reduce((n, d) => n + d.count, 0);
  const change = prev7 > 0 ? ((last7 - prev7) / prev7) * 100 : null;
  const {siteConfig} = useDocusaurusContext();
  const titleOf = (path: string, fallback: string) =>
    articles.find((a) => a.permalink === path)?.title ??
    (fallback.replace(` | ${siteConfig.title}`, '') || path);

  const named = (list: {name: string; count: number}[]): BarItem[] =>
    list.map((s) => ({key: s.name, label: s.name, value: s.count}));

  return (
    <>
      <div className={styles.kpis}>
        <Kpi label={`近 ${days.length} 天访问`} value={formatCount(snapshot.total)} />
        <Kpi
          label="日均"
          value={formatCount(Math.round(snapshot.total / Math.max(days.length, 1)))}
        />
        <Kpi label="峰值日" value={formatCount(peak.count)} hint={peak.day} />
        <Kpi
          label="近 7 天环比"
          value={
            change == null ? (
              '—'
            ) : (
              <span className={change >= 0 ? styles.up : styles.down}>
                {change >= 0 ? '+' : ''}
                {change.toFixed(1)}%
              </span>
            )
          }
          hint={`${formatCount(last7)} vs ${formatCount(prev7)}`}
        />
      </div>
      <div className={styles.grid}>
        <Panel title="每日访问" wide>
          <TrendChart daily={days} />
          <p className={styles.legend}>
            <span className={styles.legendBar} /> 每日访问 <span className={styles.legendLine} /> 7
            日均线
          </p>
        </Panel>
        <Panel title="热门页面">
          <BarList
            items={snapshot.pages.slice(0, 10).map((p) => ({
              key: p.path,
              label: titleOf(p.path, p.title),
              value: p.count,
              to: p.path,
              hint: p.path,
            }))}
            total={snapshot.total}
          />
        </Panel>
        <Panel title="来源">
          <BarList items={named(snapshot.referrers)} empty="暂无外部来源" />
        </Panel>
        <Panel title="地区">
          <BarList items={named(snapshot.locations)} />
        </Panel>
        <Panel title="浏览器">
          <BarList items={named(snapshot.browsers)} />
        </Panel>
        <Panel title="操作系统">
          <BarList items={named(snapshot.systems)} />
        </Panel>
        <Panel title="屏幕尺寸">
          <BarList items={named(snapshot.sizes)} />
        </Panel>
      </div>
      <p className={styles.muted}>
        数据范围 {snapshot.start} 至 {snapshot.end}，生成于{' '}
        {new Date(snapshot.generatedAt).toISOString().slice(0, 16).replace('T', ' ')}{' '}
        UTC。每日自动更新。
      </p>
    </>
  );
}

function Dashboard(): ReactNode {
  const {articles: allArticles} = useKnowledgeIndex();
  const snapshot = useAnalyticsSnapshot();
  const articles = useMemo(() => allArticles.filter((a) => a.showMeta), [allArticles]);
  const paths = useMemo(() => articles.map((a) => a.permalink), [articles]);
  const {counts, done} = useViewCounts(paths);
  const total = useViewCount('TOTAL');

  const views = (a: Article) => counts.get(a.permalink) ?? 0;
  const articleViews = articles.reduce((n, a) => n + views(a), 0);
  const viewed = articles.filter((a) => views(a) > 0).length;
  const totalWords = articles.reduce((n, a) => n + a.words, 0);
  const totalMinutes = articles.reduce((n, a) => n + a.readingMinutes, 0);
  const top = [...articles].sort((a, b) => views(b) - views(a))[0];

  const bySection = sumBy(articles, (a) => a.sectionLabel, views);
  const byCategory = sumBy(
    articles.filter((a) => a.categoryLabel),
    (a) => `${a.sectionLabel} / ${a.categoryLabel}`,
    views,
  );
  const toBars = (m: Map<string, number>): BarItem[] =>
    [...m.entries()].sort((a, b) => b[1] - a[1]).map(([k, v]) => ({key: k, label: k, value: v}));

  const recent = snapshot ? new Map(snapshot.pages.map((p) => [p.path, p.count])) : null;
  const pending = done ? '' : '…';

  return (
    <>
      <div className={styles.kpis}>
        <Kpi
          label="全站访问"
          value={total.loading ? '…' : formatCount(total.count)}
          hint="含首页、列表等所有页面"
        />
        <Kpi
          label="文章阅读"
          value={`${formatCount(articleViews)}${pending}`}
          hint={`${articles.length} 篇文章`}
        />
        <Kpi
          label="平均每篇"
          value={`${formatCount(Math.round(articleViews / Math.max(articles.length, 1)))}${pending}`}
          hint={`${viewed} 篇有阅读`}
        />
        <Kpi
          label="最受欢迎"
          value={top && views(top) > 0 ? <Link to={top.permalink}>{top.title}</Link> : '—'}
          hint={top && views(top) > 0 ? `${formatCount(views(top))} 次阅读` : undefined}
        />
        <Kpi label="总字数" value={formatCount(totalWords)} />
        <Kpi
          label="全部读完约需"
          value={
            totalMinutes >= 60 ? `${(totalMinutes / 60).toFixed(1)} 小时` : `${totalMinutes} 分钟`
          }
        />
      </div>

      <div className={styles.grid}>
        <Panel title="分区阅读占比">
          <BarList items={toBars(bySection)} />
        </Panel>
        <Panel title="分类阅读排行">
          <BarList items={toBars(byCategory)} />
        </Panel>
      </div>

      <Heading as="h2" className={styles.h2}>
        文章排行
      </Heading>
      <ArticleTable articles={articles} counts={counts} recent={recent} />

      <Heading as="h2" className={styles.h2}>
        趋势与来源
      </Heading>
      {snapshot ? (
        <SnapshotSection snapshot={snapshot} articles={articles} />
      ) : (
        <p className={styles.notice}>
          配置 GitHub Secret <code>GOATCOUNTER_TOKEN</code>（GoatCounter API
          令牌）后，构建时会拉取近 30 天的趋势、热门页面、来源、浏览器、系统、地区和屏幕尺寸。
        </p>
      )}
    </>
  );
}

export default function StatsPage(): ReactNode {
  const {endpoint} = useAnalyticsConfig();
  return (
    <Layout title="访问统计" description="全站与每篇文章的阅读量、阅读时长、趋势与来源分析。">
      <main className={clsx('container', styles.page)}>
        <Heading as="h1">访问统计</Heading>
        <p className={styles.lead}>
          阅读量来自 <a href="https://www.goatcounter.com/">GoatCounter</a>
          ：不使用 Cookie，不收集个人信息；同一访客短时间内重复访问只计一次。实时数据约 4
          小时刷新一次。
          {endpoint && (
            <>
              {' '}
              <a href={endpoint} target="_blank" rel="noopener noreferrer">
                打开完整仪表盘 ↗
              </a>
            </>
          )}
        </p>
        {endpoint ? <Dashboard /> : <SetupGuide />}
      </main>
    </Layout>
  );
}
