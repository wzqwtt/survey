import React, {useState, type ComponentProps, type ReactNode} from 'react';
import clsx from 'clsx';
import MDXImg from '@theme/MDXComponents/Img';
import ZoomViewer from '@site/src/components/ZoomViewer';
import styles from './styles.module.css';

type Zoomed = {src: string; width: number; height: number};

export default function ZoomableImage(props: ComponentProps<'img'>): ReactNode {
  const [zoomed, setZoomed] = useState<Zoomed | null>(null);

  return (
    <>
      <MDXImg
        {...props}
        className={clsx(props.className, styles.zoomable)}
        title={props.title ?? '点击放大'}
        onClick={(e) => {
          props.onClick?.(e);
          const img = e.currentTarget;
          // Linked images should navigate instead.
          if (e.defaultPrevented || img.closest('a') || !img.naturalWidth) return;
          setZoomed({src: img.currentSrc || img.src, width: img.naturalWidth, height: img.naturalHeight});
        }}
      />
      {zoomed && (
        <ZoomViewer
          width={zoomed.width}
          height={zoomed.height}
          maxFitScale={2}
          label="图片放大查看"
          onClose={() => setZoomed(null)}>
          <img src={zoomed.src} alt={props.alt ?? ''} draggable={false} />
        </ZoomViewer>
      )}
    </>
  );
}
