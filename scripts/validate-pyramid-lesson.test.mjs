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
  validateLesson09Content,
  validateLesson09Diagram,
  validateLesson10Content,
  validateLesson10Diagram,
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

test('validateLesson09Content rejects recommendations that skip verification before pilot', () => {
  const root = path.resolve(import.meta.dirname, '..');
  const prematureSnippet = `
原创虚构 好像 可能 不一定
情景 变化 带到 问题前
How to Deal with Action Ideas provoke action and lead to change
推动行动 教学设计 第4课 第5课 第7课 第8课 第10课 第11课 第12课
同一批事实 绿植 浇灌 并列行动 可执行
三楼会议室多年来凭前台登记领钥匙，同事一般熟悉这套做法。
工作日下午两点到四点高峰时段，纸质登记表常常约满，偶尔为签字先后顺序争执。
IT 同事说工牌读头接口可能能对接，但与会议室日历的联动还没试过，排期好像还要四到六周，还不确定能否赶上本季度窗口。
安防同事说若改成自助进出，审计日志格式可能要用新规，制度草案好像还在内审，还不确定何时能定稿。
有的团队习惯到前台当面交接钥匙，也有人表示愿意用 App 提前一天预约。
设施组拿到读头安装报价单，但采购审批周期好像还不明朗，不一定本季能走完。
<CaseCompare verbose="绿植" conclusion="在未来六周仅对三楼高峰并排试运行工牌预约，并保留登记兜底；不宜全楼一律刷牌自助。" />
title: '联调与合规：两周内由 IT 与安防试连工牌读头接口，书面确认审计日志能否满足当前草案要求，并盯采购审批节点。'
title: '并排试点：高峰并行六周'
title: '摸清意愿：发问询'
compareNotes 啰嗦版以题目式标题和意见收尾 差别在建议是否写得能推动行动
<MicroExercise correctId="B" explanation="保留好像还不确定原样" options={[
  { id: 'B', text: '还不明朗前建议先保留主档，并排试跑一次周五演练；行动：行政申请两次周五上午演练名额。' },
  { id: 'A', text: '关于客户演示时段调整的意见稿：建议研究一下。' },
  { id: 'C', text: '去年演示纪要扫描件文件名很长。' },
]} />
`;
  const errors = validateLesson09Content(prematureSnippet, root);
  assert.ok(errors.some((e) => e.includes('核实') || e.includes('批准')), errors.join('; '));
  assert.ok(errors.some((e) => e.includes('试连') || e.includes('缺口')), errors.join('; '));
  assert.ok(errors.some((e) => e.includes('收尾')), errors.join('; '));
  assert.ok(errors.some((e) => e.includes('原创教学')), errors.join('; '));
  assert.ok(errors.some((e) => e.includes('一次')), errors.join('; '));
  assert.ok(errors.some((e) => e.includes('好像')), errors.join('; '));
});

test('validateLesson09Content rejects vague recommendations and missing Action Ideas quote', () => {
  const badSnippet = `
原创虚构 好像 可能 不一定
情景 变化 带到 问题前
教学设计
第4课 第5课 第7课 第8课
第10课 第11课 第12课
本课已讲完归纳与演绎
推动行动
同一批事实
绿植 浇灌
三楼会议室多年来凭前台登记领钥匙，同事一般熟悉这套做法。
工作日下午两点到四点高峰时段，纸质登记表常常约满，偶尔为签字先后顺序争执。
IT 同事说工牌读头接口可能能对接，但与会议室日历的联动还没试过，排期好像还要四到六周，还不确定能否赶上本季度窗口。
安防同事说若改成自助进出，审计日志格式可能要用新规，制度草案好像还在内审，还不确定何时能定稿。
有的团队习惯到前台当面交接钥匙，也有人表示愿意用 App 提前一天预约。
设施组拿到读头安装报价单，但采购审批周期好像还不明朗，不一定本季能走完。
<CaseCompare verbose="下月起全楼应一律刷牌自助。" conclusion="建议考虑一下会议室优化" />
title: '联调与合规'
compareNotes 里差别在建议是否写得能推动行动
<MicroExercise correctId="A" options={[
  { id: 'B', text: '下月起全面改档。' },
  { id: 'A', text: '关于时段的意见稿。' },
  { id: 'C', text: '共享盘路径很长。' },
]} explanation="很好" />
PyramidDiagram 组件
p. 9
`;
  const root = path.resolve(import.meta.dirname, '..');
  const errors = validateLesson09Content(badSnippet, root);
  assert.ok(errors.some((e) => e.includes('Action Ideas') || e.includes('provoke')), errors.join('; '));
  assert.ok(errors.some((e) => e.includes('正确答案应为 B')), errors.join('; '));
  assert.ok(errors.some((e) => e.includes('三条') || e.includes('并列行动')), errors.join('; '));
  assert.ok(errors.some((e) => e.includes('空话') || e.includes('建议考虑')), errors.join('; '));
  assert.ok(errors.length >= 4, `expected multiple errors, got ${errors.length}`);
});

