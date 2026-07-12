import React, { useLayoutEffect } from 'react';
import { useModalContext } from '@/contexts/ModalContext';
import { isPerfEnabled, noteHeaderMount, noteHeaderUnmount } from '@/perf/navTiming';
import ChromeIsland from '@/features/chrome-v2/ChromeIsland';

const HeaderPerfTracker: React.FC = () => {
  useLayoutEffect(() => {
    if (!isPerfEnabled()) return;
    noteHeaderMount();
    return () => noteHeaderUnmount();
  }, []);
  return null;
};

/**
 * GlobalHeader — island-only. The registry (features/chrome-v2/registry.ts)
 * owns route-level hiding; this component only forwards the runtime
 * modal/fullscreen suppression signal.
 */
const GlobalHeader: React.FC = () => {
  const { shouldHideHeader } = useModalContext();

  return (
    <>
      <HeaderPerfTracker />
      <ChromeIsland hidden={shouldHideHeader} />
    </>
  );
};

export default GlobalHeader;
