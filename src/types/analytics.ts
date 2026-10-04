export type AnalyticsConfig = {
  /** GoatCounter site URL, e.g. `https://mycode.goatcounter.com`. Empty disables analytics. */
  endpoint: string;
};

export type NamedCount = {
  name: string;
  count: number;
};

export type PageCount = {
  path: string;
  title: string;
  count: number;
};

/** Aggregated statistics fetched from the GoatCounter API at build time. */
export type AnalyticsSnapshot = {
  generatedAt: number;
  /** Inclusive day range, `YYYY-MM-DD`. */
  start: string;
  end: string;
  total: number;
  daily: {day: string; count: number}[];
  pages: PageCount[];
  referrers: NamedCount[];
  browsers: NamedCount[];
  systems: NamedCount[];
  locations: NamedCount[];
  sizes: NamedCount[];
};
