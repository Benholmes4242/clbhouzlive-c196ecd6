import React, { lazy, Suspense } from "react";
import { GenericPageSkeleton } from '@/components/skeletons/GenericPageSkeleton';

// Lazy load Auth to avoid static/dynamic import conflict with App.tsx
const Auth = lazy(() => import('./Auth'));

// Signup page - renders Auth in signup mode
const Signup: React.FC = () => {
  return (
    <Suspense fallback={<GenericPageSkeleton />}>
      <Auth defaultSignUp={true} />
    </Suspense>
  );
};

export default Signup;
