import React, {type ReactNode} from 'react';
import {formatCount} from '@site/src/lib/analytics';
import styles from './styles.module.css';

type Props = {
  daily: {day: string; count: number}[];
};

const WIDTH = 720;
const HEIGHT = 200;
const PAD = {top: 16, right: 8, bottom: 26, left: 40};

/** Daily bar chart with a 7-day moving average line. */
export default function TrendChart({daily}: Props): ReactNode {
  if (daily.length === 0) return <p className={styles.muted}>暂无数据</p>;
  const max = Math.max(...daily.map((d) => d.count), 1);
  const innerW = WIDTH - PAD.left - PAD.right;
  const innerH = HEIGHT - PAD.top - PAD.bottom;
  const step = innerW / daily.length;
  const barW = Math.max(2, step * 0.7);
  const y = (v: number) => PAD.top + innerH - (v / max) * innerH;
  const x = (i: number) => PAD.left + i * step + step / 2;

  const avg = daily.map((_, i) => {
    const win = daily.slice(Math.max(0, i - 6), i + 1);
    return win.reduce((n, d) => n + d.count, 0) / win.length;
  });
  const avgPath = avg
    .map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`)
    .join('');
  const labelEvery = Math.ceil(daily.length / 6);

  return (
    <svg
      className={styles.chart}
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      role="img"
      aria-label="每日访问趋势">
      {[0, 0.5, 1].map((f) => (
        <g key={f}>
          <line
            x1={PAD.left}
            x2={WIDTH - PAD.right}
            y1={y(max * f)}
            y2={y(max * f)}
            className={styles.gridLine}
          />
          <text x={PAD.left - 6} y={y(max * f) + 4} textAnchor="end" className={styles.axis}>
            {formatCount(Math.round(max * f))}
          </text>
        </g>
      ))}
      {daily.map((d, i) => (
        <g key={d.day}>
          <rect
            x={x(i) - barW / 2}
            y={y(d.count)}
            width={barW}
            height={PAD.top + innerH - y(d.count)}
            rx={2}
            className={styles.bar}>
            <title>{`${d.day}：${formatCount(d.count)} 次`}</title>
          </rect>
          {i % labelEvery === 0 && (
            <text x={x(i)} y={HEIGHT - 8} textAnchor="middle" className={styles.axis}>
              {d.day.slice(5)}
            </text>
          )}
        </g>
      ))}
      <path d={avgPath} className={styles.avgLine} />
    </svg>
  );
}
