import React, {type ReactNode} from 'react';
import styles from './tokens.module.css';

export default function LessonHero({oneLiner}: {oneLiner: string}): ReactNode {
  return (
    <section className={styles.card} aria-labelledby="pyr-oneliner">
      <h2 id="pyr-oneliner">一句话要点</h2>
      <p className={styles.heroTitle} style={{fontSize: '1.15rem'}}>
        {oneLiner}
      </p>
    </section>
  );
}