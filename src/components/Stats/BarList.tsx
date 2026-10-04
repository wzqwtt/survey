import React, {type ReactNode} from 'react';
import Link from '@docusaurus/Link';
import {formatCount} from '@site/src/lib/analytics';
import styles from './styles.module.css';

export type BarItem = {
  key: string;
  label: string;
  value: number;
  to?: string;
  hint?: string;
};

type Props = {
  items: BarItem[];
  /** Denominator for percentages; defaults to the sum of values. */
  total?: number;
  empty?: string;
};

export default function BarList({items, total, empty = '暂无数据'}: Props): ReactNode {
  if (items.length === 0) return <p className={styles.muted}>{empty}</p>;
  const max = Math.max(...items.map((i) => i.value), 1);
  const sum = total ?? items.reduce((n, i) => n + i.value, 0);
  return (
    <ul className={styles.barList}>
      {items.map((item) => (
        <li key={item.key} title={item.hint}>
          <span className={styles.barFill} style={{width: `${(item.value / max) * 100}%`}} />
          <span className={styles.barLabel}>
            {item.to ? <Link to={item.to}>{item.label}</Link> : item.label}
          </span>
          <span className={styles.barValue}>
            {formatCount(item.value)}
            {sum > 0 && <small>{((item.value / sum) * 100).toFixed(1)}%</small>}
          </span>
        </li>
      ))}
    </ul>
  );
}
