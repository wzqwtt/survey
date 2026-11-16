import React, {type ReactNode} from 'react';
import styles from './tokens.module.css';

type Props = {
  seriesTitle: string;
  lessonLabel: string;
  designMinutes: string;
  localeDate?: string;
};

export default function LessonChrome({
  seriesTitle,
  lessonLabel,
  designMinutes,
  localeDate,
}: Props): ReactNode {
  return (
  <header className={styles.card}>
      <p className={styles.muted}>{seriesTitle}</p>
      <p className={styles.heroTitle}>{lessonLabel}</p>
      <p className={styles.muted}>
        设计时长：{designMinutes}（教学设计目标，不是实测时长）
        {localeDate ? ` · 文案日期 ${localeDate}（Asia/Shanghai）` : null}
      </p>
      <p className={styles.muted}>
        中文写法借鉴 ASD-STE100 的短句、一句一意和主动语态。这不是受控英语认证，课文也不声称符合该标准。
      </p>
    </header>
  );
}