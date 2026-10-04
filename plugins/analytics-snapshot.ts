import type {LoadContext, Plugin} from '@docusaurus/types';
import type {AnalyticsSnapshot, NamedCount, PageCount} from '../src/types/analytics';

export type AnalyticsSnapshotOptions = {
  /** GoatCounter site URL. Empty disables the snapshot. */
  endpoint: string;
  /** API token; only read at build time and never sent to the browser. */
  token: string;
  days?: number;
};

type HitList = {path: string; title: string; count: number};
type HitStat = {name: string; count: number};
type DayStat = {day: string; daily: number};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function hourRounded(date: Date): string {
  const d = new Date(date);
  d.setUTCMinutes(0, 0, 0);
  return d.toISOString().replace('.000Z', 'Z');
}

export default function analyticsSnapshotPlugin(context: LoadContext, rawOptions: unknown): Plugin {
  const {endpoint, token, days = 30} = rawOptions as AnalyticsSnapshotOptions;
  const {baseUrl} = context;

  async function api<T>(path: string, params: Record<string, string>): Promise<T> {
    const url = new URL(`/api/v0${path}`, endpoint);
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    for (let attempt = 0; ; attempt += 1) {
      const res = await fetch(url, {
        headers: {Authorization: `Bearer ${token}`, 'Content-Type': 'application/json'},
      });
      if (res.status === 429 && attempt < 3) {
        await sleep(1000 * (attempt + 1));
        continue;
      }
      if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url.pathname}`);
      // The API allows 4 requests per second.
      await sleep(300);
      return (await res.json()) as T;
    }
  }

  const named = (stats: HitStat[] | undefined): NamedCount[] =>
    (stats ?? []).map((s) => ({name: s.name || '(未知)', count: s.count}));

  return {
    name: 'analytics-snapshot',

    async loadContent(): Promise<AnalyticsSnapshot | null> {
      if (!endpoint || !token) return null;
      const end = new Date();
      const start = new Date(end.getTime() - days * 86_400_000);
      const range = {start: hourRounded(start), end: hourRounded(end)};
      try {
        const total = await api<{total: number; stats: DayStat[]}>('/stats/total', range);
        const hits = await api<{hits: HitList[]}>('/stats/hits', {...range, limit: '100'});
        const page = async (name: string) =>
          named((await api<{stats: HitStat[]}>(`/stats/${name}`, {...range, limit: '10'})).stats);

        const pages: PageCount[] = hits.hits
          .filter((h) => h.path.startsWith(baseUrl))
          .map((h) => ({path: h.path, title: h.title, count: h.count}));

        return {
          generatedAt: end.getTime(),
          start: range.start.slice(0, 10),
          end: range.end.slice(0, 10),
          total: total.total,
          daily: (total.stats ?? []).map((s) => ({day: s.day, count: s.daily})),
          pages,
          referrers: await page('toprefs'),
          browsers: await page('browsers'),
          systems: await page('systems'),
          locations: await page('locations'),
          sizes: await page('sizes'),
        };
      } catch (err) {
        console.warn(`[analytics-snapshot] Skipped: ${(err as Error).message}`);
        return null;
      }
    },

    async contentLoaded({content, actions}) {
      actions.setGlobalData((content ?? null) as AnalyticsSnapshot | null);
    },
  };
}
