#!/usr/bin/env node
/**
 * Validates a pyramid daily lesson file before commit.
 * Usage: node scripts/validate-pyramid-lesson.mjs [path/to/lesson.mdx]
 */
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const __filename = fileURLToPath(import.meta.url);

const SERIES_DIR = 'docs/learning/thinking/pyramid-principle-daily';
const REQUIRED_FM = [
  'series',
  'sidebar_position',
  'title',
  'description',
  'date',
  'lesson',
  'one_liner',
];

const REQUIRED_MARKERS = [
  '<PyramidSeriesRoot>',
  '<LessonChrome',
  '<CourseRoadmap',
  '<LessonHero',
  '<PyramidDiagram',
  '<CaseCompare',
  '<MicroExercise',
  '<CollapsiblePanel title="适用边界"',
  '<CollapsiblePanel title="可靠来源"',
];

export function parseFrontMatter(text) {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return null;
  const lines = match[1].split(/\r?\n/);
  const fm = {};
  for (const line of lines) {
    const m = line.match(/^([a-z_]+):\s*(.+)$/);
    if (m) fm[m[1]] = m[2].trim();
  }
  return fm;
}

export function validateLessonFile(filePath, root = process.cwd()) {
  const rel = path.relative(root, path.resolve(root, filePath));
  const errors = [];

  if (!rel.startsWith(SERIES_DIR) || rel.endsWith('index.mdx')) {
    errors.push(`Path must be under ${SERIES_DIR}/ and not index.mdx (got ${rel})`);
  }
  if (!/\.mdx$/.test(rel)) {
    errors.push('Lesson must be a .mdx file');
  }
  if (!fs.existsSync(path.join(root, rel))) {
    errors.push('File does not exist');
    return {ok: false, errors};
  }

  const text = fs.readFileSync(path.join(root, rel), 'utf8');
  const fm = parseFrontMatter(text);
  if (!fm) errors.push('Missing YAML front matter');

  if (fm) {
    for (const key of REQUIRED_FM) {
      if (fm[key] == null || fm[key] === '') errors.push(`Missing front matter: ${key}`);
    }
    if (fm.series !== 'pyramid') errors.push('series must be pyramid');
  }

  for (const marker of REQUIRED_MARKERS) {
    if (!text.includes(marker)) errors.push(`Missing block marker: ${marker}`);
  }

  if (fm?.lesson === '2') {
    errors.push(...validateLesson02Content(text));
  }

  if (fm?.lesson === '3') {
    errors.push(...validateLesson03Content(text));
  }

  return {ok: errors.length === 0, errors, rel};
}

/**
 * Lesson 2 semantics: fictional cases, coherent exercise options, unrelated side topics.
 */
export function validateLesson02Content(text) {
  const errors = [];

  if (!/原创虚构|虚构教学例子/.test(text)) {
    errors.push('第2课正文应标明案例为原创虚构（非原书/非真实事件）');
  }

  if (text.includes('一篇表达只能有一个总观点')) {
    errors.push('避免「一篇表达只能有一个总观点」的绝对表述，应限定为单次论证/表达单元');
  }

  if (text.includes('完全等量')) {
    errors.push('compareNotes 不应使用「完全等量」类表述');
  }

  if (/并不支撑改期/.test(text) && /空调/.test(text)) {
    errors.push('CaseCompare：空调与演示体验可能相关改期，不宜与「并不支撑改期」并用');
  }

  if (!/报销/.test(text)) {
    errors.push('CaseCompare 旁支应使用与改期无关的报销截止类提醒');
  }

  const optionB = text.match(
    /\{\s*id:\s*'B',\s*text:\s*'([^']*)'/,
  )?.[1];
  if (optionB && /改到周四/.test(optionB) && /周四我要外出半天/.test(optionB)) {
    errors.push('MicroExercise B：「改到周四」不能与「周四外出半天」作为同日支撑');
  }

  if (text.includes('correctId="B"') && text.includes('周四我要外出半天')) {
    const microBlock = text.slice(text.indexOf('<MicroExercise'), text.indexOf('/>', text.indexOf('<MicroExercise')) + 2);
    if (/id:\s*'B'[\s\S]*?周四我要外出半天/.test(microBlock)) {
      errors.push('MicroExercise B 选项正文含与改期冲突的「周四外出半天」');
    }
  }

  return errors;
}

/**
 * Lesson 3 semantics: top-down walk, fictional cases, exercise B layered.
 */
export function validateLesson03Content(text) {
  const errors = [];

  if (!/原创虚构/.test(text)) {
    errors.push('第3课正文应标明案例为原创虚构（非原书/非真实事件）');
  }

  if (!/啰嗦版已经先说了结论/.test(text)) {
    errors.push('compareNotes 应点明啰嗦版已有结论但结论后堆细节');
  }

  if (/本课只教.*先说结论/.test(text) || /今天只练先说结论/.test(text)) {
    errors.push('本课要点是带读者走下金字塔，不应把全文重心写成仅教「先说结论」');
  }

  const hedgeTokens = ['好像', '不确定', '有人说'];
  for (const token of hedgeTokens) {
    if (!text.includes(token)) {
      errors.push(`CaseCompare/verbose 应保留「${token}」等原样措辞`);
    }
  }

  if (/主管反对切换|主管坚持不换|主管不许切换/.test(text)) {
    errors.push('理由 3 不能把「主管可以评估」升格为主管反对切换');
  }

  if (!/correctId="B"/.test(text)) {
    errors.push('MicroExercise 正确答案应为 B');
  }

  const microBlock = text.includes('<MicroExercise')
    ? text.slice(text.indexOf('<MicroExercise'), text.indexOf('/>', text.indexOf('<MicroExercise')) + 2)
    : '';

  if (microBlock && !/id:\s*'B'[\s\S]*?往返更轻松/.test(microBlock)) {
    errors.push('MicroExercise B 应体现结论加分层理由与对应事实');
  }

  if (microBlock && /id:\s*'A'/.test(microBlock) && !/id:\s*'A'[\s\S]*?这次团建/.test(microBlock)) {
    errors.push('MicroExercise A 应先给结论但细节未分层');
  }

  if (/p\.\s*\d+|第\s*\d+\s*页|页码\s*\d+/.test(text)) {
    errors.push('第3课不应编造具体引语页码');
  }

  if (/本课已讲完读者问题|已掌握分组检查|今天讲完读者问题/.test(text)) {
    errors.push('不要把读者问题、分组检查写成本课已讲完');
  }

  if (!/留到后续课/.test(text)) {
    errors.push('读者问题、分组检查等应明确留到后续课');
  }

  return errors;
}

function main() {
  const root = process.cwd();
  const target =
    process.argv[2] ??
    path.join(SERIES_DIR, fs.readdirSync(path.join(root, SERIES_DIR)).find((f) => /^20\d{2}-\d{2}-\d{2}-lesson-\d+\.mdx$/.test(f)) ?? '');

  const result = validateLessonFile(target, root);
  if (!result.ok) {
    console.error(`validate-pyramid-lesson: FAIL (${result.rel})`);
    for (const e of result.errors) console.error(`  - ${e}`);
    process.exit(1);
  }
  console.log(`validate-pyramid-lesson: OK (${result.rel})`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  main();
}