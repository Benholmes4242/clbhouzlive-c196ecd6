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

  // FLICKER FIX (step 5): CompactHeader stays mounted for the entire session so
  // its mount count remains 1 and there's no unmount/remount flash between
  // routes. When the route excludes the global header (or a floating header /
  // modal owns chrome), we pass `hidden` — the header becomes zero-height,
  // invisible, non-interactive, and publishes --header-h: 0 so full-bleed
  // pages (courses/:id, profile, handicap, manage, notifications, followers)
  // get the correct paddingTop.
  const hidden =
    floatingHeaderActive ||
    shouldHideHeader ||
    isGlobalHeaderExcluded(pathname) ||
    isConditionallyExcluded(pathname, searchParams);

  return (
    <>
      <HeaderPerfTracker />
      <CompactHeader hidden={hidden} />
    </>
  );
};

export default GlobalHeader;


