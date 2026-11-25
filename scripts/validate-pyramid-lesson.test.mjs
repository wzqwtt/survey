import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  validateLessonFile,
  parseFrontMatter,
  validateLesson02Content,
  validateLesson03Content,
  validateLesson04Content,
  validateLesson04Diagram,
  validateLesson05Content,
  validateLesson05Diagram,
  validateLesson06Content,
  validateLesson06Diagram,
  validateLesson07Content,
  validateLesson07Diagram,
  validateLesson08Content,
  validateLesson08Diagram,
} from './validate-pyramid-lesson.mjs';

test('parseFrontMatter reads keys', () => {
  const fm = parseFrontMatter('---\nlesson: 1\nseries: pyramid\n---\n');
  assert.equal(fm.lesson, '1');
  assert.equal(fm.series, 'pyramid');
});

test('validateLessonFile rejects wrong directory', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'pyr-'));
  const bad = path.join(root, 'docs/wrong/lesson.mdx');
  fs.mkdirSync(path.dirname(bad), {recursive: true});
  fs.writeFileSync(
    bad,
    `---\nseries: pyramid\nlesson: 1\nsidebar_position: 2\ntitle: t\ndescription: d\ndate: 2026-11-16\none_liner: o\n---\n<PyramidSeriesRoot></PyramidSeriesRoot>`,
  );
  const r = validateLessonFile(bad, root);
  assert.equal(r.ok, false);
});

test('validateLessonFile accepts lesson 01 fixture', () => {
  const root = path.resolve(import.meta.dirname, '..');
  const lesson = path.join(
    root,
    'docs/learning/thinking/pyramid-principle-daily/2026-11-16-lesson-01.mdx',
  );
  const r = validateLessonFile(lesson, root);
  assert.equal(r.ok, true, r.errors?.join('; '));
});

test('validateLesson02Content rejects conflicting micro exercise and AC side topic', () => {
  const badSnippet = `
原创虚构
<CaseCompare scene="" verbose="空调好像不太稳" compareNotes={['并不支撑改期']} />
<MicroExercise correctId="B" options={[{ id: 'B', text: '我们把评审改到周四。周四我要外出半天。' }]} />
一篇表达只能有一个总观点
`;
  const errors = validateLesson02Content(badSnippet);
  assert.ok(errors.some((e) => e.includes('MicroExercise B')), errors.join('; '));
  assert.ok(errors.some((e) => e.includes('空调')), errors.join('; '));
  assert.ok(errors.some((e) => e.includes('绝对表述')), errors.join('; '));
});

test('validateLessonFile accepts lesson 02 fixture', () => {
  const root = path.resolve(import.meta.dirname, '..');
  const lesson = path.join(
    root,
    'docs/learning/thinking/pyramid-principle-daily/2026-11-18-lesson-02.mdx',
  );
  const r = validateLessonFile(lesson, root);
  assert.equal(r.ok, true, r.errors?.join('; '));
});

test('validateLesson03Content rejects invented page refs and wrong exercise answer', () => {
  const badSnippet = `
原创虚构
啰嗦版已经先说了结论
好像 不确定 有人说
留到后续课
<MicroExercise correctId="A" options={[{ id: 'B', text: '往返更轻松' }]} />
主管反对切换
本课已讲完读者问题
p. 42
`;
  const errors = validateLesson03Content(badSnippet);
  assert.ok(errors.some((e) => e.includes('正确答案应为 B')), errors.join('; '));
  assert.ok(errors.some((e) => e.includes('主管反对')), errors.join('; '));
  assert.ok(errors.some((e) => e.includes('读者问题')), errors.join('; '));
  assert.ok(errors.some((e) => e.includes('页码')), errors.join('; '));
});

test('validateLessonFile accepts lesson 03 fixture', () => {
  const root = path.resolve(import.meta.dirname, '..');
  const lesson = path.join(
    root,
    'docs/learning/thinking/pyramid-principle-daily/2026-11-19-lesson-03.mdx',
  );
  const r = validateLessonFile(lesson, root);
  assert.equal(r.ok, true, r.errors?.join('; '));
});

