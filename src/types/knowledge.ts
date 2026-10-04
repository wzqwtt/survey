export type KnowledgeTag = {
  label: string;
  permalink: string;
};

export type KnowledgeItem = {
  title: string;
  description: string;
  permalink: string;
  section: string;
  sectionLabel: string;
  category: string;
  categoryLabel: string;
  tags: KnowledgeTag[];
  /** Milliseconds. Front matter `date` first, then git last-update time. */
  date: number | null;
  docCount: number;
  htmlPages: string[];
};

export type KnowledgeCategory = {
  key: string;
  label: string;
  description: string;
  badge: string;
  permalink: string | null;
  items: KnowledgeItem[];
};

export type KnowledgeSection = {
  key: string;
  label: string;
  description: string;
  permalink: string;
  docCount: number;
  categories: KnowledgeCategory[];
};

export type HtmlPage = {
  slug: string;
  title: string;
  description: string;
  /** Path relative to the site root, without baseUrl, e.g. `/html/foo/`. */
  path: string;
  docPermalink: string | null;
  updatedAt: number;
};

export type KnowledgeIndex = {
  sections: KnowledgeSection[];
  htmlPages: HtmlPage[];
  recent: KnowledgeItem[];
  tagCount: number;
};
