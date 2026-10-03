import React, {useEffect, useRef, useState, type ReactNode} from 'react';
import useBaseUrl from '@docusaurus/useBaseUrl';
import styles from './styles.module.css';

type Props = {
  /** Path under `static/`, e.g. `/html/my-page/`. Absolute http(s) URLs also work. */
  src: string;
  title: string;
  /** Fixed height in px. When omitted, same-origin pages grow to fit their content. */
  height?: number;
};

const MIN_HEIGHT = 480;

export default function HtmlEmbed({src, title, height}: Props): ReactNode {
  const url = useBaseUrl(src);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [autoHeight, setAutoHeight] = useState<number>(height ?? 900);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame || height) return undefined;
    let observer: ResizeObserver | undefined;

    const attach = () => {
      observer?.disconnect();
      let doc: Document | null = null;
      try {
        doc = frame.contentDocument;
      } catch {
        return; // Cross-origin page: keep the default height.
      }
      if (!doc?.body) return;
      const body = doc.body;
      const update = () => {
        const h = Math.ceil(Math.max(body.scrollHeight, body.getBoundingClientRect().height));
        setAutoHeight(Math.max(MIN_HEIGHT, h + 4));
      };
      observer = new ResizeObserver(update);
      observer.observe(body);
      update();
    };

    frame.addEventListener('load', attach);
    if (frame.contentDocument?.readyState === 'complete') attach();
    return () => {
      frame.removeEventListener('load', attach);
      observer?.disconnect();
    };
  }, [url, height]);

  const fullscreen = () => frameRef.current?.requestFullscreen?.();

  return (
    <figure className={styles.embed}>
      <div className={styles.toolbar}>
        <span className={styles.dots} aria-hidden>
          <i />
          <i />
          <i />
        </span>
        <span className={styles.title}>{title}</span>
        <button type="button" className={styles.action} onClick={fullscreen}>
          全屏
        </button>
        <a className={styles.action} href={url} target="_blank" rel="noopener noreferrer">
          新窗口打开 ↗
        </a>
      </div>
      <iframe
        ref={frameRef}
        className={styles.frame}
        src={url}
        title={title}
        loading="lazy"
        style={{height: height ?? autoHeight}}
      />
    </figure>
  );
}
