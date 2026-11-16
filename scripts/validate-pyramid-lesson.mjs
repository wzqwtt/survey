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

  return {ok: errors.length === 0, errors, rel};
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