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

  if (fm?.lesson === '5') {
    errors.push(...validateLesson05Content(text, root));
  }

  if (fm?.lesson === '6') {
    errors.push(...validateLesson06Content(text, root));
  }

  if (fm?.lesson === '7') {
    errors.push(...validateLesson07Content(text, root));
  }

  if (fm?.lesson === '8') {
    errors.push(...validateLesson08Content(text, root));
  }

  if (fm?.lesson === '9') {
    errors.push(...validateLesson09Content(text, root));
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

/**
 * Lesson 5 semantics: group similar facts only; insight → lesson 6, critical grouping → lesson 7.
 */
export function validateLesson05Content(text, root = process.cwd()) {
  const errors = [];

  if (!/原创虚构/.test(text)) {
    errors.push('第5课正文应标明案例为原创虚构（非原书/非真实事件）');
  }

  if (!/留到第\s*6\s*课|第\s*6\s*课再练/.test(text)) {
    errors.push('应明确「从一组事实里抽出见解」留到第 6 课');
  }

  if (!/第\s*7\s*课/.test(text)) {
    errors.push('应明确分组批判性检查留到第 7 课');
  }

  if (/本课已讲完.*见解|今天教完.*抽出见解|已掌握分组检查/.test(text)) {
    errors.push('不要把见解抽取或分组检查写成本课已讲完');
  }

  if (/There are three reasons/i.test(text)) {
    errors.push('不应把 course 页反例引语当作本课见解');
  }

  if (text.includes('完全等量')) {
    errors.push('compareNotes 不应使用「完全等量」类表述');
  }

  const hedgeTokens = ['好像', '可能', '不一定'];
  for (const token of hedgeTokens) {
    if (!text.includes(token)) {
      errors.push(`CaseCompare/verbose 应保留「${token}」等原样措辞`);
    }
  }

  if (!/啰嗦版把天气|混在一段话里/.test(text) && !/不同种类的事实混/.test(text)) {
    errors.push('compareNotes 应点明啰嗦版把不同种类事实混在一起');
  }

  if (!/野餐让人放松|值得安排/.test(text)) {
    errors.push('啰嗦版应含不参与分组的旁支评价，结构版不宜升格为论据');
  }

  if (/所以从一组事实里已经看出|因此必须去野餐/.test(text)) {
    errors.push('结构版总起不得把分组夸大为已抽出的见解');
  }

  if (!/差别只在是否按同类分组/.test(text)) {
    errors.push('compareNotes 应说明差别只在分组而非换事实');
  }

  errors.push(...validateLesson05Diagram(root));

  if (!/correctId="B"/.test(text)) {
    errors.push('MicroExercise 正确答案应为 B');
  }

  const microBlock = text.includes('<MicroExercise')
    ? text.slice(text.indexOf('<MicroExercise'), text.indexOf('/>', text.indexOf('<MicroExercise')) + 2)
    : '';

  if (/CaseCompare\s*组件/.test(text)) {
    errors.push('正文不宜出现 CaseCompare 组件等开发术语');
  }

  if (/组别\s*4：同伴与时间[\s\S]*?面包店|title:\s*'组别 4：同伴与时间'[\s\S]*?面包店/.test(text)) {
    errors.push('「同伴与时间」组不宜放入面包店排队等与同伴档期无关的事实');
  }

  if (microBlock && !/出租前要处理|出租前.*哪些问题/.test(microBlock)) {
    errors.push('MicroExercise 题干应对准整套房屋出租前事项分类');
  }

  if (microBlock && !/id:\s*'B'[\s\S]*?和墙面有关/.test(microBlock)) {
    errors.push('MicroExercise B 应按相似点分组事实');
  }

  if (microBlock) {
    const optionB = microBlock.match(/id:\s*'B'[\s\S]*?text:\s*'([^']+)'/)?.[1] ?? '';
    if (
      /栏杆/.test(optionB) &&
      /和门窗有关[^']*栏杆|门窗有关：[^']*栏杆螺丝/.test(optionB) &&
      !/栏杆安全/.test(optionB)
    ) {
      errors.push('MicroExercise B 不得把阳台栏杆归入「门窗」组');
    }
    const optionA = microBlock.match(/id:\s*'A'[\s\S]*?text:\s*'([^']+)'/)?.[1] ?? '';
    const sharedFacts = ['墙皮', '水槽下面管子', '窗户关不严', '栏杆螺丝'];
    for (const token of sharedFacts) {
      if (optionA.includes(token) !== optionB.includes(token)) {
        errors.push(`MicroExercise A/B 事实集合应一致（含「${token}」）`);
      }
    }
  }

  if (microBlock && /id:\s*'A'/.test(microBlock) && !/id:\s*'A'[\s\S]*?墙皮/.test(microBlock)) {
    errors.push('MicroExercise A 应体现不同种类混在一起');
  }

  if (microBlock && /id:\s*'C'/.test(microBlock) && !/id:\s*'C'[\s\S]*?早该粉刷/.test(microBlock)) {
    errors.push('MicroExercise C 应体现只有笼统判断、未分组事实');
  }

  if (/p\.\s*\d+|第\s*\d+\s*页|页码\s*\d+/.test(text)) {
    errors.push('第5课不应编造具体引语页码');
  }

  if (/本课已讲完.*MECE|今天教完.*SCQ/.test(text)) {
    errors.push('不要把 MECE、SCQ 等写成本课已教完');
  }

  if (!/Grouping together low-level facts|相似的低层事实收成一组|相似的低层事实/.test(text)) {
    errors.push('应点明官网概念页第一步是相似事实分组');
  }

  return errors;
}

/**
 * Lesson 5 diagram: middle layer is group labels; facts must support correct group ids.
 */
export function validateLesson05Diagram(root) {
  const errors = [];
  const diagramPath = path.join(root, 'src/data/pyramid-lesson-05-diagram.json');
  if (!fs.existsSync(diagramPath)) {
    errors.push('缺少 pyramid-lesson-05-diagram.json');
    return errors;
  }
  let diagram;
  try {
    diagram = JSON.parse(fs.readFileSync(diagramPath, 'utf8'));
  } catch {
    errors.push('pyramid-lesson-05-diagram.json 不是合法 JSON');
    return errors;
  }

  const groups = diagram.levels?.find((l) => l.id === 'groups')?.items ?? [];
  if (groups.length < 3) {
    errors.push('图的中层应至少有若干同类组别');
  }
  const groupIds = new Set(groups.map((g) => g.id));

  const facts = diagram.levels?.find((l) => l.id === 'facts')?.items ?? [];
  for (const f of facts) {
    if (!f.supports || !groupIds.has(f.supports)) {
      errors.push(`事实「${f.text?.slice(0, 12)}…」的 supports 必须指向有效组别`);
    }
  }

  const weatherFacts = facts.filter((f) => f.supports === 'g1');
  if (!weatherFacts.some((f) => /阵雨/.test(f.text)) || !weatherFacts.some((f) => /更晴/.test(f.text))) {
    errors.push('天气组事实应与正文天气类一致');
  }

  const gearFacts = facts.filter((f) => f.supports === 'g2');
  if (!gearFacts.some((f) => /野餐垫/.test(f.text)) || !gearFacts.some((f) => /保温箱/.test(f.text))) {
    errors.push('用具组事实不应张冠李戴（野餐垫、保温箱应在 g2）');
  }

  if (facts.some((f) => /野餐垫/.test(f.text) && f.supports !== 'g2')) {
    errors.push('野餐垫事实不得撑在非用具组上');
  }

  const peerFacts = facts.filter((f) => f.supports === 'g4');
  if (peerFacts.some((f) => /面包店|三明治|排队很长/.test(f.text))) {
    errors.push('图解「同伴与时间」组不应含面包店排队类事实');
  }
  if (
    peerFacts.length > 0 &&
    !peerFacts.some((f) => /小周|朋友/.test(f.text)) &&
    !peerFacts.some((f) => /汇合|出发|集合|下午到|上午/.test(f.text))
  ) {
    errors.push('图解同伴与时间组应含同伴档期或汇合时间类事实');
  }

  const middleLabel = diagram.levels?.find((l) => l.layer === 'middle')?.label ?? '';
  if (/理由/.test(middleLabel) && !/组别/.test(middleLabel)) {
    errors.push('图的中层标签宜用组别而非单独「理由」');
  }

  if (!/第\s*6\s*课/.test(diagram.caption ?? '')) {
    errors.push('图注应点明见解抽取留到第 6 课');
  }

  return errors;
}

