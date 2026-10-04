import React, {useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode} from 'react';
import {createPortal} from 'react-dom';
import styles from './styles.module.css';

type Props = {
  /** Natural size of `children` in px; children must render at exactly this size. */
  width: number;
  height: number;
  /** Upper bound for the initial fit-to-screen scale. Keep low for raster images. */
  maxFitScale?: number;
  label: string;
  children: ReactNode;
  onClose: () => void;
};

type View = {x: number; y: number; scale: number};

const MIN_SCALE = 0.1;
const MAX_SCALE = 10;
const FIT_PADDING = 0.92;
const STEP = 1.25;

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

export default function ZoomViewer({width, height, maxFitScale = 3, label, children, onClose}: Props): ReactNode {
  const stageRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<View>({x: 0, y: 0, scale: 1});
  const [dragging, setDragging] = useState(false);

  const fit = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const {clientWidth: sw, clientHeight: sh} = stage;
    const scale = clamp(
      Math.min((sw * FIT_PADDING) / width, (sh * FIT_PADDING) / height, maxFitScale),
      MIN_SCALE,
      MAX_SCALE,
    );
    setView({scale, x: (sw - width * scale) / 2, y: (sh - height * scale) / 2});
  }, [width, height, maxFitScale]);

  const zoomAt = useCallback((factor: number, px?: number, py?: number) => {
    const stage = stageRef.current;
    if (!stage) return;
    setView((v) => {
      const cx = px ?? stage.clientWidth / 2;
      const cy = py ?? stage.clientHeight / 2;
      const scale = clamp(v.scale * factor, MIN_SCALE, MAX_SCALE);
      const k = scale / v.scale;
      return {scale, x: cx - (cx - v.x) * k, y: cy - (cy - v.y) * k};
    });
  }, []);

  useLayoutEffect(fit, [fit]);

  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialogRef.current?.focus();
    window.addEventListener('resize', fit);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('resize', fit);
      previousFocus?.focus?.();
    };
  }, [fit]);

  // React registers wheel listeners as passive, which would ignore preventDefault().
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return undefined;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = stage.getBoundingClientRect();
      const delta = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
      zoomAt(Math.exp(-delta * 0.0015), e.clientX - rect.left, e.clientY - rect.top);
    };
    stage.addEventListener('wheel', onWheel, {passive: false});
    return () => stage.removeEventListener('wheel', onWheel);
  }, [zoomAt]);

  const pointers = useRef(new Map<number, {x: number; y: number}>());
  const pinchDistance = useRef(0);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, {x: e.clientX, y: e.clientY});
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      pinchDistance.current = Math.hypot(a.x - b.x, a.y - b.y);
    }
    setDragging(true);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const prev = pointers.current.get(e.pointerId);
    if (!prev) return;
    const next = {x: e.clientX, y: e.clientY};
    pointers.current.set(e.pointerId, next);

    if (pointers.current.size === 1) {
      const dx = next.x - prev.x;
      const dy = next.y - prev.y;
      setView((v) => ({...v, x: v.x + dx, y: v.y + dy}));
    } else if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      const distance = Math.hypot(a.x - b.x, a.y - b.y);
      const rect = e.currentTarget.getBoundingClientRect();
      if (pinchDistance.current > 0) {
        zoomAt(distance / pinchDistance.current, (a.x + b.x) / 2 - rect.left, (a.y + b.y) / 2 - rect.top);
      }
      pinchDistance.current = distance;
    }
  };

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    pointers.current.delete(e.pointerId);
    pinchDistance.current = 0;
    if (pointers.current.size === 0) setDragging(false);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'Escape':
        onClose();
        break;
      case '+':
      case '=':
        zoomAt(STEP);
        break;
      case '-':
      case '_':
        zoomAt(1 / STEP);
        break;
      case '0':
        fit();
        break;
      default:
        return;
    }
    e.preventDefault();
  };

  return createPortal(
    <div
      ref={dialogRef}
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-label={label}
      tabIndex={-1}
      onKeyDown={onKeyDown}>
      <div className={styles.toolbar}>
        <span className={styles.hint}>滚轮或双指缩放 · 拖拽平移 · 双击放大 · Esc 关闭</span>
        <div className={styles.actions}>
          <button type="button" onClick={() => zoomAt(1 / STEP)} aria-label="缩小" title="缩小（-）">
            −
          </button>
          <span className={styles.percent}>{Math.round(view.scale * 100)}%</span>
          <button type="button" onClick={() => zoomAt(STEP)} aria-label="放大" title="放大（+）">
            +
          </button>
          <button type="button" onClick={fit} title="适应屏幕（0）">
            适应
          </button>
          <button type="button" onClick={onClose} aria-label="关闭" title="关闭（Esc）">
            ✕
          </button>
        </div>
      </div>
      <div
        ref={stageRef}
        className={styles.stage}
        data-dragging={dragging || undefined}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onDoubleClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          zoomAt(2, e.clientX - rect.left, e.clientY - rect.top);
        }}>
        <div
          className={styles.canvas}
          style={{width, height, transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})`}}>
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
}
