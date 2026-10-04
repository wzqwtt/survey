import React, {useCallback, useEffect, useRef, useState, type ReactNode} from 'react';
import Mermaid from '@theme-original/Mermaid';
import type MermaidType from '@theme/Mermaid';
import type {WrapperProps} from '@docusaurus/types';
import MermaidViewer from '@site/src/components/MermaidViewer';
import styles from './styles.module.css';

type Props = WrapperProps<typeof MermaidType>;

export default function MermaidWrapper(props: Props): ReactNode {
  const ref = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [svg, setSvg] = useState<SVGSVGElement | null>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return undefined;
    const check = () => setReady(root.querySelector('svg') !== null);
    check();
    const observer = new MutationObserver(check);
    observer.observe(root, {childList: true, subtree: true});
    return () => observer.disconnect();
  }, []);

  const open = useCallback(() => {
    const el = ref.current?.querySelector('svg');
    if (el) setSvg(el);
  }, []);

  return (
    <div className={styles.wrapper}>
      <div
        ref={ref}
        className={ready ? styles.zoomable : undefined}
        onClick={(e) => {
          // Keep links and click handlers defined inside the diagram working.
          if ((e.target as Element).closest('a')) return;
          open();
        }}
        title={ready ? '点击放大' : undefined}>
        <Mermaid {...props} />
      </div>
      {ready && (
        <button type="button" className={styles.expandButton} onClick={open} aria-label="放大查看图表">
          <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
            <path
              fill="currentColor"
              d="M4 4h6v2H7.41l3.3 3.29-1.42 1.42L6 7.41V10H4V4zm16 0v6h-2V7.41l-3.29 3.3-1.42-1.42L16.59 6H14V4h6zM4 20v-6h2v2.59l3.29-3.3 1.42 1.42L7.41 18H10v2H4zm16 0h-6v-2h2.59l-3.3-3.29 1.42-1.42L18 16.59V14h2v6z"
            />
          </svg>
          <span>放大</span>
        </button>
      )}
      {svg && <MermaidViewer source={svg} onClose={() => setSvg(null)} />}
    </div>
  );
}
