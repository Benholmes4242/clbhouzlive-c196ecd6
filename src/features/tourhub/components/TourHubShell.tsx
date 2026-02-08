import { ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PageRoot } from '@/components/layout/PageRoot';
import { useHeader } from '@/contexts/GlobalHeaderContext';
import { useEffect } from 'react';

interface TourHubShellProps {
  children: ReactNode;
  /** Enable immersive full-bleed mode (hero behind status bar) */
  immersive?: boolean;
}

export function TourHubShell({ children, immersive = false }: TourHubShellProps) {
  const { setVariant } = useHeader();
  const [searchParams] = useSearchParams();
  
  // Check if we're on the Overview tab (no header, full-bleed)
  const tab = searchParams.get('tab');
  const isOverview = !tab || tab === 'overview';

  // Set header variant for tour pages (only matters for non-overview tabs)
  useEffect(() => {
    setVariant('solid-light');
    return () => setVariant('solid-light');
  }, [setVariant]);

  // Immersive mode: tournament detail pages with full-bleed hero
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

  // Overview tab: No wrapper constraints - hero bleeds edge-to-edge
  // immersiveStatusBar=true lets OverviewPageV3 control the transparent status bar
  if (isOverview) {
    return (
      <PageRoot 
        className="min-h-screen w-full bg-background"
        immersiveStatusBar
      >
        {children}
      </PageRoot>
    );
  }

  // Other tabs: Standard layout with max-width container
  return (
    <PageRoot 
      className="min-h-screen w-full bg-background"
    >
      <div className="w-full max-w-5xl mx-auto pb-24">
        {children}
      </div>
    </PageRoot>
  );
}
