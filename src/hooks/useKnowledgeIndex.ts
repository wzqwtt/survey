import {usePluginData} from '@docusaurus/useGlobalData';
import type {KnowledgeIndex} from '@site/src/types/knowledge';

export function useKnowledgeIndex(): KnowledgeIndex {
  return usePluginData('knowledge-index') as KnowledgeIndex;
}

const dateFormat = new Intl.DateTimeFormat('zh-CN', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  timeZone: 'UTC',
});

export function formatDate(ms: number | null | undefined): string | null {
  return ms ? dateFormat.format(new Date(ms)) : null;
}
