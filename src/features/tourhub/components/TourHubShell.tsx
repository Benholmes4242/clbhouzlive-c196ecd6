import { ReactNode, useEffect } from 'react';
import { PageRoot } from '@/components/layout/PageRoot';
import { useHeader } from '@/contexts/GlobalHeaderContext';
import { A } from '@/features/courses/components/holes/analytical/tokens';

interface TourHubShellProps {
  children: ReactNode;
  /** @deprecated BRIEF_TOUR_FIXED_HEADER S4 — no Tour surface bleeds any more.
   *  Accepted and ignored so the callers keep compiling. */
  immersive?: boolean;
  /** @deprecated as above: the safe-area shield stays opaque on Tour. */
  immersiveStatusBar?: boolean;
  /** @deprecated Back button now lives in CompactHeader. Kept for caller compat. */
  showBack?: boolean;
  /** @deprecated Back button now lives in CompactHeader. Kept for caller compat. */
  onBack?: () => void;
}

export function TourHubShell({ children }: TourHubShellProps) {
  const { setVariant } = useHeader();

  useEffect(() => {
    setVariant('solid-light');
    return () => setVariant('solid-light');
  }, [setVariant]);

  /* Dark-only baseline, and flatly NON-immersive: `.app-shell` pays the safe
     area once and TourPageShell's opaque 42px row sits in normal flow beneath
     the shield. No negative margins, no transparent status bar. */
  return (
    <PageRoot className="min-h-screen w-full" style={{ background: A.CANVAS }}>
      {children}
    </PageRoot>
  );
}
