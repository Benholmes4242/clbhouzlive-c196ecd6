import React, { useLayoutEffect, useEffect, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import CompactHeader from './CompactHeader';
import { useModalContext } from '@/contexts/ModalContext';
import { isGlobalHeaderExcluded, isConditionallyExcluded } from './globalHeaderRules';
import { useFloatingHeaderActive } from '@/features/tourhub/_shared/floatingHeaderSignal';
import { isPerfEnabled, noteHeaderMount, noteHeaderUnmount } from '@/perf/navTiming';
import ChromeIsland from '@/features/chrome-v2/ChromeIsland';

const CHROME_V2_KEY = 'chrome-v2';

const HeaderPerfTracker: React.FC = () => {
  useLayoutEffect(() => {
    if (!isPerfEnabled()) return;
    noteHeaderMount();
    return () => noteHeaderUnmount();
  }, []);
  return null;
};

function readV2Flag(): boolean {
  try {
    return localStorage.getItem(CHROME_V2_KEY) === '1';
  } catch {
    return false;
  }
}

const GlobalHeader: React.FC = () => {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { shouldHideHeader } = useModalContext();
  const floatingHeaderActive = useFloatingHeaderActive();

  const [chromeV2, setChromeV2] = useState<boolean>(() => readV2Flag());

  // ?chrome=v2 flips on and persists; ?chrome=legacy clears the flag.
  useEffect(() => {
    const param = searchParams.get('chrome');
    if (param === 'v2') {
      try { localStorage.setItem(CHROME_V2_KEY, '1'); } catch {}
      setChromeV2(true);
    } else if (param === 'legacy') {
      try { localStorage.removeItem(CHROME_V2_KEY); } catch {}
      setChromeV2(false);
    }
  }, [searchParams]);

  const pathname = location.pathname;

  const hidden =
    floatingHeaderActive ||
    shouldHideHeader ||
    isGlobalHeaderExcluded(pathname) ||
    isConditionallyExcluded(pathname, searchParams);

  if (chromeV2) {
    return (
      <>
        <HeaderPerfTracker />
        <ChromeIsland />
      </>
    );
  }

  return (
    <>
      <HeaderPerfTracker />
      <CompactHeader hidden={hidden} />
    </>
  );
};

export default GlobalHeader;