test('validateLesson09Content rejects SCQ claims when scq prop present', () => {
  const root = path.resolve(import.meta.dirname, '..');
  const snippet = `
原创虚构 好像 可能 不一定 能推动行动
情景 变化 带到 问题前
How to Deal with Action Ideas provoke action and lead to change
教学设计 第4课 第5课 第7课 第8课 第10课 第11课 第12课
同一批事实 绿植 浇灌 并列行动
三楼会议室多年来凭前台登记领钥匙，同事一般熟悉这套做法。
工作日下午两点到四点高峰时段，纸质登记表常常约满，偶尔为签字先后顺序争执。
IT 同事说工牌读头接口可能能对接，但与会议室日历的联动还没试过，排期好像还要四到六周，还不确定能否赶上本季度窗口。
安防同事说若改成自助进出，审计日志格式可能要用新规，制度草案好像还在内审，还不确定何时能定稿。
有的团队习惯到前台当面交接钥匙，也有人表示愿意用 App 提前一天预约。
设施组拿到读头安装报价单，但采购审批周期好像还不明朗，不一定本季能走完。
<CaseCompare scq={{ situation: 'x', complication: 'y', question: 'z' }} verbose="ok" conclusion="建议先在未来六周并排试点工牌预约，并保留前台登记兜底；不宜现在就宣布全楼一律刷牌自助。" />
title: '联调与合规：试连接口'
title: '并排试点：高峰并行六周'
title: '摸清意愿：发问询'
compareNotes 结构版先展示 SCQ
<MicroExercise correctId="B" explanation="推动行动与可执行并列" options={[
  { id: 'B', text: '还不明朗前建议先保留主档，并排试跑；行动：两周内说明缺口。' },
  { id: 'A', text: '关于客户演示时段调整的意见稿：建议研究一下。' },
  { id: 'C', text: '去年演示纪要扫描件文件名很长。' },
]} />
`;
  const errors = validateLesson09Content(snippet, root);
  assert.ok(errors.some((e) => e.includes('scq') || e.includes('SCQ')), errors.join('; '));
});

test('validateLesson09Diagram rejects non-action middle layer and bad supports', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'pyr-09-'));
  const diagramPath = path.join(root, 'src/data');
  fs.mkdirSync(diagramPath, {recursive: true});
  fs.writeFileSync(
    path.join(diagramPath, 'pyramid-lesson-09-diagram.json'),
    JSON.stringify({
      caption: '示意图',
      levels: [
        {
          id: 'step',
          layer: 'top',
          items: [{id: 's1', text: '建议考虑优化会议室'}],
        },
        {
          id: 'actions',
          layer: 'middle',
          items: [
            {id: 'r1', text: '情景'},
            {id: 'r2', text: '变化'},
          ],
        },
        {
          id: 'facts',
          layer: 'bottom',
          items: [
            {id: 'f1', supports: 'r1', text: 'IT 同事说工牌读头接口可能能对接。'},
            {id: 'f2', supports: 'r9', text: '有的团队习惯到前台当面交接钥匙。'},
          ],
        },
      ],
    }),
  );
  const errors = validateLesson09Diagram(root);
  assert.ok(errors.some((e) => e.includes('三条') || e.includes('并列行动')), errors.join('; '));
  assert.ok(errors.some((e) => e.includes('supports') || e.includes('r9')), errors.join('; '));
  assert.ok(errors.some((e) => e.includes('空话') || e.includes('可执行') || e.includes('试点')), errors.join('; '));
});

test('validateLessonFile accepts lesson 09 fixture when present', () => {
  const root = path.resolve(import.meta.dirname, '..');
  const lesson = path.join(
    root,
    'docs/learning/thinking/pyramid-principle-daily/2026-11-25-lesson-09.mdx',
  );
  if (!fs.existsSync(lesson)) {
    return;
  }
  const r = validateLessonFile(lesson, root);
  assert.equal(r.ok, true, r.errors?.join('; '));
});

