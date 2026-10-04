import siteConfig from '@generated/docusaurus.config';
import type {ClientModule} from '@docusaurus/types';
import type {AnalyticsConfig} from '@site/src/types/analytics';

type GoatCounter = {count?: (vars: {path: string; title?: string}) => void};

declare global {
  interface Window {
    goatcounter?: GoatCounter;
  }
}

const {endpoint} = (siteConfig.customFields?.analytics as AnalyticsConfig | undefined) ?? {
  endpoint: '',
};

// count.js loads asynchronously, so retry briefly until it is ready.
function count(path: string, attempt = 0): void {
  const gc = window.goatcounter;
  if (gc?.count) {
    gc.count({path, title: document.title});
  } else if (attempt < 50) {
    window.setTimeout(() => count(path, attempt + 1), 200);
  }
}

const clientModule: ClientModule = {
  onRouteDidUpdate({location, previousLocation}) {
    if (!endpoint) return;
    // Called on first load too (previousLocation is null); skip hash-only changes.
    if (previousLocation && previousLocation.pathname === location.pathname) return;
    // Let the page title update before counting.
    window.setTimeout(() => count(location.pathname), 0);
  },
};

export default clientModule;
