import React, { useEffect, lazy, Suspense } from 'react';
import { useHeader } from '@/contexts/GlobalHeaderContext';
import { GenericPageSkeleton } from '@/components/skeletons/GenericPageSkeleton';

// Lazy load Auth to avoid static/dynamic import conflict with App.tsx
const Auth = lazy(() => import('./Auth'));

const AuthWrapped = () => {
  const { setVariant } = useHeader();

  useEffect(() => {
    // Auth pages have white background, use solid-light
    setVariant('solid-light');
  }, [setVariant]);

  return (
    <Suspense fallback={<GenericPageSkeleton />}>
      <Auth />
    </Suspense>
  );
};

export default AuthWrapped;