test('validateLesson10Content rejects disguised deduction chains and missing Pearson quote', () => {
  const badSnippet = `
原创虚构 好像 可能 不一定 还不确定
推动行动 能拍板 建议考虑一下
教学设计
第5–6课 第11课 第12课
本课已讲完问题想清楚
相似的低层事实收成一组
归纳 演绎
课程页并未单独列出归纳
同一批事实 推理关系
三年来晨间短讯固定在六点半，不少住校生习惯边洗漱边听。
本学期学校把早自习铃改到七点十分；六点半时宿舍走廊可能还比较安静，但还不确定新作息下六点半收听率会不会掉。
设备组说调钟软件可能能一键改时，但与课表播报模块的联动好像还没试过。
播音员反映七点半前录音棚外人声夹杂可能更少，但录音棚上午档预约表常常约满。
有老师觉得六点半利于简短校务提醒，也有同学表示希望多睡二十分钟再听。
上周试播七点半片段时，听众反馈样本好像只有十几条，还不代表全体。
<CaseCompare verbose="ok" conclusion="下月起必须全线改到七点半" />
title: '理由一：早自习改了'
compareNotes 结构版使用完全相同的事实与不确定性措辞
<MicroExercise correctId="A" explanation="很好" options={[
  { id: 'A', text: '理由一：打滑。理由二：所以有险。理由三：因此必须铺垫。' },
  { id: 'B', text: '三个归纳并列点支撑判断。' },
]} />
PyramidDiagram 组件
p. 64
`;
  const root = path.resolve(import.meta.dirname, '..');
  const errors = validateLesson10Content(badSnippet, root);
  assert.ok(errors.some((e) => e.includes('deduction') || e.includes('Pearson')), errors.join('; '));
  assert.ok(errors.some((e) => e.includes('正确答案应为 B')), errors.join('; '));
  assert.ok(errors.some((e) => e.includes('改档') || e.includes('升格')), errors.join('; '));
  assert.ok(errors.some((e) => e.includes('页码') || e.includes('64')), errors.join('; '));
  assert.ok(errors.length >= 4, `expected multiple errors, got ${errors.length}`);
});

test('validateLesson10Diagram rejects count-style middle layer and bad supports', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'pyr-10-'));
  const diagramPath = path.join(root, 'src/data');
  fs.mkdirSync(diagramPath, {recursive: true});
  fs.writeFileSync(
    path.join(diagramPath, 'pyramid-lesson-10-diagram.json'),
    JSON.stringify({
      caption: '示意图',
      levels: [
        {
          id: 'step',
          layer: 'top',
          items: [{id: 's1', text: '下月起必须全线改七点半'}],
        },
        {
          id: 'reasons',
          layer: 'middle',
          label: '理由',
          items: [
            {id: 'r1', text: '理由一：改了'},
            {id: 'r2', text: '理由二：所以'},
          ],
        },
        {
          id: 'facts',
          layer: 'bottom',
          items: [
            {id: 'f1', supports: 'r1', text: '三年来晨间短讯固定在六点半，不少住校生习惯边洗漱边听。'},
            {id: 'f2', supports: 'r9', text: '上周试播七点半片段时，听众反馈样本好像只有十几条，还不代表全体。'},
          ],
        },
      ],
    }),
  );
  const errors = validateLesson10Diagram(root);
  assert.ok(errors.some((e) => e.includes('三条') || e.includes('正好')), errors.join('; '));
  assert.ok(errors.some((e) => e.includes('supports') || e.includes('r9')), errors.join('; '));
  assert.ok(errors.some((e) => e.includes('归纳') || e.includes('不宜')), errors.join('; '));
});

test('validateLesson10Content rejects fake-parallel compareNotes without deduction contrast', () => {
  const root = path.resolve(import.meta.dirname, '..');
  const snippet = `
原创虚构 好像 可能 不一定 还不确定
推动行动 能拍板
explains the difference between deduction and induction
Deduction and induction
相似的低层事实收成一组
归纳 演绎 教学设计 第5–6课 第11课 第12课
课程页并未单独列出归纳 不代替第5课
三年来晨间短讯固定在六点半，不少住校生习惯边洗漱边听。
本学期学校把早自习铃改到七点十分；六点半时宿舍走廊可能还比较安静，但还不确定新作息下六点半收听率会不会掉。
设备组说调钟软件可能能一键改时，但与课表播报模块的联动好像还没试过。
播音员反映七点半前录音棚外人声夹杂可能更少，但录音棚上午档预约表常常约满。
有老师觉得六点半利于简短校务提醒，也有同学表示希望多睡二十分钟再听。
上周试播七点半片段时，听众反馈样本好像只有十几条，还不代表全体。
菜单 食堂
<CaseCompare conclusion="在联动未试前不宜全线改档，可先试播。" verbose="食堂" />
title: '归纳·收听习惯与作息衔接'
title: '归纳·制作条件与预约档期'
title: '归纳·意见与试点样本'
compareNotes={['同一批事实', '两版一样好']}
<MicroExercise correctId="B" explanation="归纳并列而非演绎伪装" options={[
  { id: 'A', text: '理由一：打滑。理由二：所以有险。理由三：因此必须铺垫。' },
  { id: 'B', text: '风险、保洁、诉求三类并列支撑谨慎判断；若用演绎则前后引申。' },
]} />
`;
  const errors = validateLesson10Content(snippet, root);
  assert.ok(errors.some((e) => e.includes('伪装') || e.includes('演绎链')), errors.join('; '));
});

test('validateLessonFile accepts lesson 10 fixture when present', () => {
  const root = path.resolve(import.meta.dirname, '..');
  const lesson = path.join(
    root,
    'docs/learning/thinking/pyramid-principle-daily/2026-11-26-lesson-10.mdx',
  );
  if (!fs.existsSync(lesson)) {
    return;
  }
  const r = validateLessonFile(lesson, root);
  assert.equal(r.ok, true, r.errors?.join('; '));
});