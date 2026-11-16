import React, {useState, type ReactNode} from 'react';
import styles from './tokens.module.css';

type Level = {
  id: string;
  layer: string;
  label: string;
  items: {id: string; text: string; supports?: string}[];
};

type DiagramData = {
  caption: string;
  levels: Level[];
};

export default function PyramidDiagram({data}: {data: DiagramData}): ReactNode {
  const [openLayer, setOpenLayer] = useState<string | null>(null);
  const order = ['top', 'middle', 'bottom'];

  return (
    <section className={styles.card} aria-labelledby="pyr-diagram-heading">
      <h2 id="pyr-diagram-heading">金字塔图</h2>
      <p className={styles.muted}>{data.caption}</p>
      {order.map((layerKey) => {
        const level = data.levels.find((l) => l.layer === layerKey);
        if (!level) return null;
        const expanded = openLayer === level.id;
        return (
          <div key={level.id} className={styles.pyramidLayer} data-layer={layerKey}>
            <button
              type="button"
              className={styles.layerBtn}
              aria-expanded={expanded}
              onClick={() => setOpenLayer(expanded ? null : level.id)}>
              <strong>{level.label}</strong>
            </button>
            {expanded && (
              <ul className={styles.layerDetail}>
                {level.items.map((item) => (
                  <li key={item.id}>{item.text}</li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
      <ol className={styles.muted}>
        <li>结论先出现。</li>
        <li>理由解释结论。</li>
        <li>事实支撑理由。</li>
      </ol>
    </section>
  );
}