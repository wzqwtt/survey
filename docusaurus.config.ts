import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';
import knowledgeIndexPlugin, {type KnowledgeIndexOptions} from './plugins/knowledge-index';
import analyticsSnapshotPlugin, {type AnalyticsSnapshotOptions} from './plugins/analytics-snapshot';
import type {AnalyticsConfig} from './src/types/analytics';

const githubUser = 'wzqwtt';
const repo = 'survey';
const repoUrl = `https://github.com/${githubUser}/${repo}`;

// GoatCounter analytics. Set GOATCOUNTER_CODE (or a full GOATCOUNTER_URL for a self-hosted
// instance) to enable. GOATCOUNTER_TOKEN is only used at build time for the stats snapshot.
const analytics: AnalyticsConfig = {
  endpoint: (
    process.env.GOATCOUNTER_URL ||
    (process.env.GOATCOUNTER_CODE ? `https://${process.env.GOATCOUNTER_CODE}.goatcounter.com` : '')
  ).replace(/\/$/, ''),
};

const sections: KnowledgeIndexOptions['sections'] = [
  {
    key: 'research',
    label: '调研',
    description: '按分类整理的技术调研：源码分析、方案对比、选型建议。',
  },
  {key: 'learning', label: '学习', description: '系统学习的笔记与总结：概念、实践与方法。'},
];

const config: Config = {
  title: 'Survey',
  tagline: '调研与学习知识库',
  favicon: 'img/favicon.svg',

  future: {
    v4: true,
    faster: true,
  },

  url: `https://${githubUser}.github.io`,
  baseUrl: `/${repo}/`,
  organizationName: githubUser,
  projectName: repo,
  trailingSlash: true,

  onBrokenLinks: 'throw',
  onBrokenAnchors: 'throw',

  i18n: {
    defaultLocale: 'zh-Hans',
    locales: ['zh-Hans'],
  },

  markdown: {
    mermaid: true,
    format: 'detect',
    hooks: {
      onBrokenMarkdownLinks: 'throw',
      onBrokenMarkdownImages: 'throw',
    },
  },

  themes: [
    '@docusaurus/theme-mermaid',
    [
      '@easyops-cn/docusaurus-search-local',
      {
        hashed: 'filename',
        language: ['en', 'zh'],
        docsRouteBasePath: '/',
        indexBlog: false,
        indexPages: false,
        highlightSearchTermsOnTargetPage: true,
        searchContextByPaths: sections.map((s) => ({label: s.label, path: s.key})),
        useAllContextsWithNoSearchContext: true,
      },
    ],
  ],

  plugins: [
    [knowledgeIndexPlugin, {sections} satisfies KnowledgeIndexOptions],
    [
      analyticsSnapshotPlugin,
      {
        endpoint: analytics.endpoint,
        token: process.env.GOATCOUNTER_TOKEN ?? '',
      } satisfies AnalyticsSnapshotOptions,
    ],
  ],

  customFields: {analytics},

  clientModules: ['./src/clientModules/goatcounter.ts'],

  scripts: analytics.endpoint
    ? [
        {
          src: 'https://gc.zgo.at/count.js',
          async: true,
          'data-goatcounter': `${analytics.endpoint}/count`,
          // Page views are sent from the client module so in-app navigation is counted too.
          'data-goatcounter-settings': JSON.stringify({no_onload: true}),
        },
      ]
    : [],

  presets: [
    [
      'classic',
      {
        docs: {
          routeBasePath: '/',
          sidebarPath: './sidebars.ts',
          editUrl: `${repoUrl}/edit/master/`,
          showLastUpdateTime: true,
          breadcrumbs: true,
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    colorMode: {
      respectPrefersColorScheme: true,
    },
    docs: {
      sidebar: {
        hideable: true,
        autoCollapseCategories: false,
      },
    },
    tableOfContents: {
      minHeadingLevel: 2,
      maxHeadingLevel: 4,
    },
    navbar: {
      title: 'Survey',
      logo: {
        alt: 'Survey',
        src: 'img/logo.svg',
      },
      hideOnScroll: false,
      items: [
        {type: 'docSidebar', sidebarId: 'research', position: 'left', label: '调研'},
        {type: 'docSidebar', sidebarId: 'learning', position: 'left', label: '学习'},
        {to: '/gallery', label: '交互页面', position: 'left'},
        {to: '/tags', label: '标签', position: 'left'},
        {href: repoUrl, position: 'right', className: 'header-github-link', 'aria-label': 'GitHub'},
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: '内容',
          items: [
            {label: '调研总览', to: '/research'},
            {label: '学习总览', to: '/learning'},
            {label: '交互页面', to: '/gallery'},
            {label: '标签', to: '/tags'},
            {label: '访问统计', to: '/stats'},
          ],
        },
        {
          title: '写作',
          items: [
            {label: '写作指南', to: '/learning/tools/writing-guide'},
            {label: 'Docusaurus 文档', href: 'https://docusaurus.io/zh-CN/docs'},
          ],
        },
        {
          title: '仓库',
          items: [{label: 'GitHub', href: repoUrl}],
        },
      ],
      copyright: `© ${new Date().getFullYear()} ${githubUser} · Built with Docusaurus`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['bash', 'json', 'yaml', 'go', 'sql', 'python', 'java', 'diff'],
    },
    mermaid: {
      theme: {light: 'neutral', dark: 'dark'},
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
