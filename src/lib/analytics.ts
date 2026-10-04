import {useEffect, useState} from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import {usePluginData} from '@docusaurus/useGlobalData';
import type {AnalyticsConfig, AnalyticsSnapshot} from '@site/src/types/analytics';

export function useAnalyticsConfig(): AnalyticsConfig {
  const {siteConfig} = useDocusaurusContext();
  return (siteConfig.customFields?.analytics as AnalyticsConfig | undefined) ?? {endpoint: ''};
}

export function useAnalyticsSnapshot(): AnalyticsSnapshot | null {
  return (usePluginData('analytics-snapshot') as AnalyticsSnapshot | null | undefined) ?? null;
}

const MAX_CONCURRENT = 6;
const cache = new Map<string, Promise<number | null>>();
const queue: (() => void)[] = [];
let active = 0;

function schedule<T>(task: () => Promise<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const run = () => {
      active += 1;
      task()
        .then(resolve, reject)
        .finally(() => {
          active -= 1;
          queue.shift()?.();
        });
    };
    if (active < MAX_CONCURRENT) run();
    else queue.push(run);
  });
}

/**
 * Reads a page's view count from GoatCounter's public counter endpoint.
 * Resolves to 0 for paths with no views yet and null when the request fails.
 * GoatCounter caches these responses for up to four hours.
 */
export function fetchViewCount(endpoint: string, path: string): Promise<number | null> {
  const key = `${endpoint}|${path}`;
  let result = cache.get(key);
  if (!result) {
    const url = `${endpoint.replace(/\/$/, '')}/counter/${encodeURIComponent(path)}.json`;
    result = schedule(async () => {
      const res = await fetch(url);
      if (res.status === 404) return 0;
      if (!res.ok) return null;
      const {count} = (await res.json()) as {count: string | number};
      return Number(String(count).replace(/\D/g, '')) || 0;
    }).catch(() => null);
    cache.set(key, result);
  }
  return result;
}

export type ViewCountState = {loading: boolean; count: number | null};

export function useViewCount(path: string | null): ViewCountState {
  const {endpoint} = useAnalyticsConfig();
  const [state, setState] = useState<ViewCountState>({loading: true, count: null});
  useEffect(() => {
    if (!endpoint || !path) return undefined;
    let cancelled = false;
    setState({loading: true, count: null});
    fetchViewCount(endpoint, path).then((count) => {
      if (!cancelled) setState({loading: false, count});
    });
    return () => {
      cancelled = true;
    };
  }, [endpoint, path]);
  return endpoint && path ? state : {loading: false, count: null};
}

/** Fetches counts for many paths; the map fills in as responses arrive. */
export function useViewCounts(paths: string[]): {
  counts: Map<string, number | null>;
  done: boolean;
} {
  const {endpoint} = useAnalyticsConfig();
  const [counts, setCounts] = useState<Map<string, number | null>>(new Map());
  const key = paths.join('\n');
  useEffect(() => {
    if (!endpoint) return undefined;
    let cancelled = false;
    setCounts(new Map());
    paths.forEach((p) =>
      fetchViewCount(endpoint, p).then((count) => {
        if (!cancelled) setCounts((prev) => new Map(prev).set(p, count));
      }),
    );
    return () => {
      cancelled = true;
    };
  }, [endpoint, key]);
  return {counts, done: !!endpoint && counts.size >= paths.length};
}

const numberFormat = new Intl.NumberFormat('zh-CN');

export function formatCount(n: number | null | undefined): string {
  return n == null ? '—' : numberFormat.format(n);
}
