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

  if (fm?.lesson === '4') {
    errors.push(...validateLesson04Content(text, root));
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

/**
 * Lesson 4 semantics: reader's question first, wrong-question verbose, SCQ not taught here.
 */
export function validateLesson04Content(text, root = process.cwd()) {
  const errors = [];

  if (!/原创虚构/.test(text)) {
    errors.push('第4课正文应标明案例为原创虚构（非原书/非真实事件）');
  }

  if (!/啰嗦版主要在评价/.test(text) && !/答非所问/.test(text)) {
    errors.push('compareNotes 应点明啰嗦版在答另一个问题（或答非所问）');
  }

  if (text.includes('完全等量')) {
    errors.push('compareNotes 不应使用「完全等量」类表述');
  }

  const hedgeTokens = ['好像', '有人说'];
  for (const token of hedgeTokens) {
    if (!text.includes(token)) {
      errors.push(`CaseCompare/verbose 应保留「${token}」等原样措辞`);
    }
  }

  if (!/结业证书|讲师在业内口碑/.test(text)) {
    errors.push('啰嗦版应含与读者问题无关、但结构版不借用的旁支事实（如培训评价类措辞）');
  }

  if (/与去不去周四这场无关/.test(text)) {
    errors.push('compareNotes 不宜把口碑、证书说成与培训「完全无关」，应区分「培训好不好」与「周四去不去」');
  }

  if (/第\s*5–7\s*课、第\s*8\s*课和第\s*11\s*课/.test(text)) {
    errors.push('课程页前瞻课号应与 roadmap 一致（行动建议→第 9 课，情景/SCQ→第 8 课，界定问题→第 11 课）');
  }

  if (/行动建议[\s\S]{0,80}第\s*8\s*课/.test(text) && !/行动建议[\s\S]{0,80}第\s*9\s*课/.test(text)) {
    errors.push('行动建议应明确留到第 9 课（与 pyramid-roadmap.json 一致）');
  }

  if (/title:\s*'理由 3[^']*考核/.test(text)) {
    errors.push('理由 3 不得把「不记缺席」升格为「考核」等原文没有的概念');
  }

  errors.push(...validateLesson04Diagram(root));

  if (!/correctId="B"/.test(text)) {
    errors.push('MicroExercise 正确答案应为 B');
  }

  const microBlock = text.includes('<MicroExercise')
    ? text.slice(text.indexOf('<MicroExercise'), text.indexOf('/>', text.indexOf('<MicroExercise')) + 2)
    : '';

  if (microBlock && !/id:\s*'B'[\s\S]*?我建议/.test(microBlock)) {
    errors.push('MicroExercise B 应先回答读者问题（含明确建议或判断）');
  }

  if (microBlock && /id:\s*'A'/.test(microBlock) && !/id:\s*'A'[\s\S]*?值得/.test(microBlock)) {
    errors.push('MicroExercise A 应体现答非所问（评价会议/培训好坏而非是否召开）');
  }

  if (/p\.\s*\d+|第\s*\d+\s*页|页码\s*\d+/.test(text)) {
    errors.push('第4课不应编造具体引语页码');
  }

  if (/本课已讲完.*SCQ|今天教完.*SCQ|已掌握.*SCQ 步骤/.test(text)) {
    errors.push('不要把 SCQ 完整步骤写成本课已教完');
  }

  if (/本课已讲完分组|今天讲完问题界定|已掌握分组检查/.test(text)) {
    errors.push('不要把分组检查、问题界定写成本课已讲完');
  }

  if (!/留到.*课|留到后续课/.test(text)) {
    errors.push('SCQ 步骤、分组检查、问题界定等应明确留到后续课');
  }

  if (!/周五.*方案|方案初稿/.test(text)) {
    errors.push('案例应围绕「周五交方案、周四培训去不去」类读者问题');
  }

  return errors;
}

/**
 * Lesson 4 diagram must stay aligned with CaseCompare reason 3 wording.
 */
export function validateLesson04Diagram(root) {
  const errors = [];
  const diagramPath = path.join(root, 'src/data/pyramid-lesson-04-diagram.json');
  if (!fs.existsSync(diagramPath)) {
    errors.push('缺少 pyramid-lesson-04-diagram.json');
    return errors;
  }
  let diagram;
  try {
    diagram = JSON.parse(fs.readFileSync(diagramPath, 'utf8'));
  } catch {
    errors.push('pyramid-lesson-04-diagram.json 不是合法 JSON');
    return errors;
  }

  const reasonItems =
    diagram.levels?.find((l) => l.id === 'reasons')?.items ?? [];
  const r3 = reasonItems.find((i) => i.id === 'r3');
  if (!r3) {
    errors.push('图中缺少理由 r3');
    return errors;
  }
  if (/考核|不影响考核/.test(r3.text)) {
    errors.push('图的理由 3 不得升格为「考核」等原文没有的概念');
  }
  if (!/缺席|可选/.test(r3.text)) {
    errors.push('理由 3 应概括可选与不记缺席类依据');
  }
  if (!/好像|补听|下季度|还有/.test(r3.text)) {
    errors.push('理由 3 应保留「好像」等不确定性（如补听或下季度场次）');
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