test('validateLesson04Content rejects wrong-question case and false scope claims', () => {
  const badSnippet = `
原创虚构
好像 有人说
结业证书 讲师在业内口碑
<CaseCompare verbose="培训很好" compareNotes={['两版一样', '与去不去周四这场无关']} />
<MicroExercise correctId="A" options={[{ id: 'B', text: '别的' }]} />
本课已讲完 SCQ 步骤
今天讲完问题界定
课程页还讲到分组检查、复杂情境里如何界定问题、行动建议等。
这些分别留到第 5–7 课、第 8 课和第 11 课。
p. 88
完全等量
title: '理由 3：这场培训是可选的，错过也不影响考核。',
`;
  const root = path.resolve(import.meta.dirname, '..');
  const errors = validateLesson04Content(badSnippet, root);
  assert.ok(errors.some((e) => e.includes('啰嗦版') || e.includes('答非所问')), errors.join('; '));
  assert.ok(errors.some((e) => e.includes('正确答案应为 B')), errors.join('; '));
  assert.ok(errors.some((e) => e.includes('SCQ')), errors.join('; '));
  assert.ok(errors.some((e) => e.includes('页码')), errors.join('; '));
  assert.ok(errors.some((e) => e.includes('完全等量')), errors.join('; '));
  assert.ok(errors.some((e) => e.includes('完全无关') || e.includes('周四')), errors.join('; '));
  assert.ok(
    errors.some((e) => e.includes('roadmap') || e.includes('第 9 课') || e.includes('行动建议')),
    errors.join('; '),
  );
  assert.ok(errors.some((e) => e.includes('考核')), errors.join('; '));
  assert.ok(errors.length >= 6, `expected multiple errors, got ${errors.length}`);
});

test('validateLesson04Diagram rejects reason 3 with 考核 elevation', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'pyr-04-'));
  const diagramPath = path.join(root, 'src/data');
  fs.mkdirSync(diagramPath, {recursive: true});
  fs.writeFileSync(
    path.join(diagramPath, 'pyramid-lesson-04-diagram.json'),
    JSON.stringify({
      levels: [
        {
          id: 'reasons',
          items: [{id: 'r3', text: '这场培训是可选的，错过也不影响考核。'}],
        },
      ],
    }),
  );
  const errors = validateLesson04Diagram(root);
  assert.ok(errors.some((e) => e.includes('考核')), errors.join('; '));
});

test('validateLessonFile accepts lesson 04 fixture', () => {
  const root = path.resolve(import.meta.dirname, '..');
  const lesson = path.join(
    root,
    'docs/learning/thinking/pyramid-principle-daily/2026-11-20-lesson-04.mdx',
  );
  const r = validateLessonFile(lesson, root);
  assert.equal(r.ok, true, r.errors?.join('; '));
});

test('validateLesson05Content rejects mixed-facts case and false scope claims', () => {
  const badSnippet = `
原创虚构
好像 可能 不一定
<CaseCompare compareNotes={['完全等量', '换了一组事实']} verbose="只有雨" />
留到第 6 课
本课已讲完见解
p. 12
<MicroExercise correctId="A" options={[{ id: 'B', text: '和墙面有关' }]} />
`;
  const root = path.resolve(import.meta.dirname, '..');
  const errors = validateLesson05Content(badSnippet, root);
  assert.ok(errors.some((e) => e.includes('第 7 课')), errors.join('; '));
  assert.ok(errors.some((e) => e.includes('正确答案应为 B')), errors.join('; '));
  assert.ok(errors.some((e) => e.includes('页码')), errors.join('; '));
  assert.ok(errors.some((e) => e.includes('完全等量')), errors.join('; '));
  assert.ok(errors.some((e) => e.includes('见解')), errors.join('; '));
  assert.ok(errors.length >= 5, `expected multiple errors, got ${errors.length}`);
});

