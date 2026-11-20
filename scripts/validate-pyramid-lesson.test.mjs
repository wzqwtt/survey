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