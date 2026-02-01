import { ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PageRoot } from '@/components/layout/PageRoot';
import { useHeader } from '@/contexts/GlobalHeaderContext';
import { useEffect } from 'react';

interface TourHubShellProps {
  children: ReactNode;
}

export function TourHubShell({ children }: TourHubShellProps) {
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

  // Overview tab: No wrapper constraints - hero bleeds edge-to-edge
  // immersiveStatusBar=true lets OverviewPageV3 control the transparent status bar
  if (isOverview) {
    return (
      <PageRoot 
        className="min-h-screen w-full"
        style={{ background: '#F8FAFC' }}
        immersiveStatusBar
      >
        {children}
      </PageRoot>
    );
  }

  // Other tabs: Standard layout with max-width container
  return (
    <PageRoot 
      className="min-h-screen w-full"
      style={{ background: '#F8FAFC' }}
    >
      <div className="w-full max-w-5xl mx-auto pb-24">
        {children}
      </div>
    </PageRoot>
  );
}