test('validateLesson05Content rejects railing under doors-windows and dev jargon', () => {
  const badMicro = `
原创虚构
留到第 6 课
第 7 课
好像 可能 不一定
差别只在是否按同类分组
野餐让人放松
啰嗦版把天气混在一段话里
CaseCompare 组件里结构版仍用结论
Grouping together low-level facts
<CaseCompare compareNotes={['结构版使用完全相同的事实与不确定性措辞']} verbose="好像可能不一定" />
<MicroExercise
  prompt="要不要先小规模粉刷"
  correctId="B"
  options={[
    { id: 'A', text: '客厅墙皮有一小块鼓起来。厨房水槽下面管子上次滴答过。卧室窗户关不严。阳台栏杆螺丝好像松了一个。' },
    { id: 'B', text: '和墙面有关：客厅墙皮有一小块鼓起来。和门窗有关：卧室窗户关不严；阳台栏杆螺丝好像松了一个。' },
    { id: 'C', text: '早该粉刷一下' },
  ]}
/>`;
  const root = path.resolve(import.meta.dirname, '..');
  const errors = validateLesson05Content(badMicro, root);
  assert.ok(errors.some((e) => e.includes('门窗')), errors.join('; '));
  assert.ok(errors.some((e) => e.includes('组件') || e.includes('开发术语')), errors.join('; '));
  assert.ok(errors.some((e) => e.includes('题干')), errors.join('; '));
});

test('validateLesson05Content rejects bakery fact under peer-time group', () => {
  const badCase = `
原创虚构
留到第 6 课
第 7 课
好像 可能 不一定
差别只在是否按同类分组
野餐让人放松
啰嗦版把天气混在一段话里
Grouping together low-level facts
<CaseCompare compareNotes={['结构版使用完全相同的事实与不确定性措辞']} verbose="好像可能不一定小周面包店" />
reasons={[
  { title: '组别 4：同伴与时间', facts: ['朋友小周周六上午有事。', '有人说上次那家面包店周六排队很长。'] },
]}
<MicroExercise correctId="B" prompt="出租前要处理哪些问题" options={[
  { id: 'A', text: '墙皮。管子。窗户。栏杆。' },
  { id: 'B', text: '和墙面有关：墙皮。和给排水有关：管子。和门窗有关：窗户。和栏杆安全有关：栏杆。' },
  { id: 'C', text: '早该粉刷' },
]} />
`;
  const root = path.resolve(import.meta.dirname, '..');
  const errors = validateLesson05Content(badCase, root);
  assert.ok(errors.some((e) => e.includes('同伴与时间')), errors.join('; '));
});

test('validateLesson05Diagram rejects mis-assigned facts', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'pyr-05-'));
  const diagramPath = path.join(root, 'src/data');
  fs.mkdirSync(diagramPath, {recursive: true});
  fs.writeFileSync(
    path.join(diagramPath, 'pyramid-lesson-05-diagram.json'),
    JSON.stringify({
      caption: '无见解步骤说明',
      levels: [
        {
          id: 'groups',
          layer: 'middle',
          label: '理由',
          items: [{id: 'g2', text: '用具'}],
        },
        {
          id: 'facts',
          layer: 'bottom',
          items: [{id: 'f1', supports: 'g1', text: '野餐垫上周用完还没洗。'}],
        },
      ],
    }),
  );
  const errors = validateLesson05Diagram(root);
  assert.ok(errors.some((e) => e.includes('supports') || e.includes('野餐垫')), errors.join('; '));
  assert.ok(errors.some((e) => e.includes('第 6 课')), errors.join('; '));
});

test('validateLesson05Diagram rejects bakery under g4', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'pyr-05-bakery-'));
  const diagramPath = path.join(root, 'src/data');
  fs.mkdirSync(diagramPath, {recursive: true});
  fs.writeFileSync(
    path.join(diagramPath, 'pyramid-lesson-05-diagram.json'),
    JSON.stringify({
      caption: '见解留到第 6 课',
      levels: [
        {
          id: 'groups',
          layer: 'middle',
          label: '同类组别',
          items: [{id: 'g4', text: '同伴与时间'}],
        },
        {
          id: 'facts',
          layer: 'bottom',
          items: [
            {id: 'f4a', supports: 'g4', text: '朋友小周周六上午有事。'},
            {id: 'f4b', supports: 'g4', text: '有人说上次那家面包店周六排队很长。'},
          ],
        },
      ],
    }),
  );
  const errors = validateLesson05Diagram(root);
  assert.ok(errors.some((e) => e.includes('面包店')), errors.join('; '));
});

