import React, { useLayoutEffect } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import CompactHeader from './CompactHeader';
import { useModalContext } from '@/contexts/ModalContext';
import { isGlobalHeaderExcluded, isConditionallyExcluded } from './globalHeaderRules';
import { useFloatingHeaderActive } from '@/features/tourhub/_shared/floatingHeaderSignal';
import { isPerfEnabled, noteHeaderMount, noteHeaderUnmount } from '@/perf/navTiming';

const HeaderPerfTracker: React.FC = () => {
  useLayoutEffect(() => {
    if (!isPerfEnabled()) return;
    noteHeaderMount();
    return () => noteHeaderUnmount();
  }, []);
  return null;
};

const GlobalHeader: React.FC = () => {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { shouldHideHeader } = useModalContext();
  const floatingHeaderActive = useFloatingHeaderActive();

  const pathname = location.pathname;

  // Cinematic tour overview owns its own floating header — suppress the global one.
  if (floatingHeaderActive) return null;

  if (shouldHideHeader || isGlobalHeaderExcluded(pathname) || isConditionallyExcluded(pathname, searchParams)) {
    return null;
  }

  return (
    <>
      <HeaderPerfTracker />
      <CompactHeader />
    </>
  );
};

export default GlobalHeader;

