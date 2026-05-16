import { ReactNode, useEffect } from 'react';
import { PageRoot } from '@/components/layout/PageRoot';
import { useHeader } from '@/contexts/GlobalHeaderContext';
import { useMedianStatusBar } from '@/hooks/useMedianStatusBar';

interface TourHubShellProps {
  children: ReactNode;
  /** Enable immersive full-bleed mode (hero behind status bar) — used by tournament detail pages */
  immersive?: boolean;
}

export function TourHubShell({ children, immersive = false }: TourHubShellProps) {
  const { setVariant } = useHeader();

  // All Tour Hub pages use immersiveStatusBar={true} on PageRoot, which disables
  // PageRoot's default hook. This call takes ownership so the transparent status bar
  // is re-applied on iOS resume (prevents grey safe-area flash).
  useMedianStatusBar("dark", "transparent", true, false);

  useEffect(() => {
    setVariant('solid-light');
    return () => setVariant('solid-light');
  }, [setVariant]);

  // Tournament detail pages: immersive negative-margin + max-width container
  if (immersive) {
    return (
      <PageRoot
        className="min-h-screen w-full bg-background"
        immersive
        immersiveStatusBar
      >
        <div className="w-full max-w-5xl mx-auto">
          {children}
        </div>
      </PageRoot>
    );
  }

  // All tabs (overview, players, schedule, leaders, college): full-bleed into safe area
  return (
    <PageRoot
      className="min-h-screen w-full bg-background"
      immersiveStatusBar
    >
      {children}
    </PageRoot>
  );
}