test('validateLessonFile accepts lesson 05 fixture', () => {
  const root = path.resolve(import.meta.dirname, '..');
  const lesson = path.join(
    root,
    'docs/learning/thinking/pyramid-principle-daily/2026-11-21-lesson-05.mdx',
  );
  const r = validateLessonFile(lesson, root);
  assert.equal(r.ok, true, r.errors?.join('; '));
});

test('validateLesson06Content rejects ungrouped listing, false scope, and over-strong insight', () => {
  const badSnippet = `
原创虚构
好像 可能 不一定
Drawing an insight
留到第 7 课
本课已讲完分组检查
p. 12
<CaseCompare compareNotes={['换了一组事实']} verbose="周日一定晴" conclusion="这周末必去野餐" />
reasons={[
  { title: '天气与日子：预报都带不确定性', facts: ['周六预报说午后可能阵雨，不一定下透。', '周日好像更晴一点，但也不确定。'] },
]}
<MicroExercise correctId="A" options={[{ id: 'B', text: '从相似点抽出见解' }]} />
`;
  const root = path.resolve(import.meta.dirname, '..');
  const errors = validateLesson06Content(badSnippet, root);
  assert.ok(errors.some((e) => e.includes('第 7 课') || e.includes('分组检查')), errors.join('; '));
  assert.ok(errors.some((e) => e.includes('页码')), errors.join('; '));
  assert.ok(errors.some((e) => e.includes('必去') || e.includes('过强')), errors.join('; '));
  assert.ok(errors.some((e) => e.includes('正确答案应为 B')), errors.join('; '));
  assert.ok(errors.length >= 4, `expected multiple errors, got ${errors.length}`);
});

test('validateLesson06Content rejects count-only insight and dev jargon', () => {
  const badSnippet = `
原创虚构
好像 可能 不一定
Drawing an insight from having seen the similarity
留到第 7 课
There are three reasons
差别在于是否抽出与事实强度相符的见解
Saturday预报
<CaseCompare compareNotes={['结构版使用完全相同的事实与不确定性措辞']} verbose="好像可能不一定" />
reasons={[
  { title: '天气与日子：一共有两条天气消息', facts: ['周六预报说午后可能阵雨，不一定下透。', '周日好像更晴一点，但也不确定。'] },
]}
<MicroExercise prompt="团队聚餐" correctId="B" options={[
  { id: 'A', text: '和口味有关：有人不吃辣。和时间有关：周三晚上。' },
  { id: 'B', text: '口味和时间都还不定型，需要再定一版' },
  { id: 'C', text: '必须定周三晚川菜馆' },
]} />
PyramidDiagram 组件
`;
  const root = path.resolve(import.meta.dirname, '..');
  const errors = validateLesson06Content(badSnippet, root);
  assert.ok(errors.some((e) => e.includes('个数') || e.includes('There are three')), errors.join('; '));
  assert.ok(errors.some((e) => e.includes('组件') || e.includes('开发术语')), errors.join('; '));
});

test('validateLesson06Diagram rejects group labels and mis-assigned facts', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'pyr-06-'));
  const diagramPath = path.join(root, 'src/data');
  fs.mkdirSync(diagramPath, {recursive: true});
  fs.writeFileSync(
    path.join(diagramPath, 'pyramid-lesson-06-diagram.json'),
    JSON.stringify({
      caption: '无见解说明',
      levels: [
        {
          id: 'groups',
          layer: 'middle',
          label: '同类组别',
          items: [{id: 'g1', text: '天气与日子'}],
        },
        {
          id: 'facts',
          layer: 'bottom',
          items: [
            {id: 'f1a', supports: 'g1', text: '周六预报说午后可能阵雨，不一定下透。'},
            {id: 'f1b', supports: 'g2', text: '周日好像更晴一点，但也不确定。'},
          ],
        },
      ],
    }),
  );
  const errors = validateLesson06Diagram(root);
  assert.ok(errors.some((e) => e.includes('见解') || e.includes('middle')), errors.join('; '));
  assert.ok(errors.some((e) => e.includes('supports') || e.includes('更晴')), errors.join('; '));
});

test('validateLessonFile accepts lesson 06 fixture when present', () => {
  const root = path.resolve(import.meta.dirname, '..');
  const lesson = path.join(
    root,
    'docs/learning/thinking/pyramid-principle-daily/2026-11-22-lesson-06.mdx',
  );
  if (!fs.existsSync(lesson)) {
    return;
  }
  const r = validateLessonFile(lesson, root);
  assert.equal(r.ok, true, r.errors?.join('; '));
});

