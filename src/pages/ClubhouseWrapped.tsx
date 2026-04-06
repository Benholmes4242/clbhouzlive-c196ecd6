import React, { useEffect, useLayoutEffect, lazy, Suspense } from 'react';
import { useHeader } from '@/contexts/GlobalHeaderContext';
import { useSearchParams } from 'react-router-dom';
import { ClubhouseSkeletonShimmer } from '@/components/clubhouse/ClubhouseSkeletonShimmer';
import { useKeepAlive } from '@/components/keep-alive/KeepAliveOutlet';

// Lazy load Clubhouse to avoid static/dynamic import conflict with App.tsx
const Clubhouse = lazy(() => import('./Clubhouse'));

const ClubhouseWrapped = () => {
  const { setVariant } = useHeader();
  const [searchParams] = useSearchParams();
  const showGlass = searchParams.get('glass') === 'true';
  const { isActive } = useKeepAlive();

  // Apply dark shell only when this KeepAlive route is the active one.
  // When user navigates away (e.g. /watch/videos), remove it so dark CSS
  // variables don't bleed into light-mode subpages.
  useLayoutEffect(() => {
    if (isActive) {
      document.body.classList.add('route-clubhouse');
    } else {
      document.body.classList.remove('route-clubhouse');
    }
    return () => { document.body.classList.remove('route-clubhouse'); };
  }, [isActive]);

  useEffect(() => {
    setVariant('glass-dark');
  }, [setVariant]);

  return (
    <>
      <Suspense fallback={<ClubhouseSkeletonShimmer isVisible={true} isStatic={true} />}>
        <Clubhouse />
      </Suspense>
      {showGlass && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.25)',
            backdropFilter: 'blur(120px)',
            WebkitBackdropFilter: 'blur(120px)',
            zIndex: 9999,
            pointerEvents: 'none',
          }}
        />
      )}
    </>
  );
};

export default ClubhouseWrapped;