function insightTextOverStrong(text) {
  if (/必去|必不去|必须选周日|肯定更晴|周日一定晴/.test(text)) return true;
  if (/一定晴/.test(text) && !/不能|还不|不宜|不是|不按|别按/.test(text)) return true;
  if (/一定下雨/.test(text) && !/不能|还不|不宜/.test(text)) return true;
  return false;
}

/**
 * Lesson 6 semantics: draw insight from grouped similar facts; critical grouping → lesson 7.
 */
export function validateLesson06Content(text, root = process.cwd()) {
  const errors = [];

  if (!/原创虚构/.test(text)) {
    errors.push('第6课正文应标明案例为原创虚构（非原书/非真实事件）');
  }

  if (!/先把同类的事实收在一起/.test(text)) {
    errors.push('上节回顾应准确概括第 5 课要点（同类事实收成一组）');
  }

  if (
    !/Drawing an insight from having seen the similarity|从看到相似中抽出见解|从一组事实里抽出见解/.test(
      text,
    )
  ) {
    errors.push('应点明官网概念页第二步是从相似中抽出见解');
  }

  if (!/第\s*7\s*课/.test(text)) {
    errors.push('应明确 How to Look Critically at the Groupings 等分组检查留到第 7 课');
  }

  if (/本课已讲完分组检查|已掌握.*Look Critically|今天教完.*理由个数/.test(text)) {
    errors.push('不要把第 7 课的系统分组检查写成本课已讲完');
  }

  if (
    /There are three reasons/i.test(text) &&
    !/not an appropriate insight|不宜当作|不是.*恰当见解|反例|举例/.test(text)
  ) {
    errors.push('不应把「There are three reasons」类报个数写法当作恰当见解示范');
  }

  if (text.includes('完全等量')) {
    errors.push('compareNotes 不应使用「完全等量」类表述');
  }

  const requiredFactSnippets = [
    '周六预报说午后可能阵雨，不一定下透。',
    '周日好像更晴一点，但也不确定。',
    '野餐垫上周用完还没洗，可能来得及晾。',
    '保温箱盖子卡扣好像有点松，不一定漏气。',
    '导航显示两处草坪都要步行二十分钟左右。',
    '其中一处好像要预约，另一处先到先得。',
    '朋友小周周六上午有事，只能下午出发。',
    '大家原先说周日上午十点在地铁站集合，小周下午才能到，汇合时间可能要往后挪。',
  ];
  for (const snippet of requiredFactSnippets) {
    if (!text.includes(snippet)) {
      errors.push(`CaseCompare 应保留野餐案列事实：「${snippet.slice(0, 16)}…」`);
    }
  }

  const hedgeTokens = ['好像', '可能', '不一定'];
  for (const token of hedgeTokens) {
    if (!text.includes(token)) {
      errors.push(`正文应保留「${token}」等原样措辞`);
    }
  }

  const caseBlock = text.includes('<CaseCompare')
    ? text.slice(text.indexOf('<CaseCompare'), text.indexOf('/>', text.indexOf('<CaseCompare')) + 2)
    : '';
  if (caseBlock && /conclusion="[^"]*(必去|必不去|一定选周日|周日一定晴|肯定更晴)/.test(caseBlock)) {
    errors.push('结构版结论不得把不确定性升格为必去/一定晴等过强判断');
  }
  if (caseBlock) {
    const titles = [...caseBlock.matchAll(/title:\s*'([^']+)'/g)].map((m) => m[1]);
    for (const inner of titles) {
      if (/^(?:天气|野餐用具|地点|同伴)/.test(inner) && insightTextOverStrong(inner)) {
        errors.push('结构版各组见解不得明显强于事实（如一定晴、必去）');
        break;
      }
    }
  }

  if (!/差别.*抽出|见解.*事实强度|罗列完就停/.test(text)) {
    errors.push('compareNotes 应说明差别在于是否抽出与事实强度相符的见解');
  }

  if (!/换了一组事实/.test(text) && !/而不是换了一组虚构事实/.test(text)) {
    errors.push('compareNotes 应点明两版使用相同事实而非换案');
  }

  const reasonTitles = [...text.matchAll(/title:\s*'([^']+)'/g)].map((m) => m[1]);
  const picnicInsightTitles = reasonTitles.filter((t) => /天气|用具|地点|同伴/.test(t));
  if (picnicInsightTitles.length < 4) {
    errors.push('CaseCompare 结构版应含四组见解（或「组别：见解」）标题');
  }
  if (picnicInsightTitles.some((t) => /^组别\s*\d：/.test(t) && !/：.*[。；]|不稳|还不|可能|好像|不确定|未必|要确认|要挪|不能按/.test(t))) {
    errors.push('CaseCompare 组别标题后应写出见解，不宜只重复组别标签');
  }
  if (reasonTitles.some((t) => /一共有.*条|共有\d|三个原因|两个理由/.test(t))) {
    errors.push('见解不宜只报个数（如「一共有两条」）');
  }

  errors.push(...validateLesson06Diagram(root, text));

  if (!/correctId="B"/.test(text)) {
    errors.push('MicroExercise 正确答案应为 B');
  }

  const microBlock = text.includes('<MicroExercise')
    ? text.slice(text.indexOf('<MicroExercise'), text.indexOf('/>', text.indexOf('<MicroExercise')) + 2)
    : '';

  if (microBlock && /出租前要处理|出租前.*哪些问题/.test(microBlock)) {
    errors.push('MicroExercise 题干不应重复第 5 课出租房题');
  }

  if (microBlock && /组件|JSON/.test(microBlock)) {
    errors.push('MicroExercise 不宜出现组件、JSON 等开发术语');
  }

  if (microBlock && !/id:\s*'B'[\s\S]*?(见解|说明|意味着|还不|可能要|未必)/.test(microBlock)) {
    errors.push('MicroExercise B 应体现从分组事实抽出与强度相符的见解');
  }

  if (/CaseCompare\s*组件|PyramidDiagram\s*组件/.test(text)) {
    errors.push('正文不宜出现组件等开发术语');
  }

  if (/p\.\s*\d+|第\s*\d+\s*页|页码\s*\d+/.test(text)) {
    errors.push('第6课不应编造具体引语页码');
  }

  if (!/one_liner|oneLiner/.test(text)) {
    errors.push('LessonHero oneLiner 应与 front matter one_liner 要点一致');
  }

  return errors;
}

/**
 * Lesson 6 diagram: middle layer is insights; facts support matching insight ids.
 */
