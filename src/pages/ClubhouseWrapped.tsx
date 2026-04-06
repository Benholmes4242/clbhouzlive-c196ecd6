import React, { useEffect, useLayoutEffect, lazy, Suspense } from 'react';
import { useHeader } from '@/contexts/GlobalHeaderContext';
import { useKeepAlive } from '@/components/keep-alive/KeepAliveOutlet';
import { useSearchParams } from 'react-router-dom';
import { ClubhouseSkeletonShimmer } from '@/components/clubhouse/ClubhouseSkeletonShimmer';

// Lazy load Clubhouse to avoid static/dynamic import conflict with App.tsx
const Clubhouse = lazy(() => import('./Clubhouse'));

const ClubhouseWrapped = () => {
  const { setVariant } = useHeader();
  const { isActive } = useKeepAlive();
  const [searchParams] = useSearchParams();
  const showGlass = searchParams.get('glass') === 'true';

  // KeepAlive preserves this route off-screen, so the dark route class must
  // only exist while Clubhouse is the active route.
  useLayoutEffect(() => {
    if (!isActive) {
      document.body.classList.remove('route-clubhouse');
      return;
    }

    document.body.classList.add('route-clubhouse');
    return () => { document.body.classList.remove('route-clubhouse'); };
  }, [isActive]);

  useEffect(() => {
    if (!isActive) return;
    setVariant('glass-dark');
  }, [isActive, setVariant]);

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
