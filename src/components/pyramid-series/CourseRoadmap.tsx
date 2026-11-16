import React, {type ReactNode} from 'react';
import Link from '@docusaurus/Link';
import roadmap from '@site/src/data/pyramid-roadmap.json';
import {useKnowledgeIndex} from '@site/src/hooks/useKnowledgeIndex';
import styles from './tokens.module.css';

const SERIES_SLUG = '/learning/thinking/pyramid-principle-daily/';

type Props = {currentLesson: number};

export default function CourseRoadmap({currentLesson}: Props): ReactNode {
  const {articles} = useKnowledgeIndex();
  const published = new Map<number, string>();
  for (const a of articles) {
    if (a.lesson != null && a.permalink.includes(SERIES_SLUG)) {
      published.set(a.lesson, a.permalink);
    }
  }

  return (
    <section className={styles.card} aria-labelledby="pyr-roadmap-heading">
      <h2 id="pyr-roadmap-heading">系列路线</h2>
      <p className={styles.muted}>{roadmap.disclaimer}</p>
      <ol className={styles.roadmapList}>
        {roadmap.lessons.map((item) => {
          const link = published.get(item.lesson);
          const state =
            item.lesson === currentLesson
              ? 'current'
              : link
                ? 'published'
                : 'upcoming';
          return (
            <li key={item.lesson} className={styles.roadmapItem} data-state={state}>
              <span className={styles.pill} aria-hidden="true">
                {String(item.lesson).padStart(2, '0')}
              </span>
              {link && item.lesson !== currentLesson ? (
                <Link to={link}>{item.title}</Link>
              ) : (
                <span>
                  {item.title}
                  {state === 'current' ? '（今天）' : null}
                  {state === 'upcoming' ? '（尚未发布）' : null}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}