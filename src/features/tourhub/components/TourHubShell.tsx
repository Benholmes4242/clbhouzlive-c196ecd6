import { ReactNode } from 'react';
import { PageRoot } from '@/components/layout/PageRoot';
import { useHeader } from '@/contexts/GlobalHeaderContext';
import { useEffect } from 'react';

interface TourHubShellProps {
  children: ReactNode;
}

export function TourHubShell({ children }: TourHubShellProps) {
  const { setVariant } = useHeader();

  // Set header variant for tour pages
  useEffect(() => {
    setVariant('solid-light');
    return () => setVariant('solid-light');
  }, [setVariant]);

  return (
    <PageRoot 
      className="min-h-screen safe-top w-full max-w-full overflow-x-hidden"
      style={{ background: '#F8FAFC' }}
    >
      {/* Outer wrapper with no horizontal padding for full-bleed elements */}
      <div className="w-full max-w-5xl mx-auto pb-24">
        {children}
      </div>
    </PageRoot>
  );
}
