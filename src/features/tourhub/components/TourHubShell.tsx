import { ReactNode, useEffect } from 'react';
import { PageRoot } from '@/components/layout/PageRoot';
import { useHeader } from '@/contexts/GlobalHeaderContext';

interface TourHubShellProps {
  children: ReactNode;
  /** Enable immersive full-bleed mode (hero behind status bar) — used by tournament detail pages */
  immersive?: boolean;
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

  // Light editorial canvas across all Tour Hub pages. #F8FAFC is the
  // canonical Tour Hub surface — no dark slate patches.
  return (
    <PageRoot
      dark={false}
      className="min-h-screen w-full hcp-light"
      style={{ background: '#F8FAFC' }}
    >
      {children}
    </PageRoot>
  );
}
