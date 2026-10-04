export type ReadingStats = {
  words: number;
  minutes: number;
};

// Typical silent reading speeds for technical text.
const CJK_CHARS_PER_MINUTE = 400;
const LATIN_WORDS_PER_MINUTE = 200;
const CODE_LINES_PER_MINUTE = 40;

const CJK = /[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\u3040-\u30ff\uac00-\ud7af]/g;
const LATIN_WORD = /[A-Za-z0-9]+(?:['’.-][A-Za-z0-9]+)*/g;

/** Counts CJK characters plus Latin words; code blocks count by line. */
export function computeReadingStats(source: string): ReadingStats {
  let text = source.replace(/^---\n[\s\S]*?\n---\n/, '');

  let codeLines = 0;
  text = text.replace(/^(`{3,}|~{3,})[^\n]*\n([\s\S]*?)^\1\s*$/gm, (_m, _f, body: string) => {
    codeLines += body.split('\n').filter((l) => l.trim()).length;
    return '\n';
  });

  text = text
    .replace(/^\s*(import|export)\s.*$/gm, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/https?:\/\/\S+/g, '')
    .replace(/<\/?[A-Za-z][^>]*>/g, ' ')
    .replace(/`([^`]*)`/g, '$1');

  const cjk = text.match(CJK)?.length ?? 0;
  const latin = text.replace(CJK, ' ').match(LATIN_WORD)?.length ?? 0;

  const minutes =
    cjk / CJK_CHARS_PER_MINUTE + latin / LATIN_WORDS_PER_MINUTE + codeLines / CODE_LINES_PER_MINUTE;

  return {words: cjk + latin, minutes: Math.max(1, Math.round(minutes))};
}