test('validateLesson07Content rejects missing critical check and count-as-insight', () => {
  const badSnippet = `
原创虚构
好像 可能 不一定
How to Look Critically at the Groupings
There are three reasons
not an appropriate insight
本课已讲完 SCQ
MECE 是正解
完全等量
p. 88
上一课抽出见解
批判性检查
个数对不对 分组找得对不对 见解是否恰当
同一批事实
差别在检查
饭团 便利店
最近两次迭代里，需求在群里中途改过，有人说可能没注意到 @ 提醒。
在群里搜旧对话，有时要等挺久才出结果，不一定每次都很慢。
上周试运行里，八人团队里大概三人好像打开过看板视图，其余好像还没点开。
后端同事说留在群里上下文已经都在，可能不太想两边切。
安全同事说供应商的数据条款可能还在审，目前好像不能下定论。
免费席位上限明年一季度可能碰到，还不确定会不会超。
<CaseCompare conclusion="下周就换，必须切换" verbose="好像可能不一定" />
reasons={[
  { title: '一共有三条理由', facts: ['最近两次迭代里，需求在群里中途改过，有人说可能没注意到 @ 提醒。'] },
]}
<MicroExercise correctId="A" options={[{ id: 'B', text: '流程还不' }]} />
PyramidDiagram 组件
`;
  const root = path.resolve(import.meta.dirname, '..');
  const errors = validateLesson07Content(badSnippet, root);
  assert.ok(errors.some((e) => e.includes('SCQ') || e.includes('教完')), errors.join('; '));
  assert.ok(errors.some((e) => e.includes('MECE') || e.includes('教学用语')), errors.join('; '));
  assert.ok(errors.some((e) => e.includes('正确答案应为 B')), errors.join('; '));
  assert.ok(errors.length >= 4, `expected multiple errors, got ${errors.length}`);
});

test('validateLesson07Diagram rejects wrong count and mis-assigned facts', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'pyr-07-'));
  const diagramPath = path.join(root, 'src/data');
  fs.mkdirSync(diagramPath, {recursive: true});
  fs.writeFileSync(
    path.join(diagramPath, 'pyramid-lesson-07-diagram.json'),
    JSON.stringify({
      caption: '无检查说明',
      levels: [
        {
          id: 'reasons',
          layer: 'middle',
          label: '类别',
          items: [
            {id: 'r1', text: 'There are three reasons'},
            {id: 'r2', text: '试用'},
          ],
        },
        {
          id: 'facts',
          layer: 'bottom',
          items: [
            {id: 'f1', supports: 'r1', text: '最近两次迭代里，需求在群里中途改过。'},
            {id: 'f2', supports: 'r9', text: '在群里搜旧对话，有时要等挺久才出结果，不一定每次都很慢。'},
          ],
        },
      ],
    }),
  );
  const errors = validateLesson07Diagram(root);
  assert.ok(errors.some((e) => e.includes('三条') || e.includes('正好')), errors.join('; '));
  assert.ok(errors.some((e) => e.includes('supports') || e.includes('r9')), errors.join('; '));
});

