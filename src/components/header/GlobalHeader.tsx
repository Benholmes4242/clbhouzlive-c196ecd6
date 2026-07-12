import React, { useLayoutEffect, useEffect, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import CompactHeader from './CompactHeader';
import { useModalContext } from '@/contexts/ModalContext';
import { isGlobalHeaderExcluded, isConditionallyExcluded } from './globalHeaderRules';
import { useFloatingHeaderActive } from '@/features/tourhub/_shared/floatingHeaderSignal';
import { isPerfEnabled, noteHeaderMount, noteHeaderUnmount } from '@/perf/navTiming';
import ChromeIsland from '@/features/chrome-v2/ChromeIsland';

const CHROME_LEGACY_KEY = 'chrome-legacy';

const HeaderPerfTracker: React.FC = () => {
  useLayoutEffect(() => {
    if (!isPerfEnabled()) return;
    noteHeaderMount();
    return () => noteHeaderUnmount();
  }, []);
  return null;
};

function readLegacyFlag(): boolean {
  try {
    return localStorage.getItem(CHROME_LEGACY_KEY) === '1';
  } catch {
    return false;
  }
}

const GlobalHeader: React.FC = () => {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { shouldHideHeader } = useModalContext();
  const floatingHeaderActive = useFloatingHeaderActive();

  const [chromeLegacy, setChromeLegacy] = useState<boolean>(() => readLegacyFlag());

  // ?chrome=legacy flips legacy on and persists; ?chrome=v2 clears it.
  useEffect(() => {
    const param = searchParams.get('chrome');
    if (param === 'legacy') {
      try { localStorage.setItem(CHROME_LEGACY_KEY, '1'); } catch {}
      setChromeLegacy(true);
    } else if (param === 'v2') {
      try { localStorage.removeItem(CHROME_LEGACY_KEY); } catch {}
      setChromeLegacy(false);
    }
  }, [searchParams]);

  const pathname = location.pathname;

  if (chromeLegacy) {
    const legacyHidden =
      floatingHeaderActive ||
      shouldHideHeader ||
      isGlobalHeaderExcluded(pathname) ||
      isConditionallyExcluded(pathname, searchParams);
    return (
      <>
        <HeaderPerfTracker />
        <CompactHeader hidden={legacyHidden} />
      </>
    );
  }

  // Route-half hiding is the registry's job — pass only the runtime half.
  const islandHidden = floatingHeaderActive || shouldHideHeader;

  return (
    <>
      <HeaderPerfTracker />
      <ChromeIsland hidden={islandHidden} />
    </>
  );
};

export default GlobalHeader;
