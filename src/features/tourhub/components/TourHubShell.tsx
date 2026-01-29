import { ReactNode } from 'react';
import { PageRoot } from '@/components/layout/PageRoot';
import { useHeader } from '@/contexts/GlobalHeaderContext';
import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

interface TourHubShellProps {
  children: ReactNode;
}

export function TourHubShell({ children }: TourHubShellProps) {
  const { setVariant } = useHeader();
  const [searchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') || 'overview';
  
  // Overview tab uses dark cinematic theme
  const isOverviewTab = currentTab === 'overview';

  // Set header variant based on tab
  useEffect(() => {
    // Overview uses glass-dark header for cinematic hero
    // Other tabs use solid light header
    setVariant(isOverviewTab ? 'glass-dark' : 'solid-light');
    return () => setVariant('solid-light');
  }, [setVariant, isOverviewTab]);

  return (
    <PageRoot 
      className="min-h-screen safe-top w-full max-w-full overflow-x-hidden"
      style={{ 
        background: isOverviewTab ? 'hsl(var(--th-bg-canvas))' : '#F8FAFC' 
      }}
    >
      {/* Outer wrapper - full bleed for overview, constrained for other tabs */}
      <div className={isOverviewTab 
        ? "w-full pb-24" 
        : "w-full max-w-5xl mx-auto pb-24"
      }>
        {children}
      </div>
    </PageRoot>
  );
}