test('validateLesson07Content rejects contradictory @/search compareNotes and weak micro explanations', () => {
  const root = path.resolve(import.meta.dirname, '..');
  const baseFacts = `
原创虚构 好像 可能 不一定
不超过事实强度的见解
批判性检查 检查并列
How to Look Critically at the Groupings
not an appropriate insight
个数对不对 分组找得对不对 见解是否恰当
同一批事实 差别在检查 个数 分组 见解
饭团 便利店
最近两次迭代里，需求在群里中途改过，有人说可能没注意到 @ 提醒。
在群里搜旧对话，有时要等挺久才出结果，不一定每次都很慢。
上周试运行里，八人团队里大概三人好像打开过看板视图，其余好像还没点开。
后端同事说留在群里上下文已经都在，可能不太想两边切。
安全同事说供应商的数据条款可能还在审，目前好像不能下定论。
免费席位上限明年一季度可能碰到，还不确定会不会超。
title: '协作跟帖：需求中途改动与可能漏看 @'
title: '试用与意愿'
title: '切换前提'
`;
  const badCompare = `${baseFacts}
<CaseCompare compareNotes={[
  '却把搜旧消息慢与 @ 漏看混成一条',
  '结构版经检查后保留三条并列理由',
]} />
<MicroExercise correctId="B" explanation="A 把无关旁支算进个数" options={[
  { id: 'A', text: '一共有四条理由各算一条关旧路径' },
  { id: 'B', text: '流程：还不。系统：还不。规则：标准下月才公布。' },
]} prompt="可能下月才公布新版 有人好像还不会传附件 还不确定要不要先改路径" />
`;
  const compareErrors = validateLesson07Content(badCompare, root);
  assert.ok(
    compareErrors.some((e) => e.includes('相似点') || e.includes('前错后对')),
    compareErrors.join('; '),
  );

  const badMicro = `${baseFacts}
<CaseCompare compareNotes={['差别在检查', '相似点群内信息']} />
<MicroExercise correctId="B" explanation="A 把无关旁支算进个数，结论过强" options={[
  { id: 'A', text: '一共有四条理由各算一条关旧路径' },
  { id: 'B', text: '流程：还不不能假设。系统：上传习惯还没稳住。规则：标准下月才公布。' },
]} prompt="上司说差旅标准可能下月才公布新版，目前还不确定要不要先改路径。有人好像还不会传附件" />
`;
  const microErrors = validateLesson07Content(badMicro, root);
  assert.ok(
    microErrors.some((e) => e.includes('无关旁支')),
    microErrors.join('; '),
  );
  assert.ok(
    microErrors.some((e) => e.includes('规则条') || e.includes('不确定性')),
    microErrors.join('; '),
  );
  assert.ok(
    microErrors.some((e) => e.includes('谨慎总判断')),
    microErrors.join('; '),
  );
});

test('validateLessonFile accepts lesson 07 fixture when present', () => {
  const root = path.resolve(import.meta.dirname, '..');
  const lesson = path.join(
    root,
    'docs/learning/thinking/pyramid-principle-daily/2026-11-23-lesson-07.mdx',
  );
  if (!fs.existsSync(lesson)) {
    return;
  }
  const r = validateLessonFile(lesson, root);
  assert.equal(r.ok, true, r.errors?.join('; '));
});

test('validateLesson08Content rejects missing SCQ path and premature answer', () => {
  const badSnippet = `
原创虚构 好像 可能 不一定
并列理由 个数 分组 见解
Situation Complication Question
SCQ Framework identifying the question in your reader's mind
How to Build a Pyramid identify the reader's question
第4课 弄清读者心里的问题
先说结论 顶端答案
第9课 第10课 第11课 第12课
本课已讲完行动建议
教学设计
第5课 第7课 分组 见解 检查
同一批事实 S→C→Q 情景 变化 问题
停车位 摇号 麻辣香锅 食堂
财务同事说捐款入账可能要等新捐赠管理办法出台，还不确定能否和抽奖奖金走同一笔预算。
工会介绍捐步时提到步数可以折算小额捐款，但具体额度口径好像还在和法务核对。
有的同事在茶水间聊天时好像更想保留面对面热闹感。
也有人表示愿意试试捐步，但目前好像还没有统一问卷结果。
活动筹备组说距离年会还有六周，节目单好像还在收意见。
去年年会到场率大概八成，抽奖时现场气氛挺热闹。
筹备同事担心大改形态可能来不及排练收尾，也不一定来得及把捐步互动排进流程。
<CaseCompare conclusion="立刻全面改成捐步" verbose="公司年会按惯例有压轴抽奖" />
reasons={[
  { title: '预算与合规', facts: ['财务同事说捐款入账可能要等新捐赠管理办法出台，还不确定能否和抽奖奖金走同一笔预算。'] },
  { title: '同事偏好', facts: ['有的同事在茶水间聊天时好像更想保留面对面热闹感。'] },
]}
<MicroExercise correctId="A" options={[
  { id: 'B', text: '应该先定高峰演练。' },
]} explanation="B 很好" />
PyramidDiagram 组件
p. 12
`;
  const root = path.resolve(import.meta.dirname, '..');
  const errors = validateLesson08Content(badSnippet, root);
  assert.ok(errors.some((e) => e.includes('行动建议') || e.includes('教完')), errors.join('; '));
  assert.ok(errors.some((e) => e.includes('正确答案应为 B')), errors.join('; '));
  assert.ok(errors.some((e) => e.includes('三条')), errors.join('; '));
  assert.ok(errors.length >= 4, `expected multiple errors, got ${errors.length}`);
});

