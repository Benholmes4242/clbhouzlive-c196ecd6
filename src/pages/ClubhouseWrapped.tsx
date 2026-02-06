import React, { lazy, Suspense } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ClubhouseSkeleton } from '@/components/skeletons/ClubhouseSkeleton';

// Lazy load Clubhouse to avoid static/dynamic import conflict with App.tsx
const Clubhouse = lazy(() => import('./Clubhouse'));

const ClubhouseWrapped = () => {
  const [searchParams] = useSearchParams();
  const showGlass = searchParams.get('glass') === 'true';

  return (
    <>
      <Suspense fallback={<ClubhouseSkeleton />}>
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
