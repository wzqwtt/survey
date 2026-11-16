import React, {type ReactNode} from 'react';
import styles from './tokens.module.css';

export default function ReviewPrompt({questions}: {questions: string[]}): ReactNode {
  return (
    <section className={styles.card} aria-labelledby="pyr-review-heading">
      <h2 id="pyr-review-heading">可选复习</h2>
      <p className={styles.muted}>不强制。不必打卡，也不会保存到服务器。</p>
      <ol>
        {questions.map((q) => (
          <li key={q}>{q}</li>
        ))}
      </ol>
      <label className={styles.muted} htmlFor="pyr-local-draft">
        若愿意，可在本地框里改写一句留言（仅留在本页，刷新即清空）。
      </label>
      <textarea
        id="pyr-local-draft"
        className={styles.textarea}
        autoComplete="off"
        defaultValue=""
      />
    </section>
  );
}