export function validateLesson06Diagram(root, lessonText = '') {
  const errors = [];
  const diagramPath = path.join(root, 'src/data/pyramid-lesson-06-diagram.json');
  if (!fs.existsSync(diagramPath)) {
    errors.push('缺少 pyramid-lesson-06-diagram.json');
    return errors;
  }
  let diagram;
  try {
    diagram = JSON.parse(fs.readFileSync(diagramPath, 'utf8'));
  } catch {
    errors.push('pyramid-lesson-06-diagram.json 不是合法 JSON');
    return errors;
  }

  const middle = diagram.levels?.find((l) => l.layer === 'middle');
  if (!middle) {
    errors.push('图缺少中间层');
    return errors;
  }
  if (/组别/.test(middle.label ?? '') && !/见解/.test(middle.label ?? '')) {
    errors.push('图的中层标签应为见解而非仅「同类组别」');
  }
  if (middle.id === 'groups') {
    errors.push('第 6 图中层 id 宜用 insights 等，不应沿用 lesson 5 的 groups');
  }

  const insightItems = middle.items ?? [];
  const insightIds = new Set(insightItems.map((i) => i.id));
  if (insightItems.length < 4) {
    errors.push('图的中层应至少有四条例见的概括');
  }
  if (insightItems.some((i) => /^(天气与日子|野餐用具|地点与到达|同伴与时间)$/.test(i.text))) {
    errors.push('图的中层文字应是见解，不宜仅为组别名词');
  }
  if (insightItems.some((i) => /一共有|共有\d|三个原因/.test(i.text))) {
    errors.push('图的中层不宜用报个数充当见解');
  }
  if (insightItems.some((i) => insightTextOverStrong(i.text ?? ''))) {
    errors.push('图中见解不得过强（如一定晴、必去）');
  }

  const facts = diagram.levels?.find((l) => l.id === 'facts')?.items ?? [];
  for (const f of facts) {
    if (!f.supports || !insightIds.has(f.supports)) {
      errors.push(`事实「${f.text?.slice(0, 12)}…」的 supports 必须指向有效见解 id`);
    }
  }

  const weatherFacts = facts.filter((f) => /阵雨|更晴/.test(f.text ?? ''));
  if (weatherFacts.length >= 2) {
    const weatherInsightIds = new Set(weatherFacts.map((f) => f.supports));
    if (weatherInsightIds.size !== 1) {
      errors.push('两条天气事实应支撑同一条天气见解');
    }
  }

  if (!/虚构/.test(diagram.caption ?? '')) {
    errors.push('图注应标明虚构并点出本课在练抽出见解');
  }
  if (!/抽出见解|见解/.test(diagram.caption ?? '')) {
    errors.push('图注应点明本课练习抽出见解');
  }

  return errors;
}

/**
 * Lesson 7 semantics: critical check on parallel reasons (count, grouping, insight).
 */
