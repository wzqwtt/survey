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