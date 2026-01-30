import { ReactNode } from 'react';
import { PageRoot } from '@/components/layout/PageRoot';
import { useHeader } from '@/contexts/GlobalHeaderContext';
import { useEffect } from 'react';

interface TourHubShellProps {
  children: ReactNode;
}

export function TourHubShell({ children }: TourHubShellProps) {
  const { setVariant } = useHeader();

  // Set header to glass-dark for cinematic tour pages
  useEffect(() => {
    setVariant('glass-dark');
    return () => setVariant('solid-light');
  }, [setVariant]);

  return (
    <PageRoot 
      className="min-h-screen w-full"
      style={{ background: '#F8FAFC' }}
    >
      {/* No extra padding - let content control its own spacing */}
      <div className="w-full max-w-5xl mx-auto pb-24">
        {children}
      </div>
    </PageRoot>
  );
}
