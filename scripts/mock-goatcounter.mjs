#!/usr/bin/env node
// Local stand-in for GoatCounter, for previewing view counts and the stats page.
//
//   node scripts/mock-goatcounter.mjs            # listens on http://127.0.0.1:8081
//   GOATCOUNTER_URL=http://127.0.0.1:8081 GOATCOUNTER_TOKEN=dev npm start
//
// Serves sample data derived from the docs tree, and records hits sent to /count.
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const PORT = Number(process.env.PORT ?? 8081);
const BASE = process.env.BASE_URL ?? '/survey/';
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

function hash(s) {
  let h = 2166136261;
  for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return h >>> 0;
}

function docPaths(dir = path.join(root, 'docs'), rel = '') {
  return fs.readdirSync(dir, {withFileTypes: true}).flatMap((e) => {
    if (e.isDirectory()) return docPaths(path.join(dir, e.name), `${rel}${e.name}/`);
    if (!/\.mdx?$/.test(e.name)) return [];
    const name = e.name.replace(/\.mdx?$/, '');
    return [`${BASE}${rel}${name === 'index' ? '' : `${name}/`}`];
  });
}

const paths = [BASE, `${BASE}gallery/`, `${BASE}stats/`, ...docPaths()];
const recorded = new Map();
const countOf = (p) => (hash(p) % 900) + 60 + (recorded.get(p) ?? 0);

const DAYS = 30;
const daily = Array.from({length: DAYS}, (_, i) => {
  const d = new Date(Date.now() - (DAYS - 1 - i) * 86_400_000);
  const weekday = d.getUTCDay();
  const base = 40 + i * 2 + (weekday === 0 || weekday === 6 ? -15 : 10);
  return {day: d.toISOString().slice(0, 10), daily: base + (hash(String(i)) % 25)};
});

const named = (names) =>
  names.map((name, i) => ({id: name, name, count: Math.round(400 / (i + 1.3))}));
const pages = {
  toprefs: named(['github.com', 'google.com', 'bing.com', 'v2ex.com', 'zhihu.com']),
  browsers: named(['Chrome', 'Safari', 'Firefox', 'Edge']),
  systems: named(['macOS', 'Windows', 'iOS', 'Linux', 'Android']),
  locations: named(['China', 'United States', 'Singapore', 'Japan', 'Germany']),
  sizes: named(['Computer monitors', 'Phones', 'Tablets', 'Larger monitors']),
};

function send(res, status, body) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  });
  res.end(JSON.stringify(body));
}

http
  .createServer((req, res) => {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const p = url.pathname;

    if (p === '/count') {
      const hit = url.searchParams.get('p');
      if (hit && url.searchParams.get('b') !== '1') {
        recorded.set(hit, (recorded.get(hit) ?? 0) + 1);
        console.log(`hit ${hit}`);
      }
      res.writeHead(200, {'Content-Type': 'image/gif', 'Access-Control-Allow-Origin': '*'});
      return res.end();
    }

    const counter = p.match(/^\/counter\/(.+)\.json$/);
    if (counter) {
      const target = decodeURIComponent(counter[1]);
      console.log(`counter ${target}`);
      if (target === 'TOTAL') {
        const total = paths.reduce((n, x) => n + countOf(x), 0);
        return send(res, 200, {count: total.toLocaleString('en-US')});
      }
      if (!paths.includes(target) && !recorded.has(target)) {
        return send(res, 404, {error: 'not found'});
      }
      return send(res, 200, {count: countOf(target).toLocaleString('en-US')});
    }

    if (p.startsWith('/api/v0/')) {
      if (!req.headers.authorization?.startsWith('Bearer ')) {
        return send(res, 401, {error: 'no API key'});
      }
      console.log(`api ${p}${url.search}`);
      if (p === '/api/v0/stats/total') {
        return send(res, 200, {total: daily.reduce((n, d) => n + d.daily, 0), stats: daily});
      }
      if (p === '/api/v0/stats/hits') {
        const hits = paths
          .map((x, i) => ({path_id: i, path: x, title: '', count: Math.round(countOf(x) / 3)}))
          .sort((a, b) => b.count - a.count);
        return send(res, 200, {hits, total: hits.length, more: false});
      }
      const page = p.match(/^\/api\/v0\/stats\/(\w+)$/)?.[1];
      if (page && pages[page]) return send(res, 200, {stats: pages[page], more: false});
    }

    send(res, 404, {error: 'not found'});
  })
  .listen(PORT, '127.0.0.1', () => {
    console.log(`Mock GoatCounter on http://127.0.0.1:${PORT} (${paths.length} paths)`);
  });
