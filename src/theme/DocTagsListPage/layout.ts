export type CloudTag = {
  label: string;
  count: number;
  permalink: string;
};

export type PlacedTag = CloudTag & {
  x: number;
  y: number;
  fontSize: number;
  rotate: number;
};

export type CloudLayout = {
  tags: PlacedTag[];
  viewBox: string;
};

const MIN_FONT = 18;
const MAX_FONT = 64;

function textWidth(label: string, fontSize: number): number {
  let em = 0;
  for (const ch of label) {
    if (/\s/.test(ch)) em += 0.33;
    else if (/[\u3400-\u9fff\u3040-\u30ff\uac00-\ud7af]/.test(ch)) em += 1.02;
    else if (/[A-Z]/.test(ch)) em += 0.7;
    else em += 0.56;
  }
  return em * fontSize;
}

function tilt(label: string, prominence: number): number {
  // The largest words stay upright so they stay easy to read.
  if (prominence > 0.72) return 0;
  let hash = 0;
  for (const ch of label) hash = (Math.imul(hash, 33) + ch.charCodeAt(0)) >>> 0;
  return [-14, -7, 0, 0, 7, 12][hash % 6];
}

type Box = {x: number; y: number; w: number; h: number};

function bounds(x: number, y: number, w: number, h: number, degrees: number): Box {
  const rad = (degrees * Math.PI) / 180;
  const bw = Math.abs(w * Math.cos(rad)) + Math.abs(h * Math.sin(rad));
  const bh = Math.abs(w * Math.sin(rad)) + Math.abs(h * Math.cos(rad));
  return {x: x - bw / 2, y: y - bh / 2, w: bw, h: bh};
}

function collides(a: Box, b: Box, gap: number): boolean {
  return !(
    a.x + a.w + gap <= b.x ||
    b.x + b.w + gap <= a.x ||
    a.y + a.h + gap <= b.y ||
    b.y + b.h + gap <= a.y
  );
}

/** Packs tags into a word cloud. Size follows article count; placement is stable. */
export function layoutTagCloud(tags: CloudTag[]): CloudLayout {
  const sorted = [...tags].sort(
    (a, b) => b.count - a.count || a.label.localeCompare(b.label, 'zh'),
  );
  const max = Math.max(...sorted.map((t) => t.count), 1);
  const min = Math.min(...sorted.map((t) => t.count), max);
  const span = Math.sqrt(max) - Math.sqrt(min);

  const placed: {tag: PlacedTag; box: Box}[] = [];

  sorted.forEach((tag) => {
    const prominence = span === 0 ? 1 : (Math.sqrt(tag.count) - Math.sqrt(min)) / span;
    const fontSize = MIN_FONT + prominence * (MAX_FONT - MIN_FONT);
    const w = textWidth(tag.label, fontSize);
    const h = fontSize * 1.2;
    const rotate = tilt(tag.label, prominence);
    const gap = Math.max(10, fontSize * 0.22);

    let x = 0;
    let y = 0;
    let box = bounds(x, y, w, h, rotate);
    for (let i = 0; i < 2400; i += 1) {
      const angle = i * 0.42;
      const radius = i * 1.35;
      x = Math.cos(angle) * radius;
      y = Math.sin(angle) * radius * 0.62;
      box = bounds(x, y, w, h, rotate);
      if (!placed.some((p) => collides(p.box, box, gap))) break;
    }

    placed.push({tag: {...tag, x, y, fontSize, rotate}, box});
  });

  const pad = 28;
  const minX = Math.min(...placed.map((p) => p.box.x)) - pad;
  const minY = Math.min(...placed.map((p) => p.box.y)) - pad;
  const maxX = Math.max(...placed.map((p) => p.box.x + p.box.w)) + pad;
  const maxY = Math.max(...placed.map((p) => p.box.y + p.box.h)) + pad;

  return {
    tags: placed.map((p) => p.tag),
    viewBox: `${minX} ${minY} ${maxX - minX} ${maxY - minY}`,
  };
}
