import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {validateLessonFile, parseFrontMatter} from './validate-pyramid-lesson.mjs';

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