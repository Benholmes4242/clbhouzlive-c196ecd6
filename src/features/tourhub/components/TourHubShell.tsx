import { ReactNode, useEffect } from 'react';
import { PageRoot } from '@/components/layout/PageRoot';
import { useHeader } from '@/contexts/GlobalHeaderContext';

interface TourHubShellProps {
  children: ReactNode;
  /** Enable immersive full-bleed mode (hero behind status bar) — used by tournament detail pages */
  immersive?: boolean;
  /** @deprecated Back button now lives in CompactHeader. Kept for caller compat. */
  showBack?: boolean;
  /** @deprecated Back button now lives in CompactHeader. Kept for caller compat. */
  onBack?: () => void;
}

export function TourHubShell({ children, immersive = false }: TourHubShellProps) {
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

  // Match handicap page: dark PageRoot canvas + default (non-immersive)
  // status bar so the safe-area notch renders as the same dark band as the
  // header chrome. PageRoot dark adds .hcp-dark and pads for the bottom nav.
  return (
    <PageRoot
      dark
      className="min-h-screen w-full"
      style={{ background: 'var(--hcp-bg-0)' }}
    >
      {children}
    </PageRoot>
  );
}
