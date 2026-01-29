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
  
  // All Tour Hub tabs use dark cinematic theme for consistency
  const isDarkTab = true; // Unified dark experience across all tabs

  // Set header variant based on tab
  useEffect(() => {
    // Dark tabs use glass-dark header for cinematic hero
    // Other tabs use solid light header
    setVariant(isDarkTab ? 'glass-dark' : 'solid-light');
    return () => setVariant('solid-light');
  }, [setVariant, isDarkTab]);

  return (
    <PageRoot 
      className="min-h-screen safe-top w-full max-w-full overflow-x-hidden"
      style={{ 
        background: isDarkTab ? 'var(--th-bg-canvas)' : '#F8FAFC' 
      }}
    >
      {/* Outer wrapper - full bleed for dark tabs, constrained for light tabs */}
      <div className={isDarkTab 
        ? "w-full pb-24" 
        : "w-full max-w-5xl mx-auto pb-24"
      }>
        {children}
      </div>
    </PageRoot>
  );
}