test('validateLesson08Content rejects missing scq prop and 小规模抽奖 conclusion', () => {
  const root = path.resolve(import.meta.dirname, '..');
  const snippet = `
原创虚构 好像 可能 不一定
并列理由 个数 分组 见解
Situation Complication Question
SCQ Framework identifying the question in your reader's mind
How to Build a Pyramid identify the reader's question
第4课 弄清读者心里的问题
先说结论 顶端答案
第9课 第10课 第11课 第12课
教学设计
第5课 第7课 分组 见解 检查
同一批事实 S→C→Q 情景 变化 问题
停车位 摇号 麻辣香锅 食堂
财务同事说捐款入账可能要等新捐赠管理办法出台，还不确定能否和抽奖奖金走同一笔预算。
工会介绍捐步时提到步数可以折算小额捐款，但具体额度口径好像还在和法务核对。
有的同事在茶水间聊天时好像更想保留面对面热闹感。
也有人表示愿意试试捐步，但目前好像还没有统一问卷结果。
活动筹备组说距离年会还有六周，节目单好像还在收意见。
去年年会到场率大概八成，抽奖时现场气氛挺热闹。
筹备同事担心大改形态可能来不及排练收尾，也不一定来得及把捐步互动排进流程。
<CaseCompare conclusion="可先保留小规模抽奖" verbose="公司年会按惯例有压轴抽奖" />
title: '预算与合规'
title: '同事偏好'
title: '筹备节奏'
<MicroExercise correctId="B" explanation="带到问题" options={[
  { id: 'B', text: '多年来上午十点档是大家接受的惯例（情景）。今年傍晚货梯占用与观摩编制都还不明朗（变化）。在观摩与货梯影响未查清前，不宜现在就宣布改到周五傍晚；可先并排摸底。' },
]} />
`;
  const errors = validateLesson08Content(snippet, root);
  assert.ok(errors.some((e) => e.includes('scq')), errors.join('; '));
  assert.ok(errors.some((e) => e.includes('小规模')), errors.join('; '));
});

test('validateLesson08Diagram rejects SCQ-only middle layer and bad supports', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'pyr-08-'));
  const diagramPath = path.join(root, 'src/data');
  fs.mkdirSync(diagramPath, {recursive: true});
  fs.writeFileSync(
    path.join(diagramPath, 'pyramid-lesson-08-diagram.json'),
    JSON.stringify({
      caption: '示意图',
      levels: [
        {
          id: 'step',
          layer: 'top',
          items: [{id: 's1', text: '有一个问题'}],
        },
        {
          id: 'reasons',
          layer: 'middle',
          label: '情景',
          items: [
            {id: 'r1', text: '情景'},
            {id: 'r2', text: '变化'},
          ],
        },
        {
          id: 'facts',
          layer: 'bottom',
          items: [
            {id: 'f1', supports: 'r1', text: '财务同事说捐款入账可能还要等。'},
            {id: 'f2', supports: 'r9', text: '有的同事好像更想热闹。'},
          ],
        },
      ],
    }),
  );
  const errors = validateLesson08Diagram(root);
  assert.ok(errors.some((e) => e.includes('三条') || e.includes('正好')), errors.join('; '));
  assert.ok(errors.some((e) => e.includes('supports') || e.includes('r9')), errors.join('; '));
  assert.ok(errors.some((e) => e.includes('问题') || e.includes('答案')), errors.join('; '));
});

test('validateLessonFile accepts lesson 08 fixture when present', () => {
  const root = path.resolve(import.meta.dirname, '..');
  const lesson = path.join(
    root,
    'docs/learning/thinking/pyramid-principle-daily/2026-11-24-lesson-08.mdx',
  );
  if (!fs.existsSync(lesson)) {
    return;
  }
  const r = validateLessonFile(lesson, root);
  assert.equal(r.ok, true, r.errors?.join('; '));
});