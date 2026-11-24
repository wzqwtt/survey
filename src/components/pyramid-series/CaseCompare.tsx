import React, {useState, type ReactNode} from 'react';
import styles from './tokens.module.css';

type StructuredReason = {
  title: string;
  facts: string[];
};

type ScqIntro = {
  situation: string;
  complication: string;
  question: string;
};

type Props = {
  scene: string;
  verbose: string;
  conclusion: string;
  reasons: StructuredReason[];
  compareNotes: string[];
  /** Optional short S→C→Q shown in 结构版 before the answer (lesson 8+). */
  scq?: ScqIntro;
};

export default function CaseCompare({
  scene,
  verbose,
  conclusion,
  reasons,
  compareNotes,
  scq,
}: Props): ReactNode {
  const [mode, setMode] = useState<'verbose' | 'structured'>('verbose');

  return (
    <section className={styles.card} aria-labelledby="pyr-case-heading">
      <h2 id="pyr-case-heading">生活案例</h2>
      <div className={styles.fiction} role="note">
        下列人物、对话和细节均为虚构教学例子。它们不是书中案例，也不是真实事件。例子里的“事实”只用来演示结构，不能当作来源依据。
      </div>
      <p>{scene}</p>
      <div className={styles.segment} role="group" aria-label="案例版本切换">
        <button
          type="button"
          className={styles.segmentBtn}
          aria-pressed={mode === 'verbose'}
          onClick={() => setMode('verbose')}>
          啰嗦版
        </button>
        <button
          type="button"
          className={styles.segmentBtn}
          aria-pressed={mode === 'structured'}
          onClick={() => setMode('structured')}>
          结构版
        </button>
      </div>
      {mode === 'verbose' ? (
        <blockquote style={{margin: 0, fontStyle: 'normal'}}>{verbose}</blockquote>
      ) : (
        <div>
          {scq ? (
            <div className={styles.structuredBlock}>
              <h4>情景—变化—问题（短引）</h4>
              <p>
                <strong>情景：</strong>
                {scq.situation}
              </p>
              <p>
                <strong>变化：</strong>
                {scq.complication}
              </p>
              <p>
                <strong>问题：</strong>
                {scq.question}
              </p>
            </div>
          ) : null}
          <div className={styles.structuredBlock}>
            <h4>结论</h4>
            <p>{conclusion}</p>
          </div>
          {reasons.map((r) => (
            <div className={styles.structuredBlock} key={r.title}>
              <h4>{r.title}</h4>
              <ul>
                {r.facts.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
      <ul className={styles.muted}>
        {compareNotes.map((n) => (
          <li key={n}>{n}</li>
        ))}
      </ul>
    </section>
  );
}