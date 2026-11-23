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