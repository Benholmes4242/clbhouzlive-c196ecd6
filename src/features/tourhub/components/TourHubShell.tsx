import { ReactNode, useEffect } from 'react';
import { PageRoot } from '@/components/layout/PageRoot';
import { useHeader } from '@/contexts/GlobalHeaderContext';

interface TourHubShellProps {
  children: ReactNode;
  /** Enable immersive full-bleed mode (hero behind status bar) — used by tournament detail pages */
  immersive?: boolean;
  /** When true, disables PageRoot's useMedianStatusBar re-applies so callers can
   *  hold the shield/native bar transparent for a cinematic hero. */
  immersiveStatusBar?: boolean;
  /** @deprecated Back button now lives in CompactHeader. Kept for caller compat. */
  showBack?: boolean;
  /** @deprecated Back button now lives in CompactHeader. Kept for caller compat. */
  onBack?: () => void;
}

export function TourHubShell({ children, immersive = false, immersiveStatusBar = false }: TourHubShellProps) {
  const { setVariant } = useHeader();

  useEffect(() => {
    setVariant('solid-light');
    return () => setVariant('solid-light');
  }, [setVariant]);

  // Tournament detail pages: immersive negative-margin + max-width container
  if (immersive) {
    return (
      <PageRoot
        className="min-h-screen w-full"
        immersive
        immersiveStatusBar
      >
        <div className="w-full max-w-5xl mx-auto">
          {children}
        </div>
      </PageRoot>
    );
  }

  // Light chrome: Tour Hub now uses the global light page treatment.
  return (
    <PageRoot
      className="min-h-screen w-full"
      style={{ background: '#F8FAFC' }}
      immersiveStatusBar={immersiveStatusBar}
    >
      {children}
    </PageRoot>
  );
}
