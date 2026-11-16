import React, {useState, type ReactNode} from 'react';
import styles from './tokens.module.css';

type Option = {id: string; text: string};

type Props = {
  prompt: string;
  options: Option[];
  correctId: string;
  explanation: string;
};

export default function MicroExercise({prompt, options, correctId, explanation}: Props): ReactNode {
  const [picked, setPicked] = useState<string | null>(null);
  const revealed = picked !== null;
  const correct = picked === correctId;

  return (
    <section className={styles.card} aria-labelledby="pyr-quiz-heading">
      <h2 id="pyr-quiz-heading">小练习</h2>
      <p>{prompt}</p>
      {options.map((opt) => (
        <button
          key={opt.id}
          type="button"
          className={styles.quizOption}
          aria-pressed={picked === opt.id}
          onClick={() => setPicked(opt.id)}>
          <strong>{opt.id}.</strong> {opt.text}
        </button>
      ))}
      {revealed && (
        <div className={styles.quizFeedback} data-correct={String(correct)} role="status">
          {correct ? '选对了。' : '还没选对。'} {explanation}
        </div>
      )}
      <p className={styles.muted}>
        练习内容为虚构例子。选择结果只用于当次理解，不打卡、不跨设备保存。
      </p>
      {revealed && (
        <button type="button" className={styles.segmentBtn} onClick={() => setPicked(null)}>
          重置本题
        </button>
      )}
    </section>
  );
}