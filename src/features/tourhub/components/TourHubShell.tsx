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
      className="min-h-screen safe-top w-full"
      style={{ background: '#F8FAFC' }}
    >
      {/* Let body handle scrolling - don't create nested scroll container */}
      <div className="w-full max-w-5xl mx-auto pb-24">
        {children}
      </div>
    </PageRoot>
  );
}