export function validateLesson07Content(text, root = process.cwd()) {
  const errors = [];

  if (!/原创虚构/.test(text)) {
    errors.push('第7课正文应标明案例为原创虚构（非原书/非真实事件）');
  }

  if (!/不超过事实强度的见解/.test(text)) {
    errors.push('上节回顾应准确概括第 6 课要点（抽出不超过事实强度的见解）');
  }

  if (!/批判性检查|检查并列/.test(text)) {
    errors.push('应说明本课对并列理由做批判性检查');
  }

  if (!/How to Look Critically at the Groupings/.test(text)) {
    errors.push('应引用课程页 How to Look Critically at the Groupings');
  }

  if (!/not an appropriate insight|不是.*恰当见解/.test(text)) {
    errors.push('应点明 “There are three reasons” 不是恰当见解');
  }

  if (!/个数对不对|分组找得对不对|见解是否恰当/.test(text)) {
    errors.push('应列出三项检查（个数、分组、见解）');
  }

  if (/本课已讲完.*SCQ|今天教完.*问题界定|本课讲完行动建议/.test(text)) {
    errors.push('不要把 SCQ、问题界定、行动建议等写成本课已教完');
  }

  if (/MECE/.test(text) && !/教学用语|帮助理解/.test(text)) {
    errors.push('提及 MECE 时应标明为教学用语而非官网本段原话');
  }

  if (text.includes('完全等量')) {
    errors.push('compareNotes 不应使用「完全等量」类表述');
  }

  const requiredFactSnippets = [
    '最近两次迭代里，需求在群里中途改过，有人说可能没注意到 @ 提醒。',
    '在群里搜旧对话，有时要等挺久才出结果，不一定每次都很慢。',
    '上周试运行里，八人团队里大概三人好像打开过看板视图，其余好像还没点开。',
    '后端同事说留在群里上下文已经都在，可能不太想两边切。',
    '安全同事说供应商的数据条款可能还在审，目前好像不能下定论。',
    '免费席位上限明年一季度可能碰到，还不确定会不会超。',
  ];
  for (const snippet of requiredFactSnippets) {
    if (!text.includes(snippet)) {
      errors.push(`CaseCompare 应保留换工具案事实：「${snippet.slice(0, 14)}…」`);
    }
  }

  const hedgeTokens = ['好像', '可能', '不一定'];
  for (const token of hedgeTokens) {
    if (!text.includes(token)) {
      errors.push(`正文应保留「${token}」等原样措辞`);
    }
  }

  const caseBlock = text.includes('<CaseCompare')
    ? text.slice(text.indexOf('<CaseCompare'), text.indexOf('/>', text.indexOf('<CaseCompare')) + 2)
    : '';
  if (caseBlock && /conclusion="[^"]*(必须换|下周就换|一定切换|全员必换)/.test(caseBlock)) {
    errors.push('结构版结论不得把不确定性升格为必须切换等过强判断');
  }

  if (!/差别.*检查|个数|分组|见解/.test(text) || !/同一批事实|相同事实/.test(text)) {
    errors.push('compareNotes 应点明两版事实相同、差别在检查（个数/分组/见解）');
  }

  if (!/饭团|便利店/.test(text)) {
    errors.push('啰嗦版宜含不参与成理由的旁支（如便利店饭团）');
  }
  if (caseBlock && /title:\s*'[^']*饭团/.test(text)) {
    errors.push('结构版不得把旁支饭团升格为一条理由');
  }

  const reasonTitles = [...text.matchAll(/title:\s*'([^']+)'/g)].map((m) => m[1]);
  const toolReasons = reasonTitles.filter((t) => /协作|试用|切换前提|意愿/.test(t));
  if (toolReasons.length !== 3) {
    errors.push('CaseCompare 结构版经检查后应正好三条并列理由');
  }
  if (reasonTitles.some((t) => /^一共有|共有\d个理由|There are three reasons$/i.test(t.trim()))) {
    errors.push('结构版理由标题不宜只报个数');
  }

  errors.push(...validateLesson07Diagram(root, text));

  if (!/correctId="B"/.test(text)) {
    errors.push('MicroExercise 正确答案应为 B');
  }

  const microBlock = text.includes('<MicroExercise')
    ? text.slice(text.indexOf('<MicroExercise'), text.indexOf('/>', text.indexOf('<MicroExercise')) + 2)
    : '';

  if (microBlock && /野餐|出租房/.test(microBlock)) {
    errors.push('MicroExercise 题干不应重复第 5–6 课案例');
  }

  if (microBlock && /咖啡机|饭团/.test(microBlock)) {
    errors.push('MicroExercise 选项不应引入题干未给出的旁支事实');
  }

  if (microBlock) {
    const optionA = microBlock.match(/id:\s*'A'[\s\S]*?text:\s*'([^']+)'/)?.[1] ?? '';
    const optionB = microBlock.match(/id:\s*'B'[\s\S]*?text:\s*'([^']+)'/)?.[1] ?? '';
    if (optionA && /一共有/.test(optionA) && !/各算一条|重复|拆成|关旧路径/.test(optionA)) {
      errors.push('MicroExercise A 应体现未经检查的个数或分组问题');
    }
    if (optionB && !/流程|系统|规则/.test(optionB)) {
      errors.push('MicroExercise B 应按相似点分组并写出见解');
    }
    if (optionB && !/还不|可能|好像|未必|弹性|不能假设/.test(optionB)) {
      errors.push('MicroExercise B 见解应与不确定性措辞相称');
    }
    const explanation =
      microBlock.match(/explanation="([^"]+)"/)?.[1]
      ?? microBlock.match(/explanation=\{['"`]([^'"`]+)['"`]\}/)?.[1]
      ?? '';
    if (/无关旁支/.test(explanation) && !/饭团|咖啡|便利店/.test(microBlock)) {
      errors.push('MicroExercise 解析不宜把「无关旁支」当作 A 的主错（除非题干或选项真有题干外旁支）');
    }
    if (optionB && /流程[：:]/.test(optionB)) {
      const head = optionB.split(/流程[：:]/)[0];
      if (head.length < 6 || !/最好先|不宜|先确认|再定|还不能|留弹性|都还有不确定/.test(head)) {
        errors.push('MicroExercise B 宜有由三条理由共同支撑的谨慎总判断，而非只有分列见解');
      }
    }
    if (/可能下月才公布|还不确定要不要先改/.test(microBlock) && optionB) {
      const ruleSeg = optionB.match(/规则[：:][^。]+/)?.[0] ?? '';
      if (
        ruleSeg
        && /下月才公布|标准未定/.test(ruleSeg)
        && !/可能|还不确定|好像/.test(ruleSeg)
      ) {
        errors.push('MicroExercise B 规则条见解应保留题干「可能」「还不确定」强度');
      }
      const sysSeg = optionB.match(/系统[：:][^。]+/)?.[0] ?? '';
      if (sysSeg && /上传习惯|不会传附件/.test(sysSeg) && !/可能|好像|还不/.test(sysSeg)) {
        errors.push('MicroExercise B 系统条见解应保留题干不确定性措辞');
      }
    }
  }

  const compareNotesBlob = text.includes('compareNotes')
    ? text.slice(text.indexOf('compareNotes'), text.indexOf('/>', text.indexOf('<CaseCompare')) + 2)
    : '';
  if (
    compareNotesBlob
    && /算一条|混成一条/.test(compareNotesBlob)
    && /@/.test(compareNotesBlob)
    && /搜/.test(compareNotesBlob)
    && !/共同相似|相似点|同组|群内信息/.test(compareNotesBlob)
  ) {
    errors.push(
      'compareNotes 若批评啰嗦版把 @ 与搜旧消息合并计数，应说明结构版同组依据（如共同相似点），避免「前错后对」假象',
    );
  }

  const prose = text.replace(/^import[^\n]+\n/gm, '');
  if (/CaseCompare\s*组件|PyramidDiagram\s*组件|\bJSON\b|pull request/i.test(prose)) {
    errors.push('正文不宜出现组件、JSON、PR 等开发术语');
  }

  if (/p\.\s*\d+|第\s*\d+\s*页|页码\s*\d+/.test(text)) {
    errors.push('第7课不应编造具体引语页码');
  }

  if (!/第\s*5\s*课/.test(text) && !/分组/.test(text)) {
    errors.push('适用边界或回顾应提及本课不代替第 5 课分组');
  }

  return errors;
}

/**
 * Lesson 7 diagram: middle layer is checked parallel reasons; not count-only.
 */
export function validateLesson07Diagram(root, lessonText = '') {
  const errors = [];
  const diagramPath = path.join(root, 'src/data/pyramid-lesson-07-diagram.json');
  if (!fs.existsSync(diagramPath)) {
    errors.push('缺少 pyramid-lesson-07-diagram.json');
    return errors;
  }
  let diagram;
  try {
    diagram = JSON.parse(fs.readFileSync(diagramPath, 'utf8'));
  } catch {
    errors.push('pyramid-lesson-07-diagram.json 不是合法 JSON');
    return errors;
  }

  const middle = diagram.levels?.find((l) => l.layer === 'middle');
  if (!middle) {
    errors.push('图缺少中间层');
    return errors;
  }
  if (!/检查|理由/.test(middle.label ?? '')) {
    errors.push('图的中层标签应点出经检查站得住的并列理由');
  }
  if (middle.id === 'insights' && !/理由|检查/.test(diagram.caption ?? '')) {
    errors.push('第 7 图中层宜为 reasons 等，语义为经检查的理由而非纯见解层');
  }

  const reasonItems = middle.items ?? [];
  const reasonIds = new Set(reasonItems.map((i) => i.id));
  if (reasonItems.length !== 3) {
    errors.push('图的中层应正好三条例经检查的并列理由');
  }
  if (reasonItems.some((i) => /一共有|There are three reasons/i.test(i.text ?? ''))) {
    errors.push('图的中层不宜用报个数充当理由或见解');
  }
  if (reasonItems.some((i) => insightTextOverStrong(i.text ?? ''))) {
    errors.push('图中理由概括不得过强（如必须切换）');
  }
  if (reasonItems.some((i) => /^(协作|试用|切换)/.test(i.text ?? '') && (i.text ?? '').length < 12)) {
    errors.push('图的中层文字应是带见解的理由概括，不宜仅为类别名词');
  }

  const facts = diagram.levels?.find((l) => l.id === 'facts')?.items ?? [];
  if (facts.length < 6) {
    errors.push('图底层应含换工具案六条事实');
  }
  for (const f of facts) {
    if (!f.supports || !reasonIds.has(f.supports)) {
      errors.push(`事实「${f.text?.slice(0, 12)}…」的 supports 必须指向有效理由 id`);
    }
  }

  const r1Facts = facts.filter((f) => f.supports === 'r1');
  if (!r1Facts.some((f) => /@/.test(f.text)) || !r1Facts.some((f) => /搜旧对话/.test(f.text))) {
    errors.push('协作组事实应含 @ 漏看与搜对话类条目');
  }
  const r2Facts = facts.filter((f) => f.supports === 'r2');
  if (!r2Facts.some((f) => /看板/.test(f.text)) || !r2Facts.some((f) => /留在群里/.test(f.text))) {
    errors.push('试用意愿组应含看板试用与留在群里类事实');
  }
  const r3Facts = facts.filter((f) => f.supports === 'r3');
  if (!r3Facts.some((f) => /安全/.test(f.text)) || !r3Facts.some((f) => /席位/.test(f.text))) {
    errors.push('切换前提组应含安全审查与席位类事实');
  }

  if (!/批判性检查|检查/.test(diagram.caption ?? '')) {
    errors.push('图注应点明本课练习分组/并列理由的批判性检查');
  }
  if (!/虚构/.test(diagram.caption ?? '')) {
    errors.push('图注应标明虚构教学案例');
  }

  return errors;
}

/**
 * Lesson 8 semantics: SCQ path — situation, complication, question, then answer.
 */
export function validateLesson08Content(text, root = process.cwd()) {
  const errors = [];

  if (!/原创虚构/.test(text)) {
    errors.push('第8课正文应标明案例为原创虚构（非原书/非真实事件）');
  }

  if (!/个数.*分组.*见解|并列理由.*检查/.test(text)) {
    errors.push('上节回顾应概括第 7 课要点（个数、分组与见解的检查）');
  }

  if (!/情景|Situation/.test(text) || !/变化|Complication/.test(text) || !/问题|Question/.test(text)) {
    errors.push('应说明情景（S）、变化（C）、问题（Q）三步');
  }

  if (!/SCQ Framework|identifying the question in your reader's mind/i.test(text)) {
    errors.push('可靠来源或正文应提及官网 SCQ Framework 与识别读者 question 的用途');
  }

  if (!/How to Build a Pyramid|identify the reader's question/i.test(text)) {
    errors.push('应引用课程页 How to Build a Pyramid 中先弄清读者 question 的表述');
  }

  if (!/第\s*4\s*课|弄清读者心里的问题/.test(text)) {
    errors.push('应说明与第 4 课「先弄清问题」的衔接');
  }

  if (!/先说结论|顶端答案|再给出顶端答案/.test(text)) {
    errors.push('应点明问题清楚后仍先说结论（顶端答案），与第 1 课一致');
  }

  if (!/第\s*9\s*课/.test(text) || !/第\s*10\s*课/.test(text) || !/第\s*11\s*课/.test(text) || !/第\s*12\s*课/.test(text)) {
    errors.push('应前瞻第 9–12 课主题但不展开');
  }

  if (
    /本课已(经)?讲完.*行动建议|今天教完.*归纳与演绎|本课展开讲授.*复杂情境|全文回头检查的具体步骤/.test(
      text,
    )
  ) {
    errors.push('不要把第 9–12 课主题写成本课已教完或展开讲授');
  }

  if (/结论埋在长篇背景.*正确|不给答案.*示范/.test(text)) {
    errors.push('不宜把「不给答案」或把结论埋进长背景当作正确示范');
  }

  if (text.includes('完全等量')) {
    errors.push('compareNotes 不应使用「完全等量」类表述');
  }

  const requiredFactSnippets = [
    '财务同事说捐款入账可能要等新捐赠管理办法出台，还不确定能否和抽奖奖金走同一笔预算。',
    '工会介绍捐步时提到步数可以折算小额捐款，但具体额度口径好像还在和法务核对。',
    '有的同事在茶水间聊天时好像更想保留面对面热闹感。',
    '也有人表示愿意试试捐步，但目前好像还没有统一问卷结果。',
    '活动筹备组说距离年会还有六周，节目单好像还在收意见。',
    '去年年会到场率大概八成，抽奖时现场气氛挺热闹。',
    '筹备同事担心大改形态可能来不及排练收尾，也不一定来得及把捐步互动排进流程。',
  ];
  for (const snippet of requiredFactSnippets) {
    if (!text.includes(snippet)) {
      errors.push(`CaseCompare 应保留年会案例事实：「${snippet.slice(0, 16)}…」`);
    }
  }

  const hedgeTokens = ['好像', '可能', '不一定'];
  for (const token of hedgeTokens) {
    if (!text.includes(token)) {
      errors.push(`正文应保留「${token}」等原样措辞`);
    }
  }

  const caseBlock = text.includes('<CaseCompare')
    ? text.slice(text.indexOf('<CaseCompare'), text.indexOf('/>', text.indexOf('<CaseCompare')) + 2)
    : '';
  if (caseBlock && !/scq=\{\{/.test(caseBlock)) {
    errors.push('CaseCompare 结构版应通过 scq 属性展示可读的情景、变化、问题三句');
  }
  if (caseBlock && /scq=\{\{/.test(caseBlock)) {
    const scqBody = caseBlock.match(/scq=\{\{([\s\S]*?)\}\}\s*\n\s*conclusion=/)?.[1] ?? '';
    if (!/situation:/.test(scqBody) || !/complication:/.test(scqBody) || !/question:/.test(scqBody)) {
      errors.push('scq 应含 situation、complication、question 三项');
    }
  }
  const structuredConclusion = caseBlock.match(/conclusion="([^"]+)"/)?.[1] ?? '';
  if (structuredConclusion && /小规模抽奖/.test(structuredConclusion)) {
    errors.push('结构版结论不宜写「小规模抽奖」等无事实依据的规模判断');
  }
  if (
    structuredConclusion
    && /(全面改成捐步|必须改成捐步|立刻全面)/.test(structuredConclusion)
    && !/不宜|不要|还不能|不宜现在/.test(structuredConclusion)
  ) {
    errors.push('结构版结论不得把不确定性升格为必须全面改捐步等过强判断');
  }

  if (!/S→C→Q|情景.*变化.*问题/.test(text)) {
    errors.push('compareNotes 或正文应点明结构版先走 S→C→Q 再答');
  }

  if (!/同一批事实|相同事实/.test(text)) {
    errors.push('compareNotes 应点明两版使用同一批事实');
  }

  if (!/停车位|摇号/.test(text)) {
    errors.push('啰嗦版宜含不参与成理由的旁支（如停车位摇号）');
  }
  if (caseBlock && /title:\s*'[^']*摇号/.test(text)) {
    errors.push('结构版不得把旁支摇号升格为一条理由');
  }

  if (!/麻辣香锅|食堂/.test(text)) {
    errors.push('啰嗦版宜用不参与成理由的旁支背景冲淡问题（如食堂侧写）');
  }

  const reasonTitles = [...text.matchAll(/title:\s*'([^']+)'/g)].map((m) => m[1]);
  const scqReasons = reasonTitles.filter((t) => /预算|偏好|筹备/.test(t));
  if (scqReasons.length !== 3) {
    errors.push('CaseCompare 结构版在带上问题后应有三条并列理由');
  }

  errors.push(...validateLesson08Diagram(root, text));

  if (!/correctId="B"/.test(text)) {
    errors.push('MicroExercise 正确答案应为 B');
  }

  const microBlock = text.includes('<MicroExercise')
    ? text.slice(text.indexOf('<MicroExercise'), text.indexOf('/>', text.indexOf('<MicroExercise')) + 2)
    : '';

  if (microBlock && /野餐|群聊换|报销单据|出租房检修/.test(microBlock)) {
    errors.push('MicroExercise 题干不应重复前几课案例');
  }

  if (microBlock && /停车位摇号|年会抽奖/.test(microBlock)) {
    errors.push('MicroExercise 不宜重复本课年会案例');
  }

  if (microBlock) {
    const optionB = microBlock.match(/id:\s*'B'[\s\S]*?text:\s*'([^']+)'/)?.[1] ?? '';
    if (optionB && !/情景|变化|问题/.test(optionB)) {
      errors.push('MicroExercise B 应体现情景→变化→问题路径');
    }
    if (optionB && !/不宜|还不|未查清|摸底|先/.test(optionB)) {
      errors.push('MicroExercise B 答案应与事实强度相符（谨慎）');
    }
    const explanation = microBlock.match(/explanation="([^"]+)"/)?.[1] ?? '';
    if (explanation && !/带到.*问题|情景/.test(explanation)) {
      errors.push('MicroExercise 解析应点明是否把读者带到问题前');
    }
  }

  const prose = text.replace(/^import[^\n]+\n/gm, '');
  if (/CaseCompare\s*组件|PyramidDiagram\s*组件|\bJSON\b|pull request/i.test(prose)) {
    errors.push('正文不宜出现组件、JSON、PR 等开发术语');
  }

  if (/p\.\s*\d+|第\s*\d+\s*页|页码\s*\d+/.test(text)) {
    errors.push('第8课不应编造具体引语页码');
  }

  if (!/教学设计/.test(text)) {
    errors.push('展开 S/C/Q 操作步骤时应标明为教学设计');
  }

  if (!/第\s*5.*7\s*课|分组.*见解.*检查/.test(text)) {
    errors.push('适用边界应提及本课不代替第 5–7 课分组与检查');
  }

  return errors;
}

/**
 * Lesson 8 diagram: top is answer after SCQ; middle reasons; facts support ids; not SCQ labels only.
 */
export function validateLesson08Diagram(root, lessonText = '') {
  const errors = [];
  const diagramPath = path.join(root, 'src/data/pyramid-lesson-08-diagram.json');
  if (!fs.existsSync(diagramPath)) {
    errors.push('缺少 pyramid-lesson-08-diagram.json');
    return errors;
  }
  let diagram;
  try {
    diagram = JSON.parse(fs.readFileSync(diagramPath, 'utf8'));
  } catch {
    errors.push('pyramid-lesson-08-diagram.json 不是合法 JSON');
    return errors;
  }

  if (!/情景|变化|问题|带到/.test(diagram.caption ?? '')) {
    errors.push('图注应点明用情景把读者带到问题前');
  }
  if (!/虚构/.test(diagram.caption ?? '')) {
    errors.push('图注应标明虚构教学案例');
  }

  const top = diagram.levels?.find((l) => l.layer === 'top');
  if (!top) {
    errors.push('图缺少顶层');
    return errors;
  }
  const topText = top.items?.[0]?.text ?? '';
  if (!/抽奖|捐步/.test(topText) || !/保留|不宜|摸底/.test(topText)) {
    errors.push('图顶层应是回答问题后的顶端答案，不宜只写「有一个问题」');
  }
  if (/^问题[：:]\s*$/.test(topText)) {
    errors.push('图顶层不宜只有问题标签而无答案');
  }

  const middle = diagram.levels?.find((l) => l.layer === 'middle');
  if (!middle) {
    errors.push('图缺少中间层');
    return errors;
  }
  if (/^情景$|^变化$|^问题$/.test(middle.label ?? '')) {
    errors.push('图的中层不宜仅用情景/变化/问题类别词而无理由结构');
  }

  const reasonItems = middle.items ?? [];
  const reasonIds = new Set(reasonItems.map((i) => i.id));
  if (reasonItems.length !== 3) {
    errors.push('图的中层应正好三条支撑答案的并列理由');
  }
  if (reasonItems.some((i) => /^(情景|变化|问题)$/.test(i.text ?? ''))) {
    errors.push('图的中层条目应是理由概括，不宜仅为 SCQ 类别词');
  }
  if (reasonItems.some((i) => insightTextOverStrong(i.text ?? ''))) {
    errors.push('图中理由概括不得过强（如必须全面改捐步）');
  }

  const facts = diagram.levels?.find((l) => l.id === 'facts')?.items ?? [];
  if (facts.length < 7) {
    errors.push('图底层应含年会案例七条事实');
  }
  for (const f of facts) {
    if (!f.supports || !reasonIds.has(f.supports)) {
      errors.push(`事实「${f.text?.slice(0, 12)}…」的 supports 必须指向有效理由 id`);
    }
  }

  const r1Facts = facts.filter((f) => f.supports === 'r1');
  if (!r1Facts.some((f) => /捐赠|预算/.test(f.text)) || !r1Facts.some((f) => /法务|额度/.test(f.text))) {
    errors.push('预算与合规组应含捐赠入账与额度核对类事实');
  }
  const r2Facts = facts.filter((f) => f.supports === 'r2');
  if (!r2Facts.some((f) => /热闹/.test(f.text)) || !r2Facts.some((f) => /捐步/.test(f.text))) {
    errors.push('同事偏好组应含热闹感与捐步意愿类事实');
  }
  const r3Facts = facts.filter((f) => f.supports === 'r3');
  if (!r3Facts.some((f) => /六周|节目单/.test(f.text)) || !r3Facts.some((f) => /排练/.test(f.text))) {
    errors.push('筹备节奏组应含时间窗口与排练类事实');
  }
  if (r3Facts.some((f) => /去年|八成/.test(f.text))) {
    errors.push('去年到场/热闹宜放在偏好或情景侧，不宜仅挂在筹备节奏理由下');
  }
  const r2FactsHot = facts.filter((f) => f.supports === 'r2');
  if (!r2FactsHot.some((f) => /去年|八成/.test(f.text))) {
    errors.push('同事偏好组宜含去年热闹体验类事实，支撑保留抽奖的偏好语境');
  }
  if (/小规模抽奖/.test(topText)) {
    errors.push('图顶层不宜写无依据的「小规模抽奖」');
  }

  if (lessonText && !lessonText.includes('公司年会按惯例有压轴抽奖')) {
    errors.push('年会情景宜在正文中交代惯例抽奖与热闹体验');
  }

  return errors;
}

/**
 * Lesson 9 semantics: recommendations provoke action — executable total + parallel actions.
 */
export function validateLesson09Content(text, root = process.cwd()) {
  const errors = [];

  if (!/原创虚构/.test(text)) {
    errors.push('第9课正文应标明案例为原创虚构（非原书/非真实事件）');
  }

  if (!/情景|变化/.test(text) || !/问题前|带到/.test(text)) {
    errors.push('上节回顾应概括第 8 课情景—变化—问题前要点');
  }

  if (!/How to Deal with Action Ideas|provoke action|lead to change/i.test(text)) {
    errors.push('应引用课程页 How to Deal with Action Ideas 及 provoke action / lead to change');
  }

  if (!/推动行动|能推动行动/.test(text)) {
    errors.push('应点明本课练「建议写得能推动行动」');
  }

  if (!/第\s*10\s*课/.test(text) || !/第\s*11\s*课/.test(text) || !/第\s*12\s*课/.test(text)) {
    errors.push('应前瞻第 10–12 课主题但不展开');
  }

  if (
    /本课已(经)?讲完.*归纳与演绎|今天教完.*复杂情境|本课展开讲授.*全文回头检查/.test(text)
  ) {
    errors.push('不要把第 10–12 课主题写成本课已教完或展开讲授');
  }

  if (!/教学设计/.test(text)) {
    errors.push('展开操作步骤时应标明为教学设计');
  }

  if (!/第\s*4\s*课|第\s*5.*7\s*课|第\s*8\s*课/.test(text)) {
    errors.push('适用边界应提及本课不代替第 4–8 课已学步骤');
  }

  if (text.includes('完全等量')) {
    errors.push('compareNotes 不应使用「完全等量」类表述');
  }

  const requiredFactSnippets = [
    '三楼会议室多年来凭前台登记领钥匙，同事一般熟悉这套做法。',
    '工作日下午两点到四点高峰时段，纸质登记表常常约满，偶尔为签字先后顺序争执。',
    'IT 同事说工牌读头接口可能能对接，但与会议室日历的联动还没试过，排期好像还要四到六周，还不确定能否赶上本季度窗口。',
    '安防同事说若改成自助进出，审计日志格式可能要用新规，制度草案好像还在内审，还不确定何时能定稿。',
    '有的团队习惯到前台当面交接钥匙，也有人表示愿意用 App 提前一天预约。',
    '设施组拿到读头安装报价单，但采购审批周期好像还不明朗，不一定本季能走完。',
  ];
  for (const snippet of requiredFactSnippets) {
    if (!text.includes(snippet)) {
      errors.push(`CaseCompare 应保留会议室案例事实：「${snippet.slice(0, 16)}…」`);
    }
  }

  const hedgeTokens = ['好像', '可能', '不一定'];
  for (const token of hedgeTokens) {
    if (!text.includes(token)) {
      errors.push(`正文应保留「${token}」等原样措辞`);
    }
  }

  const caseBlock = text.includes('<CaseCompare')
    ? text.slice(text.indexOf('<CaseCompare'), text.indexOf('/>', text.indexOf('<CaseCompare')) + 2)
    : '';
  if (caseBlock && /scq=\{\{/.test(caseBlock)) {
    errors.push('本课 CaseCompare 可不使用 scq；若未用则不要在 compareNotes 里声称结构版先展示 SCQ');
  }

  const structuredConclusion = caseBlock.match(/conclusion="([^"]+)"/)?.[1] ?? '';
  if (structuredConclusion && /建议考虑|关于.*的一些想法|可以再议/.test(structuredConclusion)) {
    errors.push('结构版总建议应是可执行行动，不宜停在「建议考虑」式空话');
  }
  if (structuredConclusion && !/试点|并排|两周|问询|保留|核对|缺口|批准/.test(structuredConclusion)) {
    errors.push('结构版总建议宜含读者可执行或拍板的具体步骤（如核对、试点、保留兜底）');
  }
  if (
    structuredConclusion
    && /(全楼一律|一律刷牌|全面自助)/.test(structuredConclusion)
    && !/不宜|不要|还不能|保留|试点/.test(structuredConclusion)
  ) {
    errors.push('结构版总建议不得把不确定性升格为必须立刻全面刷牌自助');
  }
  if (
    structuredConclusion
    && /(未来|下月).{0,8}(六周|试点|试运行)/.test(structuredConclusion)
    && !/条件满足|书面批准|核对条件|批准后再|待接口/.test(structuredConclusion)
  ) {
    errors.push('结构版总建议不宜在未核实条件、排期与审批前就按下固定周数启动试点');
  }
  if (structuredConclusion && /草案/.test(structuredConclusion) && !/不等于|不宜把草案|草案不等于/.test(structuredConclusion)) {
    errors.push('涉及制度草案时，结构版宜点明草案达标不等于正式合规授权');
  }

  const reasonTitlesOrdered = [...text.matchAll(/title:\s*'([^']+)'/g)].map((m) => m[1]);
  const pilotIdx = reasonTitlesOrdered.findIndex((t) => /试点|并行试运行/.test(t));
  const willIdx = reasonTitlesOrdered.findIndex((t) => /意愿|问询/.test(t));
  if (pilotIdx >= 0 && willIdx >= 0 && willIdx > pilotIdx) {
    errors.push('摸清意愿类行动宜排在限定试点之前，不宜写在试点行动之后');
  }

  const firstActionTitle = reasonTitlesOrdered.find((t) => /联调|核对|合规|排期/.test(t)) ?? '';
  if (
    firstActionTitle
    && /两周内/.test(firstActionTitle)
    && /试连|联调/.test(firstActionTitle)
    && !/缺口|排期清单|可行排期|提议期限/.test(firstActionTitle)
  ) {
    errors.push('在事实写联调排期约四到六周时，不宜把两周写成完成全部试连，宜改为排期与缺口摸底');
  }

  if (/啰嗦版以.*收尾/.test(text)) {
    errors.push('compareNotes 不宜写「啰嗦版以…收尾」，因啰嗦版其后还有升格断言等正文');
  }

  if (caseBlock && !/原创教学建议|并非.*唯一方案/.test(text)) {
    errors.push('结构版示范中的特定期限或试点规模宜标明为原创教学建议，而非事实推出的唯一方案');
  }

  if (!/同一批事实|相同事实/.test(text)) {
    errors.push('compareNotes 应点明两版使用同一批事实');
  }

  if (!/推动行动|可执行|并列行动/.test(text)) {
    errors.push('compareNotes 或正文应点明差别在建议是否写得能推动行动');
  }

  if (caseBlock && /先展示.{0,16}SCQ/.test(text) && !/不先展示/.test(text)) {
    errors.push('未使用 scq 时 compareNotes 不宜声称结构版先展示 SCQ');
  }

  if (!/绿植|浇灌/.test(text)) {
    errors.push('啰嗦版宜含不参与成行动的旁支（如绿植浇灌提醒）');
  }
  if (caseBlock && /title:\s*'[^']*绿植/.test(text)) {
    errors.push('结构版不得把绿植旁支升格为一条并列行动');
  }

  const reasonTitles = [...text.matchAll(/title:\s*'([^']+)'/g)].map((m) => m[1]);
  const actionReasons = reasonTitles.filter((t) => /联调|试点|意愿|合规|核对|排期/.test(t));
  if (actionReasons.length !== 3) {
    errors.push('CaseCompare 结构版应有三条并列行动（核对排期、摸底意愿、限定试点等）');
  }

  errors.push(...validateLesson09Diagram(root, text));

  if (!/correctId="B"/.test(text)) {
    errors.push('MicroExercise 正确答案应为 B');
  }

  const microBlock = text.includes('<MicroExercise')
    ? text.slice(text.indexOf('<MicroExercise'), text.indexOf('/>', text.indexOf('<MicroExercise')) + 2)
    : '';

  const bannedMicroScenes = /野餐|群聊换|出租房检修|年会抽奖|捐步|消防演练|停车位摇号|三楼会议室|工牌自助/;
  if (microBlock && bannedMicroScenes.test(microBlock)) {
    errors.push('MicroExercise 题干不应重复前几课或本课案例场景');
  }

  if (microBlock) {
    const optionB = microBlock.match(/id:\s*'B'[\s\S]*?text:\s*'([^']+)'/)?.[1] ?? '';
    if (optionB && !/行动|两周|一周|试跑|并排/.test(optionB)) {
      errors.push('MicroExercise B 应写出能推动行动的并列步骤');
    }
    if (optionB && !/还不|不明朗|先保留|再定/.test(optionB)) {
      errors.push('MicroExercise B 答案应与事实强度相符（谨慎）');
    }
    if (optionB && /试跑一次/.test(optionB) && /两次/.test(optionB)) {
      errors.push('MicroExercise B 中总建议的试跑次数与行政演练名额不宜不一致（一次/两次）');
    }
    const optionA = microBlock.match(/id:\s*'A'[\s\S]*?text:\s*'([^']+)'/)?.[1] ?? '';
    if (optionA && !/关于|建议研究|全面/.test(optionA)) {
      errors.push('MicroExercise A 宜体现建议含糊或过强');
    }
    const optionC = microBlock.match(/id:\s*'C'[\s\S]*?text:\s*'([^']+)'/)?.[1] ?? '';
    if (optionC && /总建议|行动：/.test(optionC)) {
      errors.push('MicroExercise C 宜只有背景、无可执行建议');
    }
    const explanation = microBlock.match(/explanation="([^"]+)"/)?.[1] ?? '';
    if (explanation && !/推动行动|可执行|并列/.test(explanation)) {
      errors.push('MicroExercise 解析应点明是否能推动行动');
    }
    if (explanation && /好像.*原样|保持原样.*好像|逐字保留.*好像/.test(explanation)) {
      errors.push('MicroExercise 解析不宜声称 B 逐字保留「好像」，B 通常用概括语表达不确定性');
    }
  }

  const prose = text.replace(/^import[^\n]+\n/gm, '');
  if (/CaseCompare\s*组件|PyramidDiagram\s*组件|\bJSON\b|pull request/i.test(prose)) {
    errors.push('正文不宜出现组件、JSON、PR 等开发术语');
  }

  if (/p\.\s*\d+|第\s*\d+\s*页|页码\s*\d+/.test(text)) {
    errors.push('第9课不应编造具体引语页码');
  }

  return errors;
}

/**
 * Lesson 9 diagram: top = actionable recommendation; middle = parallel actions; facts align.
 */
export function validateLesson09Diagram(root, lessonText = '') {
  const errors = [];
  const diagramPath = path.join(root, 'src/data/pyramid-lesson-09-diagram.json');
  if (!fs.existsSync(diagramPath)) {
    errors.push('缺少 pyramid-lesson-09-diagram.json');
    return errors;
  }
  let diagram;
  try {
    diagram = JSON.parse(fs.readFileSync(diagramPath, 'utf8'));
  } catch {
    errors.push('pyramid-lesson-09-diagram.json 不是合法 JSON');
    return errors;
  }

  if (!/推动行动|并列行动|可执行/.test(diagram.caption ?? '')) {
    errors.push('图注应点明建议写得能推动行动');
  }
  if (!/虚构/.test(diagram.caption ?? '')) {
    errors.push('图注应标明虚构教学案例');
  }

  const top = diagram.levels?.find((l) => l.layer === 'top');
  if (!top) {
    errors.push('图缺少顶层');
    return errors;
  }
  const topText = top.items?.[0]?.text ?? '';
  if (!/试点|并排|保留|不宜|核对|缺口/.test(topText) || !/工牌|预约/.test(topText)) {
    errors.push('图顶层应是可执行的总建议（含核对、试点/保留兜底与不宜全面切换）');
  }
  if (
    topText
    && /(未来|下月).{0,8}(六周|试点)/.test(topText)
    && !/条件满足|书面批准|核对|批准后再|待接口/.test(topText)
  ) {
    errors.push('图顶层不宜在未写清条件核实与批准前就按下固定周数启动试点');
  }
  if (topText && /两周内.*试连/.test(topText) && !/缺口|排期|清单|提议期限/.test(topText)) {
    errors.push('图顶层「两周」宜指向排期与缺口摸底，不宜写成两周内完成全部试连');
  }
  if (/建议考虑|关于.*思考/.test(topText)) {
    errors.push('图顶层不宜是题目式空话');
  }
  if (
    /(全楼一律|一律刷牌)/.test(topText)
    && !/不宜|不要|还不能|保留/.test(topText)
  ) {
    errors.push('图顶层不宜在无兜底表述下过强要求全楼刷牌');
  }

  const middle = diagram.levels?.find((l) => l.layer === 'middle');
  if (!middle) {
    errors.push('图缺少中间层');
    return errors;
  }
  if (/^情景$|^变化$|^问题$/.test(middle.label ?? '')) {
    errors.push('图的中层不宜仅用情景/变化/问题类别词');
  }

  const actionItems = middle.items ?? [];
  const actionIds = new Set(actionItems.map((i) => i.id));
  if (actionItems.length !== 3) {
    errors.push('图的中层应正好三条并列行动');
  }
  if (actionItems.some((i) => /^(情景|变化|问题)$/.test(i.text ?? ''))) {
    errors.push('图的中层条目应是行动概括，不宜仅为 SCQ 类别词');
  }
  if (!actionItems.some((i) => /联调|IT|安防|核对|排期/.test(i.text ?? ''))) {
    errors.push('并列行动应含核对排期或联调与合规类步骤');
  }
  if (!actionItems.some((i) => /限定并排试点|并排试运行|高峰工牌/.test(i.text ?? ''))) {
    errors.push('并列行动应含限定并排试点类步骤');
  }
  if (!actionItems.some((i) => /问询|意愿|交接/.test(i.text ?? ''))) {
    errors.push('并列行动应含摸清意愿类步骤');
  }
  if (actionItems.some((i) => insightTextOverStrong(i.text ?? ''))) {
    errors.push('图中行动概括不得过强（如必须全楼刷牌）');
  }

  const facts = diagram.levels?.find((l) => l.id === 'facts')?.items ?? [];
  if (facts.length < 6) {
    errors.push('图底层应含会议室案例至少六条事实');
  }
  for (const f of facts) {
    if (!f.supports || !actionIds.has(f.supports)) {
      errors.push(`事实「${f.text?.slice(0, 12)}…」的 supports 必须指向有效行动 id`);
    }
  }

  const canonicalFacts = [
    '三楼会议室多年来凭前台登记领钥匙，同事一般熟悉这套做法。',
    '工作日下午两点到四点高峰时段，纸质登记表常常约满，偶尔为签字先后顺序争执。',
    'IT 同事说工牌读头接口可能能对接，但与会议室日历的联动还没试过，排期好像还要四到六周，还不确定能否赶上本季度窗口。',
    '安防同事说若改成自助进出，审计日志格式可能要用新规，制度草案好像还在内审，还不确定何时能定稿。',
    '有的团队习惯到前台当面交接钥匙，也有人表示愿意用 App 提前一天预约。',
    '设施组拿到读头安装报价单，但采购审批周期好像还不明朗，不一定本季能走完。',
  ];
  for (const snippet of canonicalFacts) {
    if (!facts.some((f) => f.text === snippet)) {
      errors.push(`图底层事实应与课文一致：「${snippet.slice(0, 14)}…」`);
    }
  }

  const verifyId = actionItems.find((i) => /联调|核对|IT|安防|排期/.test(i.text ?? ''))?.id;
  const pilotId = actionItems.find((i) => /限定并排试点|并排试运行|高峰工牌/.test(i.text ?? ''))?.id;
  const willId = actionItems.find((i) => /摸清意愿|发简短问询/.test(i.text ?? ''))?.id;
  const verifyFacts = facts.filter((f) => f.supports === verifyId);
  if (
    verifyId
    && (!verifyFacts.some((f) => /IT|工牌|接口/.test(f.text)) || !verifyFacts.some((f) => /安防|审计/.test(f.text)))
  ) {
    errors.push('核对排期类行动应含 IT 接口与安防日志类事实');
  }
  const pilotFacts = facts.filter((f) => f.supports === pilotId);
  if (
    pilotId
    && (!pilotFacts.some((f) => /前台|钥匙/.test(f.text)) || !pilotFacts.some((f) => /高峰|约满/.test(f.text)))
  ) {
    errors.push('限定试点行动应含登记惯例与高峰争执类事实');
  }
  const willFacts = facts.filter((f) => f.supports === willId);
  if (willId && !willFacts.some((f) => /当面|App|预约/.test(f.text))) {
    errors.push('摸清意愿行动应含交接偏好类事实');
  }
  const willAction = actionItems.find((i) => i.id === willId);
  const pilotAction = actionItems.find((i) => i.id === pilotId);
  if (willAction && pilotAction) {
    const willPos = actionItems.indexOf(willAction);
    const pilotPos = actionItems.indexOf(pilotAction);
    if (willPos > pilotPos) {
      errors.push('图中摸清意愿行动宜排在限定试点之前');
    }
  }

  if (lessonText && !lessonText.includes('三楼会议室多年来凭前台登记领钥匙')) {
    errors.push('会议室惯例宜在正文中交代前台登记领钥匙');
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